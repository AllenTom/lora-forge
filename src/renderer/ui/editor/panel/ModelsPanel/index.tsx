import { Key, useEffect, useState } from 'react';
import { deleteLoraModel, exportModel, getLoraList } from '../../../../service/training/lora';
import styles from './index.module.css';
import { useAtom } from 'jotai';
import { currentModelAtom, modelsAtom } from '../../model';
import { ipcRenderer } from '../../../../service/base';
import { selectFolder } from '../../../../service/config';
import { ChannelsKeys, LoraOutputModel } from '../../../../../types';
import { useTranslation } from 'react-i18next';
import { ActionMenu, Button, Flex, Item, LabeledValue, Well } from '@adobe/react-spectrum';
import Images from '@spectrum-icons/workflow/Images';
import { generateLoraImage2 } from '../../../../service/training/train';
import ModelText2ImageDialog2 from '../../components/ModelText2ImageDialog';
import Layers from '@spectrum-icons/workflow/Layers';

const ModelsPanel = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'panels.models' });
  const [modelsContext, setModelsContext] = useAtom(modelsAtom);
  const [currentSelectedModel] = useAtom(currentModelAtom);
  const [text2ImageDialogOpen, setText2ImageDialogOpen] = useState(false);
  const [contextModelNames, setContextModelNames] = useState<string[]>([]);
  const [contextProps, setContextProps] = useState<any>();
  const initModels = async () => {
    const models = await getLoraList();
    setModelsContext({
      ...modelsContext,
      list: models
    });
  };
  useEffect(() => {
    initModels();
  }, []);
  const onGenerateImage = async (name: string, props: any) => {
    setContextModelNames([name]);
    setContextProps(props);
    setText2ImageDialogOpen(true);
  };
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.textImageCallback, ({ id, option, img }: any) => {
      setModelsContext({
        ...modelsContext,
        list: modelsContext.list.map(it => {
          if (it.path === id) {
            return {
              ...it,
              outImage: img,
              props: option
            };
          }
          return it;
        })
      });
    });
    ipcRenderer.on(ChannelsKeys.updateLoraModel, (models: LoraOutputModel[]) => {
      setModelsContext({
        ...modelsContext,
        list: modelsContext.list.map(it => {
          const model = models.find(m => m.path === it.path);
          if (!model) {
            return it;
          }
          return model;
        })
      });
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.textImageCallback);
      ipcRenderer.removeAllListeners(ChannelsKeys.updateLoraModel);
    };
  }, [modelsContext]);

  const onExportModel = async () => {
    if (!currentSelectedModel?.path) {
      return;
    }
    const selectDest = await selectFolder({ title: t('selectExportPath') });
    if (!selectDest) {
      return;
    }
    const destPath = selectDest;
    await exportModel({ src: currentSelectedModel.path, dest: destPath });
  };
  const onDeletePath = async (filePath: string) => {
    await deleteLoraModel(filePath);
    await initModels();
  };
  const onApplyGeneratePreviewProps = async (params: any) => {
    if (!contextModelNames.length) {
      return;
    }
    contextModelNames.forEach((name) => {
      const model = modelsContext.list.find(it => it.name === name);
      if (!model) {
        return;
      }
      console.log({ loraModelPath: model.path, props: params, lora: params.lora });

      generateLoraImage2({ loraModelPath: model.path, props: params, lora: params.lora });
    });
    // setText2ImageDialogOpen(false);
  };
  const onDeleteCurrentModel = async () => {
    if (!currentSelectedModel?.path) {
      return;
    }
    onDeletePath(currentSelectedModel.path);
  }
  const modelActionMenuHandler = (key: Key) => {
    switch (key) {
      case 'export':
        onExportModel();
        break;
      case 'delete':
        onDeleteCurrentModel();
        break;

    }

  }
  const onExportCurrentModel = async () => {

  }
  return (
    <>
      <ModelText2ImageDialog2
        isOpen={text2ImageDialogOpen}
        onClose={
          () => {
            setText2ImageDialogOpen(false);
          }
        }
        onOk={onApplyGeneratePreviewProps}
        model={currentSelectedModel}
      />
      <div
        style={{
          display: 'flex',
          height: '100%',
          padding: 16,
          gap: 16,
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative'
          }}>
          <div
            style={{
              position: 'absolute',
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              right: 0,
              left: 0,
              top: 0,
              bottom: 0,
              gap: 16,
              padding: 16,
              overflowX: 'hidden'
            }}
          >
            {
              modelsContext.list.map((model) => {
                const displayImage = model.preview.length > 0 ? model.preview[model.preview.length - 1] : undefined;
                return (
                  <div
                    className={styles.item}
                    style={{
                      width: 180,
                      textAlign: 'center',
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                      padding: 16
                    }}
                    onClick={() => {
                      setModelsContext({
                        ...modelsContext,
                        currentSelectedModelName: model.fileName
                      });
                    }}
                  >
                    {
                      displayImage ?
                        <img src={`file://${displayImage.outImage}?t=${
                          new Date().getTime()
                        }`} style={{
                          width: 180,
                          height: 180,
                          objectFit: 'contain'
                        }} />
                        : <div style={{
                          width: 180,
                          height: 180,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Layers size={'XL'} />
                        </div>
                    }

                    <div style={{ textAlign: 'center' }}>
                      {
                        model.name
                      }
                    </div>
                  </div>
                );
              })
            }
          </div>

        </div>
        <Well
          UNSAFE_style={{
            width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
          {
            currentSelectedModel && (() => {
                const displayImage = currentSelectedModel.preview.length > 0 ? currentSelectedModel.preview[currentSelectedModel.preview.length - 1] : undefined;
                return (
                  <>
                    <>
                      <div
                        style={{
                          textAlign:'right',
                          width: '100%'
                        }}
                      >
                        <ActionMenu isQuiet onAction={modelActionMenuHandler}>
                          <Item key={'export'}>{t('export')}</Item>
                          <Item key={'delete'}>{t('delete')}</Item>
                        </ActionMenu>
                      </div>

                    <img src={`file://${displayImage?.outImage}?t=${new Date().getTime()}`} style={{
                      width: 180,
                      height: 180,
                      objectFit: 'contain'
                    }} />
                      <Flex gap={8} marginTop={16} marginBottom={8}>
                        {
                          ([...currentSelectedModel.preview].reverse() ?? []).slice(1, 5).map((it) => {
                            return (
                              <div>
                                <img src={`file://${it.outImage}?t=${
                                  new Date().getTime()
                                }`} style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'contain'
                                }} />
                              </div>
                            );
                          })
                        }
                      </Flex>
                    <div style={{ textAlign: 'center' }}>
                      {
                        currentSelectedModel.fileName
                      }
                    </div>


                    <div style={{ flex: 1 }}>

                    </div>
                    {
                      displayImage?.props && (
                        <Flex
                          wrap={'wrap'}
                          gap={'size-160'}
                        >
                          <LabeledValue label={t('prompt')} value={displayImage?.props.prompt} width={'100%'} />
                          <LabeledValue label={t('negativePrompt')} value={displayImage?.props.negative_prompt}
                                        width={'100%'} />
                          <LabeledValue label={t('width')} value={displayImage?.props.width} />
                          <LabeledValue label={t('height')} value={displayImage?.props.height} />
                          <LabeledValue label={t('steps')} value={displayImage?.props.steps} />
                          <LabeledValue label={t('samplerName')} value={displayImage?.props.sampler_name} />
                          <LabeledValue label={t('cfgScale')} value={displayImage?.props.cfg_scale} />
                          <LabeledValue label={t('seed')} value={displayImage?.props.seed} />
                          <LabeledValue label={t('lora')} value={displayImage?.props.lora} />
                        </Flex>
                      )
                    }
                    </>

                    <Flex
                      direction={'column'}
                      gap={'size-100'}
                      width={'100%'}
                      marginTop={64}
                    >
                      <Button
                        width={'100%'}
                        variant={'primary'}
                        onPress={() => {
                          if (!currentSelectedModel?.path) {
                            return;
                          }
                          console.log(currentSelectedModel?.path);
                          onGenerateImage(currentSelectedModel.name, displayImage?.props);
                        }}
                      >
                        {t('generatePreviewImage')}
                      </Button>
                    </Flex>
                  </>
                );
              }
            )()
          }
        </Well>
      </div>
    </>
  );
};
export default ModelsPanel;
