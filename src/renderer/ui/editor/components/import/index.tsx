import { useAtom } from 'jotai';
import { preprocessAtom, trainingContextAtom } from '../../model';
import { Key, useEffect, useState } from 'react';
import {
  importImagesFromFiles,
  importImagesFromFolder,
  interruptPreprocess,
  preprocessTrainingData
} from '../../../../service/training/preprocess';
import { ipcRenderer } from '../../../../service/base';
import { ChannelsKeys, PreProcessOut } from '../../../../../types';
import { useTranslation } from 'react-i18next';
import {
  ActionButton,
  Button,
  Content,
  Dialog,
  DialogContainer,
  Flex,
  Grid,
  Header,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  Picker,
  ProgressBar,
  repeat,
  Slider,
  Switch,
  TextField,
  View,
  Well
} from '@adobe/react-spectrum';
import { toast } from 'react-toastify';
import { useConfirmation } from '../../../components/ConfirmDialog/provider';
import ConsoleOut, { ConsoleOutMessage } from '../../../components/ConsoleOut';

export type ImageImportModalProps = {
  isOpen: boolean,
  onClose?: () => void
  width: number
  height: number
}
const ImageImportModal = (
  {
    isOpen = false,
    onClose,
    width,
    height
  }: ImageImportModalProps) => {
  const confirm = useConfirmation();
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.importFromFolder' });
  const [preprocessContext, updatePreprocessContext] = useAtom(preprocessAtom);
  const [trainingContext, setTrainingContext] = useAtom(trainingContextAtom);
  const [messageList, setMessageList] = useState<ConsoleOutMessage[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('进度');
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [isPreprocess, setIsPreprocess] = useState(false);
  const preprocessHandler = () => {
    setMessageList([]);
    setProgress(0);
    setIsPreprocess(true)
    preprocessTrainingData({
      files: imageFiles,
      destPath: trainingContext.preprocessPath,
      width,
      height,
      danbooruCaption: preprocessContext.danbooruCaption,
      clipCaption: preprocessContext.clipCaption,
      blipCaption: preprocessContext.blipCaption,
      wdModelName: preprocessContext.wdModelName,
      wdCaption: preprocessContext.wdCaption,
      wdGeneralThreshold: preprocessContext.wdGeneralThreshold,
      flip: preprocessContext.flip,
      faceFocus: preprocessContext.faceFocus,
      focusAnimeFace: preprocessContext.focusAnimeFace,
      focusAnimeFaceRatio: preprocessContext.focusAnimeFaceRatio,
      focusAnimeBody: preprocessContext.focusAnimeBody,
      focusAnimeBodyRatio: preprocessContext.focusAnimeBodyRatio,
      focusAnimeHalfBody: preprocessContext.focusAnimeHalfBody,
      focusAnimeHalfBodyRatio: preprocessContext.focusAnimeHalfBodyRatio,
      focusToTop: preprocessContext.focusToTop,
      clip2Caption: preprocessContext.clip2Caption
    });
  };
  const createDataset = async (outputImageNames: Array<{
    src: string,
    dest: string,
    name: string
  }>) => {
    // get outputImages
    const outputItems = (trainingContext.datasetSource ?? []).filter((item) => {
      return outputImageNames.find((outputItem) => {
        return outputItem.dest === item.imagePath;
      });
    });
    const newDataset = (trainingContext.datasetFolders ?? []).filter((folder) => {
      return folder.name !== preprocessContext.datasetName;
    });
    newDataset.push({
      name: preprocessContext.datasetName!,
      images: outputItems.map((item) => item.imagePath),
      step: Number(preprocessContext.trainSteps)
    });
    setTrainingContext({
      ...trainingContext,
      datasetFolders: newDataset
    });
    setImageFiles([]);
    onClose?.();
  };
  const interruptHandler = () => {
    interruptPreprocess();
    setIsPreprocess(false)
  };
  useEffect(() => {
    updatePreprocessContext({
      danbooruCaption: false,
      clipCaption: false,
      asDataset: false,
      datasetName: '',
      trainSteps: '100',
      wdCaption: true,
      wdModelName: 'MOAT',
      wdGeneralThreshold: 0.5
    });
  }, [isOpen]);
  const completeHandler = async () => {
    setImageFiles([]);
    onClose?.();
  };
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.preprocessOut, (data: PreProcessOut) => {
      setMessageList([
        {
          type: 'info',
          message: JSON.stringify(data)
        },
        ...messageList
      ]);
      if (data.event === 'preprocess_start') {
        // ToastQueue.info(t('startPreprocess'), {
        //   timeout: 1000
        // })
        toast.info(t('startPreprocess'), {
          position: 'bottom-center',
          autoClose: 2000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: 'dark',
          hideProgressBar: true,
          closeButton: false
        });

        setMessage(t('startPreprocess'));
      } else if (data.event === 'preprocess_done') {
        toast.success(t('preprocessDone'), {
          position: 'bottom-center',
          autoClose: 2000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: 'dark',
          hideProgressBar: true,
          closeButton: false
        });
        setMessage(t('preprocessDone'));
        const outputImageNames: Array<{
          src: string,
          dest: string,
          name: string
        }> = data.vars;
        setProgress(100);
        if (!preprocessContext.asDataset || !preprocessContext.datasetName) {
          completeHandler();
          return;
        }
        createDataset(outputImageNames);
      } else if (data.event === 'process_progress') {
        setProgress((data.vars.index / data.vars.total) * 100);
        setMessage(t('preprocessProgress', { index: data.vars.index, total: data.vars.total }));
      } else if (data.event === 'download_model_progress') {
        setMessage(t('downloadModelProgress', { progress: data.vars.progress }));
      }
    });
    ipcRenderer.on(ChannelsKeys.preprocessError, (data: string) => {
      setMessageList([
        {
          type: 'error',
          message: data
        },
        ...messageList
      ]);
    });
    ipcRenderer.on(ChannelsKeys.preprocessExit, (data: string) => {
     setIsPreprocess(false)
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.preprocessOut);
      ipcRenderer.removeAllListeners(ChannelsKeys.preprocessError);
      ipcRenderer.removeAllListeners(ChannelsKeys.preprocessExit);
    };
  }, [messageList, progress, message, trainingContext,isPreprocess]);
  const onImportFromFolder = async () => {
    const result = await importImagesFromFolder();
    if (result) {
      setImageFiles([
        ...imageFiles,
        ...result.images
      ]);
    }
  };
  const onImportFromFiles = async () => {
    const result = await importImagesFromFiles();
    if (result) {
      setImageFiles([
        ...imageFiles,
        ...result
      ]);
    }
  };
  const onClearAll = () => {
    setImageFiles([]);
  };
  const onHandlerMenu = (key: Key): void => {
    if (key === 'fromFolder') {
      onImportFromFolder();
    } else if (key === 'fromImage') {
      onImportFromFiles();
    } else if (key === 'clearAll') {
      onClearAll();
    }
  };
  const validate = () => {
    const result: { [key: string]: string } = {};
    if (preprocessContext.asDataset) {
      if (!preprocessContext.datasetName || preprocessContext.datasetName === '') {
        result['datasetName'] = t('datasetNameRequired');
      }
      if (!preprocessContext.trainSteps || preprocessContext.trainSteps === '') {
        result['trainSteps'] = t('trainStepsRequired');
      } else if (isNaN(Number(preprocessContext.trainSteps))) {
        result['trainSteps'] = t('trainStepsMustBeNumber');
      } else if (Number(preprocessContext.trainSteps) <= 0) {
        result['trainSteps'] = t('trainStepsMustGreaterThan0');
      }
    }
    if (imageFiles.length === 0) {
      result['imageFiles'] = t('imageFilesRequired');
    }
    return result;
  };
  const validateResult = validate();
  return (
    <DialogContainer
      onDismiss={() => {
        onClose?.();
      }}
      isDismissable={!isPreprocess}
    >
      {
        isOpen && (
          <Dialog width={'70vw'}>
            <Heading>{t('title')}</Heading>
            <Header>
              <MenuTrigger>
                <ActionButton isQuiet={true}>
                  {t('menu')}
                </ActionButton>
                <Menu onAction={onHandlerMenu}>
                  <Item key='fromFolder'>{t('fromFolder')}</Item>
                  <Item key='fromImage'>{t('fromImage')}</Item>
                  <Item key='clearAll'>{t('clearAll')}</Item>
                </Menu>
              </MenuTrigger>
            </Header>
            <Content marginTop={'size-160'}>
              <Flex height={'60vh'} gap={16}>
                <Flex direction={'column'} width={420} gap={'size-160'} height={'100%'}>
                  <Flex
                    direction={'column'}
                    flex={1}
                    position={'relative'}
                  >
                    <Flex
                      top={0}
                      right={0}
                      left={0}
                      bottom={0}
                      UNSAFE_style={{
                        overflowY: 'scroll',
                        paddingRight: 16,
                        paddingBottom: 16
                      }}
                      position={'absolute'}
                      direction={'column'} gap={'size-150'}>
                      <Flex gap='size-150' wrap width={'100%'} direction={'column'}>
                        <Picker
                          label={t('tagger')}
                          flex={1}
                          width={'100%'}
                          selectedKey={(() => {
                            if (preprocessContext.danbooruCaption) {
                              return 'ddb';
                            } else if (preprocessContext.clipCaption) {
                              return 'clip';
                            } else if (preprocessContext.wdCaption) {
                              return 'wd';
                            } else if (preprocessContext.blipCaption) {
                              return 'blip';
                            } else if (preprocessContext.clip2Caption) {
                              return 'clip2';
                            }
                            return 'noTagger';
                          })()}
                          onSelectionChange={(key) => {
                            const data = {
                              danbooruCaption: false,
                              clipCaption: false,
                              wdCaption: false,
                              blipCaption: false,
                              clip2Caption: false
                            };
                            switch (key.toString()) {
                              case 'ddb':
                                data.danbooruCaption = true;
                                break;
                              case 'clip':
                                data.clipCaption = true;
                                break;
                              case 'wd':
                                data.wdCaption = true;
                                break;
                              case 'blip':
                                data.blipCaption = true;
                                break;
                              case 'clip2':
                                data.clip2Caption = true;
                            }
                            updatePreprocessContext(data);
                          }}
                        >
                          <Item key='ddb'>Deepdanbooru</Item>
                          <Item key='clip'>CLIP</Item>
                          <Item key='clip2'>CLIP2</Item>
                          <Item key='blip'>BLIP</Item>
                          <Item key='wd'>Waifu Diffusion</Item>
                          <Item key='noTagger'>{t('noTagger')}</Item>
                        </Picker>
                        {
                          preprocessContext.wdCaption &&
                          <Well>
                            <Flex gap={32} wrap width={'100%'}>
                              <Slider
                                label={t('wdGeneralThreshold')}
                                defaultValue={0.5}
                                isDisabled={!preprocessContext.wdCaption}
                                onChange={(e) => updatePreprocessContext({
                                  wdGeneralThreshold: e
                                })}
                                value={preprocessContext.wdGeneralThreshold}
                                maxValue={1}
                                minValue={0}
                                step={0.01}
                                flex={1}
                              />
                              <Picker
                                label={t('wdModel')}
                                flex={1}
                                selectedKey={preprocessContext.wdModelName}
                                onSelectionChange={(key) => {
                                  updatePreprocessContext({
                                    wdModelName: key.toString()
                                  });
                                }}
                                isDisabled={!preprocessContext.wdCaption}
                              >
                                <Item key='MOAT'>MOAT</Item>
                                <Item key='SwinV2'>SwinV2</Item>
                                <Item key='ConvNext'>ConvNext</Item>
                                <Item key='ConvNextV2'>ConvNextV2</Item>
                                <Item key='ViT'>ViT</Item>
                              </Picker>
                            </Flex>
                          </Well>
                        }

                      </Flex>
                      <Flex gap='size-150' wrap width={'100%'} direction={'column'}>
                        <Picker
                          label={t('focusCrop')}
                          flex={1}
                          width={'100%'}
                          selectedKey={(() => {
                            if (preprocessContext.faceFocus) {
                              return 'focusPerson';
                            } else if (preprocessContext.focusAnimeFace) {
                              return 'focusAnimeFace';
                            } else if (preprocessContext.focusAnimeBody) {
                              return 'focusAnimeBody';
                            } else if (preprocessContext.focusAnimeHalfBody) {
                              return 'focusAnimeHalfBody';
                            }
                            return 'none';
                          })()}
                          onSelectionChange={(key) => {
                            const data = {
                              faceFocus: false,
                              focusAnimeFace: false,
                              focusAnimeBody: false,
                              focusAnimeHalfBody: false
                            };
                            switch (key.toString()) {
                              case 'focusPerson':
                                data.faceFocus = true;
                                break;
                              case 'focusAnimeFace':
                                data.focusAnimeFace = true;
                                break;
                              case 'focusAnimeBody':
                                data.focusAnimeBody = true;
                                break;
                              case 'focusAnimeHalfBody':
                                data.focusAnimeHalfBody = true;
                                break;
                            }
                            updatePreprocessContext(data);
                          }}
                        >
                          <Item key='none'>{t('noFocus')}</Item>
                          <Item key='focusPerson'>{t('focusPerson')}</Item>
                          <Item key='focusAnimeFace'>{t('focusAnimeFace')}</Item>
                          <Item key='focusAnimeBody'>{t('focusAnimeBody')}</Item>
                          <Item key='focusAnimeHalfBody'>{t('focusAnimeHalfBody')}</Item>
                        </Picker>
                        {

                          (
                            preprocessContext.focusAnimeBody ||
                            preprocessContext.focusAnimeHalfBody ||
                            preprocessContext.focusAnimeFace
                          ) &&
                          <Well>
                            <Flex gap={32} wrap width={'100%'}>
                              {
                                preprocessContext.focusAnimeFace && (
                                  <Slider
                                    label={t('focusAnimeRatio')}
                                    defaultValue={1}
                                    onChange={(e) => updatePreprocessContext({
                                      focusAnimeFaceRatio: e
                                    })}
                                    value={preprocessContext.focusAnimeFaceRatio}
                                    maxValue={2}
                                    minValue={-1}
                                    step={0.01}
                                    flex={1}
                                  />
                                )
                              }
                              {
                                preprocessContext.focusAnimeBody && (
                                  <Slider
                                    label={t('focusAnimeBodyRatio')}
                                    defaultValue={1}
                                    onChange={(e) => updatePreprocessContext({
                                      focusAnimeBodyRatio: e
                                    })}
                                    value={preprocessContext.focusAnimeBodyRatio}
                                    maxValue={2}
                                    minValue={-1}
                                    step={0.01}
                                    flex={1}
                                  />
                                )
                              }
                              {
                                preprocessContext.focusAnimeHalfBody && (
                                  <Slider
                                    label={t('focusAnimeHalfBodyRatio')}
                                    defaultValue={1}
                                    onChange={(e) => updatePreprocessContext({
                                      focusAnimeHalfBodyRatio: e
                                    })}
                                    value={preprocessContext.focusAnimeHalfBodyRatio}
                                    maxValue={2}
                                    minValue={-1}
                                    step={0.01}
                                    flex={1}
                                  />
                                )
                              }
                              {
                                (preprocessContext.focusAnimeBody || preprocessContext.focusAnimeHalfBody) && (
                                  <Switch
                                    onChange={(e) => updatePreprocessContext({
                                      focusToTop: e
                                    })}
                                    isSelected={preprocessContext.focusToTop}
                                  >
                                    {t('focusToTop')}
                                  </Switch>
                                )
                              }

                            </Flex>
                          </Well>
                        }

                      </Flex>
                      <Switch
                        onChange={(e) => updatePreprocessContext({
                          flip: e
                        })}
                        isSelected={preprocessContext.flip}
                      >
                        {t('flip')}
                      </Switch>
                      <Flex gap='size-150' wrap width={'100%'}>
                        <Switch
                          onChange={(e) => updatePreprocessContext({
                            asDataset: e
                          })}
                          isSelected={preprocessContext.asDataset}
                        >
                          {t('autoCreateWithImport')}
                        </Switch>

                      </Flex>
                      {
                        preprocessContext.asDataset &&
                        <Well>
                          <Flex gap='size-150' wrap width={'100%'}>
                            <TextField
                              flex={1}
                              label={t('folderName')}
                              onChange={(e) => updatePreprocessContext({
                                datasetName: e
                              })}
                              value={preprocessContext.datasetName}
                              isDisabled={!preprocessContext.asDataset}
                              validationState={validateResult['datasetName'] ? 'invalid' : undefined}
                              errorMessage={validateResult['datasetName']}
                            />
                            <TextField
                              flex={1}
                              label={t('step')}
                              onChange={(e) => updatePreprocessContext({
                                trainSteps: e
                              })}
                              value={preprocessContext.trainSteps}
                              isDisabled={!preprocessContext.asDataset}
                              errorMessage={validateResult['trainSteps']}
                              validationState={validateResult['trainSteps'] ? 'invalid' : undefined}
                            />
                          </Flex>
                        </Well>
                      }
                    </Flex>
                  </Flex>
                  <div style={{
                    flexDirection: 'column',
                    marginTop: 32
                  }}>
                    <div style={{ marginBottom: 16 }}>
                      <ProgressBar value={progress} width={'100%'} label={message} />
                    </div>
                    {
                      t('outputMessage')
                    }
                    <div style={{ overflowY: 'auto', }}>
                    <ConsoleOut
                      messages={messageList}
                      style={{
                        backgroundColor: '#2a2a2a',
                        height: 120
                      }}
                    />
                    </div>
                  </div>

                </Flex>
                {
                  imageFiles.length == 0 ?
                    <div style={{
                      flex: 1,

                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <div>
                        {t('noImage')}
                      </div>
                    </div> :
                    <Grid
                      flex={1}
                      columns={repeat('auto-fit', 120)}
                      autoRows={120}
                      justifyContent='left'
                      UNSAFE_style={{
                        overflowY: 'auto'
                      }}
                      height={'60vh'}
                      columnGap={'size-100'}
                      gap='size-100'>
                      {
                        imageFiles.map((imagePath, index) => {
                          return (
                            <View key={index}>
                              <img src={`file://${imagePath}`}
                                   style={{ objectFit: 'contain', width: 120, height: 120 }} />
                            </View>
                          );
                        })
                      }

                    </Grid>
                }
              </Flex>
              <Flex justifyContent={'right'} gap={'size-100'} marginTop={'size-325'}>
                <Button
                  onPress={preprocessHandler}
                  variant={'accent'}
                  isDisabled={isPreprocess}
                >{t('importBtn')}</Button>
                <Button
                  onPress={interruptHandler}
                  variant={'negative'}
                  isDisabled={!isPreprocess}
                >{t('interrupt')}</Button>
                <Button
                  onPress={onClose}
                  variant={'secondary'}
                  isDisabled={isPreprocess}
                >
                  {t('close')}
                </Button>
              </Flex>
            </Content>

          </Dialog>
        )
      }

    </DialogContainer>
  );
};
export default ImageImportModal;
