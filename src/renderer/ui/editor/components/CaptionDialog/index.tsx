import { CaptionOut, ChannelsKeys, DatasetItem } from '../../../../../types';
import {
  ActionButton,
  Button,
  Content,
  Dialog,
  DialogContainer, Divider,
  Flex,
  Heading,
  Item,
  ListView,
  Picker,
  Slider,
  Well
} from '@adobe/react-spectrum';
import { useTranslation } from 'react-i18next';
import { interruptCaption, makeCaption } from '../../../../service/training/preprocess';
import { useEffect, useState } from 'react';
import { ipcRenderer } from '../../../../service/base';
import { diff } from 'radash';
import { useFormik } from 'formik';
import { useConfirmation } from '../../../components/ConfirmDialog/provider';
import ConsoleOut, { ConsoleOutMessage } from '../../../components/ConsoleOut';

export type UpdateData = {
  imageName: string,
  newCaption: string[]
}
export type CaptionDialogProps = {
  isOpen: boolean,
  onClose: () => void
  images: DatasetItem[],
  onApply: (data: UpdateData[]) => void
}
export type EditCaptionItem = DatasetItem & {
  captionResult?: { tag: string, rank?: number }[]
  updatedCaption?: string[]
}
const CaptionDialog = (
  {
    images,
    isOpen,
    onClose,
    onApply
  }: CaptionDialogProps
) => {
  const confirm = useConfirmation();
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.caption' });
  const [updatedDatasetItems, setUpdatedDatasetItems] = useState<EditCaptionItem[]>([]);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [isMaking, setIsMaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<ConsoleOutMessage[]>([]);
  const formik = useFormik({
    initialValues: {
      threshold: 0.7,
      tagger: 'deepdanbooru',
      general_threshold: 0.5,
      model: 'MOAT'
    },
    onSubmit: (values) => {

    }
  });
  const getTaggerId = () => {
    if (formik.values.tagger === 'deepdanbooru') {
      return 'deepdanbooru';
    }
    if (formik.values.tagger === 'clip') {
      return 'clip';
    }
    if (formik.values.tagger === 'clip2') {
      return 'clip2';
    }
    if (formik.values.tagger === 'blip') {
      return 'blip';
    }
    if (formik.values.tagger === 'wd14') {
      switch (formik.values.model) {
        case 'MOAT':
          return 'wd14-moat';
        case 'SwinV2':
          return 'wd14-swinv2';
        case 'ConvNext':
          return 'wd14-convnext';
        case 'ConvNextV2':
          return 'wd14-convnextv2';
        case 'ViT':
          return 'wd14-vit';
      }
    }
    return 'unknown';
  };
  const onMakeCaption = () => {
    setIsMaking(true);
    setSelectedItemName(null);
    setProgress(0);
    setTotal(images.length);
    makeCaption({
      imagePaths: images.map(it => it.imagePath),
      ...formik.values,
      taggerId: getTaggerId()
    });
    setMessage([]);
  };
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.captionOut, (data: CaptionOut) => {
      setMessage([
        ...message,
        {
          type: 'info',
          message: JSON.stringify(data)
        }
      ]);
      console.log(data);
      console.log(updatedDatasetItems);
      let newUpdatedDatasetItems = updatedDatasetItems;
      newUpdatedDatasetItems = newUpdatedDatasetItems.map(it => {
        if (it.imageName === data.filename) {
          return {
            ...it,
            captionResult: data.tags.sort((a, b) => b.rank - a.rank),
            updatedCaption: data.tags.map(it => it.tag)
          };
        }
        return it;
      });
      console.log(newUpdatedDatasetItems);
      setUpdatedDatasetItems(newUpdatedDatasetItems);
      setSelectedItemName(images[0].imageName);
      setProgress(progress + 1);
    });
    ipcRenderer.on(ChannelsKeys.captionError, (data: CaptionOut) => {
      setMessage([
        ...message,
        {
          type: 'error',
          message: JSON.stringify(data)
        }
      ]);
      setIsMaking(false);
    });
    ipcRenderer.on(ChannelsKeys.captionDone, (data: CaptionOut) => {
      setMessage([
        ...message,
        {
          type: 'info',
          message: JSON.stringify(data)
        }
      ]);
      setIsMaking(false);
    });
    ipcRenderer.on(ChannelsKeys.captionStdError, (data: string) => {
      setMessage([
        ...message,
        {
          type: 'error',
          message: data
        }
      ]);
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.captionOut);
      ipcRenderer.removeAllListeners(ChannelsKeys.captionError);
      ipcRenderer.removeAllListeners(ChannelsKeys.captionDone);
    };
  }, [updatedDatasetItems, isMaking, message]);
  useEffect(() => {
    setUpdatedDatasetItems(images.map(it => {
      return {
        ...it
      };
    }));
  }, [images]);
  const getItemCaption = (item: EditCaptionItem) => {
    const exclude = item.captions ?? [];
    if (item.captionResult) {
      return diff(item.captionResult, exclude.map(it => ({ tag: it, rank: 0 })), f => f.tag);
    }
    return [];
  };
  const getImages = (): EditCaptionItem[] => {
    return images.map(img => {
      const editableItem = updatedDatasetItems.find(it => it.imagePath === img.imagePath);
      if (editableItem) {
        return editableItem;
      }
      return img;
    });
  };
  const onImageClick = (item: EditCaptionItem) => {
    setSelectedItemName(item.imageName);
  };
  const isSelected = (item: EditCaptionItem) => {
    return selectedItemName === item.imageName;
  };
  const onCaptionsUpdate = (caption: string[], item: EditCaptionItem) => {
    const newUpdatedDatasetItems = updatedDatasetItems.filter(it => it.imagePath !== item.imagePath);
    newUpdatedDatasetItems.push({
      ...item,
      updatedCaption: caption
    });
    setUpdatedDatasetItems(newUpdatedDatasetItems);
  };
  const getSelectedItem = (): EditCaptionItem | null => {
    return updatedDatasetItems.find(it => it.imageName === selectedItemName) ?? null;
  };
  const onSave = () => {
    onApply(updatedDatasetItems.map(it => {
      return {
        imageName: it.imageName,
        newCaption: it.updatedCaption ?? []
      };
    }));
  };
  const onInterruptCaption = async () => {
    await interruptCaption();
    setIsMaking(false);
  };
  const isCaptionSelected = (item: EditCaptionItem, tagName: string) => {

  };
  return (
    <DialogContainer onDismiss={onClose} isDismissable>
      {
        isOpen && (
          <Dialog width={'70vw'}>
            <Heading>{t('title')}</Heading>
            <Content marginTop={16}>
              <Flex direction={'row'} minHeight={'40vh'}>
                <Flex alignItems={'center'}>
                  <Well flex={1} marginEnd={16}>
                    <Flex gap={16} direction={'column'} height={'50vh'}>
                      <Flex gap={16} direction={'column'} flex={1}>
                        <Picker
                          label={t('tagger')}
                          selectedKey={formik.values.tagger}
                          onSelectionChange={(v) => formik.setFieldValue('tagger', v.toString())}
                          marginBottom={32}
                        >
                          <Item key={'deepdanbooru'}>Deepdanbooru</Item>
                          <Item key={'clip'}>Clip</Item>
                          <Item key={'clip2'}>Clip2</Item>
                          <Item key={'blip'}>Blip</Item>
                          <Item key={'wd14'}>WaifuDiffusion</Item>

                        </Picker>
                        {
                          formik.values.tagger === 'deepdanbooru' && (
                            <Slider
                              label={t('threshold')}
                              defaultValue={0.7}
                              step={0.01}
                              maxValue={1}
                              minValue={0.01}
                              onChange={(v) => formik.setFieldValue('threshold', v)}
                              value={formik.values.threshold}
                            />
                          )
                        }
                        {
                          formik.values.tagger === 'wd14' && (
                            <Flex gap={16} direction={'column'}>
                              <Slider
                                label={t('wdGeneralThreshold')}
                                defaultValue={0.7}
                                step={0.01}
                                maxValue={1}
                                minValue={0.01}
                                flex={1}
                                onChange={(v) => formik.setFieldValue('general_threshold', v)}
                                value={formik.values.general_threshold}
                              />
                              <Picker
                                label={t('wdModel')}
                                selectedKey={formik.values.model}
                                onSelectionChange={(key) => {
                                  formik.setFieldValue('model', key.toString());
                                }}
                              >
                                <Item key='MOAT'>MOAT</Item>
                                <Item key='SwinV2'>SwinV2</Item>
                                <Item key='ConvNext'>ConvNext</Item>
                                <Item key='ConvNextV2'>ConvNextV2</Item>
                                <Item key='ViT'>ViT</Item>
                              </Picker>
                            </Flex>
                          )
                        }
                      </Flex>
                      <Flex gap={8} direction={'column'} >
                        <ActionButton onPress={onMakeCaption} isDisabled={isMaking}>
                          {
                            isMaking ? `${t('captioning')} (${progress}/${total})` : t('caption')
                          }
                        </ActionButton>
                        <ActionButton onPress={onInterruptCaption} isDisabled={!isMaking}>
                          {
                            isMaking ? t('interrupt') : t('interrupt')
                          }
                        </ActionButton>
                      </Flex>
                    </Flex>
                  </Well>

                </Flex>
                <Flex flex={1} direction={'column'}>
                  <Flex
                    marginEnd={16}
                    position={'relative'}
                    flex={1}
                  >
                    <div
                      style={{
                        gap: 8,
                        display: 'flex',
                        flexWrap: 'wrap',
                        overflowY: 'auto',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignContent: 'flex-start'
                      }}
                    >
                      {
                        getImages().map((image, index) => {
                          return (
                            <div
                              style={{
                                width: 96, height: 96,
                                border: isSelected(image) ? '3px solid aqua' : '3px solid #1D1D1D'
                              }}
                              onClick={() => onImageClick(image)}

                            >
                              <img src={`file://${image.imagePath}`} style={{
                                objectFit: 'contain'
                              }} width={96} height={96} />
                            </div>
                          );
                        })
                      }
                    </div>
                  </Flex>
                  <div style={{
                    marginTop: 16,
                    marginBottom: 8
                  }}>
                    {t('processOutput')}
                  </div>
                  <ConsoleOut
                    messages={message}
                    style={{
                      backgroundColor: '#2a2a2a',
                      height: 120
                    }} />
                </Flex>

                <Flex width={220} direction={'column'} gap={8}>
                  {t('newTagToAdd')}
                  <Flex
                    marginEnd={16}
                    position={'relative'}
                    flex={1}
                  >
                    <div
                      style={{
                        gap: 8,
                        display: 'flex',
                        flexWrap: 'wrap',
                        overflowY: 'auto',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignContent: 'flex-start',
                        paddingRight: 8
                      }}
                    >
                      {
                        getSelectedItem() && (
                          getItemCaption(getSelectedItem()!).map((caption, index) => {
                            const selectedItem = getSelectedItem()!;
                            const updatedCaption = selectedItem.updatedCaption ?? [];
                            const isSelected = updatedCaption.includes(caption.tag);
                            const onClick = () => {
                              let itemCaption = selectedItem.updatedCaption ?? [];
                              if (itemCaption.includes(caption.tag)) {
                                itemCaption = itemCaption.filter(it => it !== caption.tag);
                              } else {
                                itemCaption.push(caption.tag);
                              }
                              setUpdatedDatasetItems(updatedDatasetItems.map(it => {
                                if (it.hash === selectedItem?.hash) {
                                  return {
                                    ...it,
                                    updatedCaption: itemCaption
                                  };
                                }
                                return it;
                              }));
                            };
                            return (
                              <div
                                key={caption.tag}
                                style={{
                                  backgroundColor: isSelected ? '#008252' : 'transparent',
                                  padding: 4,
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  gap: 16,
                                  alignItems: 'center',
                                  width: '100%'
                                }}
                                onClick={onClick}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    lineBreak: 'anywhere',
                                    fontWeight: isSelected ? 'bold' : 'normal'
                                  }}
                                >
                                  {caption.tag}
                                </div>
                                <div>
                                  {caption.rank?.toFixed(2)}
                                </div>
                              </div>
                            );
                          })
                        )
                      }
                    </div>
                  </Flex>

                </Flex>

              </Flex>
              <Flex width={'100%'} justifyContent={'end'} gap={16} marginTop={32}>
                <Button variant={'accent'} onPress={onSave}>
                  {
                    t('save')
                  }
                </Button>
                <Button variant={'primary'} onPress={onClose}>
                  {
                    t('cancel')
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
export default CaptionDialog;
