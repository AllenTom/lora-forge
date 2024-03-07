import { useFormik } from 'formik';
import {
  ChannelsKeys,
  LoraOutputModel,
  LoraPreviewImage,
  SdModel,
  SDWParameter,
  Text2ImageOptions
} from '../../../../../types';
import React, { useEffect, useState } from 'react';
import { getPreviewProps, interruptImageGeneration } from '../../../../service/training/train';
import { useTranslation } from 'react-i18next';
import {
  ActionButton,
  Content,
  Dialog,
  DialogContainer,
  Flex,
  Heading,
  Item,
  Picker,
  Slider, Switch,
  Text,
  TextArea,
  TextField
} from '@adobe/react-spectrum';
import { getStableDiffusionModelList } from '../../../../service/training/lora';
import { defaultSamplers } from '../../data';
import ConsoleOut, { ConsoleOutMessage } from '../../../components/ConsoleOut';
import { ipcRenderer } from '../../../../service/base';
import Play from '@spectrum-icons/workflow/Play';
import Stop from '@spectrum-icons/workflow/Stop';

export type ModelText2ImageDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onOk: (params: any) => void,
  model: LoraOutputModel | undefined
}
export const text2Image: Text2ImageOptions = {
  negative_prompt: '',
  width: 512,
  height: 512,
  batch_size: 1,
  prompt: 'face',
  steps: 20,
  sampler_name: 'ddim',
  seed: -1,
  cfg_scale: 7,
  lora: 0.8,
  randomSeed:true
} as any;
const ModelText2ImageDialog2 = (
  {
    isOpen,
    onClose,
    onOk,
    model
  }: ModelText2ImageDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.configGeneratePreviewProps' });

  const [models, setModels] = useState<SdModel[]>([]);
  const [messages, setMessages] = useState<ConsoleOutMessage[]>([]);
  const [currentSelectedPreviewImagePath, setCurrentSelectedPreviewImagePath] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const init = async () => {
    try {
      const models = await getStableDiffusionModelList();
      setModels(models);
      console.log(formik.values.sdmodel);
      if (models.length > 0 && !formik.values.sdmodel) {
        formik.setFieldValue('sdmodel', models[0].name);
      }
      console.log(models);
    } catch (e) {
    }
  };
  useEffect(() => {
    if (isOpen) {
      init();
    }
  }, [isOpen]);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.generateImageOut, (data: string) => {
      setMessages([
        {
          type: 'info',
          message: data
        },
        ...messages
      ]);
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.generateImageOut);
    };
  }, [messages]);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.generateImageExit, (data: any) => {
      setIsGenerating(false);
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.generateImageExit);
    };
  }, [isGenerating]);
  const getProps = () => {
    const Props: SDWParameter[] = [
      {
        name: 'sdmodel',
        label: t('sdModel'),
        type: 'string',
        default: '',
        description: t('sdModel'),
        choices: models.map((item) => item.name)
      },
      {
        name: 'prompt',
        label: t('prompt'),
        type: 'string',
        default: '1girl',
        description: t('prompt'),
        textArea: true
      },
      {
        name: 'negative_prompt',
        label: t('negativePrompt'),
        type: 'string',
        default: '',
        description: t('negativePrompt'),
        textArea: true
      },
      {
        name: 'width',
        label: t('width'),
        type: 'number',
        default: 512,
        description: t('width'),
        num: {
          min: 128,
          max: 2048,
          step: 8
        }
      },
      {
        name: 'height',
        label: t('height'),
        type: 'number',
        default: 512,
        description: t('height'),
        num: {
          min: 128,
          max: 2048,
          step: 8
        }
      },
      {
        name: 'steps',
        label: t('steps'),
        type: 'number',
        default: 20,
        description: t('steps'),
        num: {
          min: 1,
          max: 150,
          step: 1
        }
      },
      {
        name: 'sampler_name',
        label: t('samplerName'),
        type: 'string',
        default: 'ddim',
        description: t('samplerName'),
        choices: defaultSamplers
      },
      {
        name: 'cfg_scale',
        label: t('cfgScale'),
        type: 'number',
        default: 7,
        description: t('cfgScale')
      },
      {
        name: 'seed',
        label: t('seed'),
        type: 'number',
        default: -1,
        description: t('seed')
      },
      {
        name: 'randomSeed',
        label: t('randomSeed'),
        type: 'boolean',
        default: true,
        description: t('randomSeed')
      },
      {
        name: 'lora',
        label: t('lora'),
        type: 'number',
        default: 0.8,
        description: t('lora'),
        num: {
          min: 0,
          max: 1,
          step: 0.01
        }
      },
      {
        name: 'batch_size',
        label: t('batchSize'),
        type: 'number',
        default: 1,
        description: t('batchSize'),
        num: {
          min: 1,
          max: 20,
          step: 1
        }
      },
      {
        name:'n_iter',
        label:t('iter'),
        type:'number',
        default:1,
        description:t('iter'),
        num: {
          min: 1,
          max: 20,
          step: 1
        }
      }
    ];
    return Props;
  };
  const loadConfig = async () => {
    const config = await getPreviewProps();
    if (config) {
      await formik.setValues(config);
    }
  };
  useEffect(() => {
    if (isOpen && !model) {
      loadConfig();
    }
    if (isOpen && model) {
      const previewImage = model.preview.length > 0 ? model.preview[model.preview.length - 1] : undefined;
      if (previewImage) {
        onPreviewImageClick(previewImage);
      }
    }
  }, [isOpen, model]);
  const formik = useFormik<Text2ImageOptions | any>(
    {
      initialValues: text2Image,
      onSubmit: values => {
        // cast values
        const params = {} as any;
        getProps().forEach((item) => {
          if (item.type === 'number') {
            params[item.name] = Number(values[item.name]);
          } else {
            params[item.name] = values[item.name];
          }
        });
        params.sdmodel = models.find((item) => item.name === values.sdmodel)?.path;
        onOk(params);
        setIsGenerating(true);
        setMessages([])
      }
    });
  const getCurrentSelectedPreviewImagePath = () => {
    if (!model) {
      return undefined;
    }
    if (!model.preview.find((item) => item.outImage === currentSelectedPreviewImagePath)) {
      return undefined;
    }
    if (currentSelectedPreviewImagePath) {
      return currentSelectedPreviewImagePath;
    }
    if (model && model.preview.length > 0) {
      return model.preview[0].outImage;
    }
    return undefined;
  };
  const onPreviewImageClick = (previewImage: LoraPreviewImage) => {
    setCurrentSelectedPreviewImagePath(previewImage.outImage);
    formik.setValues(previewImage.props);
    formik.setFieldValue('sdmodel', previewImage.modelName);
    console.log(previewImage.props);
  };
  const isPreviewImageSelected = (previewImage: LoraPreviewImage) => {
    return previewImage.outImage === currentSelectedPreviewImagePath;
  };
  const onInterrupt = () => {
    interruptImageGeneration();
  };

  return (
    <DialogContainer onDismiss={onClose} isDismissable={!isGenerating}>
      {
        isOpen && (
          <Dialog width={'70vw'}>
            <Heading>{t('title')}</Heading>
            <Content>
              <Flex gap={16} marginTop={32}>
                <Flex
                  direction={'column'}
                  gap={16}
                >
                  <Flex gap={16} UNSAFE_style={{
                    paddingLeft: 16,
                    paddingRight: 16
                  }}>
                    <ActionButton
                      flex={2}
                      onPress={formik.submitForm}
                      isDisabled={isGenerating}
                    >
                      <Play />
                      <Text>
                        {t('generate')}

                      </Text>
                    </ActionButton>
                    <ActionButton
                      flex={1}
                      onPress={onInterrupt}
                      isDisabled={!isGenerating}
                    >
                      <Stop />
                      <Text>
                        {t('interrupt')}
                      </Text>
                    </ActionButton>
                  </Flex>
                  <Flex
                    height={'50vh'}
                    direction={'column'}
                    gap={'size-160'}
                    UNSAFE_style={{
                      overflowY: 'auto',
                      padding: 16
                    }}
                    width={320}
                  >
                    {
                      getProps().map((item, index) => {
                        const renderField = () => {
                          if (item.choices) {
                            return (
                              <Picker
                                label={item.label}
                                onSelectionChange={(e) => formik.setFieldValue(item.name, e)}
                                width={'100%'}
                                selectedKey={formik.values[item.name]}
                              >
                                {
                                  item.choices.map((choice) => {
                                    return (
                                      <Item key={choice}>{choice}</Item>
                                    );
                                  })
                                }
                              </Picker>
                            );
                          }
                          if (item.textArea) {
                            return (
                              <TextArea
                                name={item.name}
                                label={item.label}
                                onChange={(e) => formik.setFieldValue(item.name, e)}
                                value={formik.values[item.name]}
                                width={'100%'}
                              />
                            );
                          }
                          if (item.num) {
                            return (
                              <Slider
                                UNSAFE_style={{
                                  boxSizing:'border-box'
                                }}
                                label={item.label}
                                value={formik.values[item.name]}
                                onChange={(v) => formik.setFieldValue(item.name, v)}
                                minValue={item.num.min}
                                maxValue={item.num.max}
                                width={'98%'}
                                step={item.num.step} />
                            );
                          }
                          if (item.type === 'boolean') {
                            return (
                              <Switch isSelected={formik.values[item.name]} onChange={(isSelect) => formik.setFieldValue(item.name,isSelect)} width={"100%"}>
                                {item.label}
                              </Switch>
                            );
                          }
                          return (
                            <TextField
                              name={item.name}
                              label={item.label}
                              onChange={(e) => formik.setFieldValue(item.name, e)}
                              value={formik.values[item.name]}
                              width={'100%'}
                            />
                          );
                        };
                        return (
                          <div style={{ width: '100%' }}>
                            {renderField()}
                          </div>
                        );
                      })
                    }
                  </Flex>
                </Flex>

                <Flex flex={1} direction={'column'}>
                  <Flex flex={1} gap={16}>
                    <Flex flex={1} gap={8} wrap={'wrap'} alignContent={'start'}>
                      {
                        model && model.preview.length > 0 && (
                          model.preview.map((item) => {
                            return (
                              <img
                                src={`file://${item.outImage}`}
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: 'contain',
                                  border: isPreviewImageSelected(item) ? '2px solid aqua' : '2px solid transparent'
                                }}
                                onClick={() => {
                                  onPreviewImageClick(item);
                                }}
                              />
                            );
                          })
                        )
                      }
                    </Flex>
                    <div>
                      {
                        getCurrentSelectedPreviewImagePath() && (
                          <img src={`file://${getCurrentSelectedPreviewImagePath()}`} style={{
                            width: 240,
                            height: 240,
                            objectFit: 'contain'
                          }} />
                        )
                      }
                    </div>
                  </Flex>

                  <Flex width={'100%'}>
                    <ConsoleOut
                      style={{
                        height: 120,
                        overflowY: 'auto',
                        backgroundColor: '#2a2a2a',
                        width: '100%'
                      }}
                      messages={messages}
                      key={'console'}
                    />
                  </Flex>
                </Flex>
              </Flex>

            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};
export default ModelText2ImageDialog2;
