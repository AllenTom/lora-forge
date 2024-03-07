import { useFormik } from 'formik';
import { SdModel, SDWParameter, Text2ImageOptions } from '../../../../../types';
import React, { useEffect, useState } from 'react';
import { getPreviewProps } from '../../../../service/training/train';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Content,
  Dialog,
  DialogContainer,
  Flex,
  Heading,
  Item,
  Picker,
  TextField
} from '@adobe/react-spectrum';
import { getStableDiffusionModelList } from '../../../../service/training/lora';
import { defaultSamplers } from '../../data';

export type Text2ImageDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onOk: (params: any) => void,
  props?:any
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
  lora:0.8
} as any;
const Text2ImageDialog2 = (
  {
    isOpen,
    onClose,
    onOk,
    props,
  }: Text2ImageDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.configGeneratePreviewProps' });
  const [models, setModels] = useState<SdModel[]>([]);
  const init = async () => {
    try {
      const models = await getStableDiffusionModelList()
      setModels(models);
      console.log(formik.values.sdmodel)
      if (models.length > 0 && !formik.values.sdmodel){
        formik.setFieldValue('sdmodel', models[0].name);
      }
      console.log(models)
    } catch (e) {
    }
  };
  useEffect(() => {
    if (isOpen) {
      init();
    }
  }, [isOpen]);
  const getProps = () => {
    const Props: SDWParameter[] = [
      {
        name: 'sdmodel',
        label:t('sdModel'),
        type: 'string',
        default: '',
        description:t('sdModel'),
        choices: models.map((item) => item.name)
      },
      {
        name: 'prompt',
        label:t('prompt'),
        type: 'string',
        default: '1girl',
        description:t('prompt')
      },
      {
        name: 'negative_prompt',
        label:t('negativePrompt'),
        type: 'string',
        default: '',
        description:t('negativePrompt')
      },
      {
        name: 'width',
        label:t('width'),
        type: 'number',
        default: 512,
        description:t('width')
      },
      {
        name: 'height',
        label:t('height'),
        type: 'number',
        default: 512,
        description:t('height')
      },
      {
        name: 'steps',
        label:t('steps'),
        type: 'number',
        default: 20,
        description:t('steps')
      },
      {
        name: 'sampler_name',
        label:t('samplerName'),
        type: 'string',
        default: 'ddim',
        description:t('samplerName'),
        choices: defaultSamplers
      },
      {
        name: 'cfg_scale',
        label:t('cfgScale'),
        type: 'number',
        default: 7,
        description:t('cfgScale')
      },
      {
        name: 'seed',
        label:t('seed'),
        type: 'number',
        default: -1,
        description:t('seed')
      },
      {
        name: 'lora',
        label:t('lora'),
        type: 'number',
        default: 0.8,
        description:t('lora')
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
    if (isOpen && !props){
      loadConfig();
    }
    if (isOpen && props){
      formik.setValues(props);
    }
  }, [isOpen,props]);
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
      }
    });
  return (
    <DialogContainer onDismiss={onClose} isDismissable >
      {
        isOpen && (
          <Dialog width={'70vw'}>
            <Heading>{t('title')}</Heading>
            <Content>
              <Flex
                marginTop={32}
                height={'50vh'}
                direction={'column'}
                gap={'size-160'}
                UNSAFE_style={{
                  overflowY: 'auto',
                  padding: 16
                }}
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
                    return (
                      <TextField
                        name={item.name}
                        label={item.label}
                        onChange={(e) => formik.setFieldValue(item.name, e)}
                        value={formik.values[item.name] }
                        width={'100%'}
                      />
                    );
                  };
                  return (
                    <div style={{ width:"100%" }}>
                      {renderField()}
                    </div>
                  );
                })
              }
              </Flex>
              <Flex justifyContent={'right'} gap={'size-100'} marginTop={'size-325'}>
                <Button
                  onPress={formik.submitForm}
                  variant={'accent'}>
                  {
                    t('apply')
                  }
                </Button>
              </Flex>
            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};
export default Text2ImageDialog2;
