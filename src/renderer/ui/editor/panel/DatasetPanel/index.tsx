import clsx from 'clsx';
import styles from './index.module.css';
import { useAtom } from 'jotai';
import { datasetAtom, trainingContextAtom, updateDatasetAtom, updateTrainingContextAtom } from '../../model';
import { diff, sort, unique } from 'radash';
import { DatasetFolder, DatasetItem } from '../../../../../types';
import React, { Key, ReactElement, useEffect, useState } from 'react';
import { ItemsAction } from '../../index';
import { useTranslation } from 'react-i18next';
import CaptionDialog from '../../components/CaptionDialog';
import {
  ActionButton,
  ActionMenu,
  Flex,
  Item,
  Menu,
  MenuTrigger, Section,
  TagGroup,
  Text,
  View,
  Well
} from '@adobe/react-spectrum';
import {
  removePreprocessImage,
  segAnimeImages,
  segAnimeImagesInterrupt
} from '../../../../service/training/preprocess';
import Close from '@spectrum-icons/workflow/Close';
import Filter from '@spectrum-icons/workflow/Filter';
import EditDatasetFolderDialog from '../../components/EditDatasetFolderDialog';
import NewFolderDialog from '../../components/NewFolderDialog';
import AddTagDialog from '../../components/AddTagDialog';
import { useConfirmation } from '../../../components/ConfirmDialog/provider';
import BookmarkSingle from '@spectrum-icons/workflow/BookmarkSingle';
import Image from '@spectrum-icons/workflow/Image';
import Info from '@spectrum-icons/workflow/Info';
import useProjectInspector from '../../hooks/ProjectInspector';
import { getTypeColor } from '../../../../utils/color';
import Alert from '@spectrum-icons/workflow/Alert';
import SegAnimePersonDialog from '../../components/SegAnimePersonDialog';
import SelectBoxAll from '@spectrum-icons/workflow/SelectBoxAll';
import Copy from '@spectrum-icons/workflow/Copy';
import Paste from '@spectrum-icons/workflow/Paste';
import Cut from '@spectrum-icons/workflow/Cut';
import Delete from '@spectrum-icons/workflow/Delete';
import Label from '@spectrum-icons/workflow/Label';
import AutomatedSegment from '@spectrum-icons/workflow/AutomatedSegment';
import FolderAdd from '@spectrum-icons/workflow/FolderAdd';
import RemoveCircle from '@spectrum-icons/workflow/RemoveCircle';

const DatasetPanel = () => {
  const confirm = useConfirmation();
  const inspector = useProjectInspector();
  const { t } = useTranslation('translation', { keyPrefix: 'panels.dataset' });
  const [datasetContext] = useAtom(datasetAtom);
  const [_, updateDatasetContext] = useAtom(updateDatasetAtom);
  const [trainContext, setTrainContext] = useAtom(trainingContextAtom);
  const [__, updateTrainContext] = useAtom(updateTrainingContextAtom);
  const [itemAction, setItemAction] = useState<ItemsAction | undefined>(undefined);
  const [isCaptionDialogOpen, setIsCaptionDialogOpen] = useState(false);
  const [editDatasetFolder, setEditDatasetFolder] = useState<DatasetFolder | undefined>(undefined);
  const [createNewDatasetWithSelectDialog, setCreateNewDatasetWithSelectDialog] = useState(false);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);
  const [segAnimeDialogOpen, setSegAnimeDialogOpen] = useState(false);
  const getCurrentFolder = () => {
    if (!datasetContext.currentFolderName || !trainContext.datasetFolders) {
      return undefined;
    }
    return trainContext.datasetFolders.find(it => it.name === datasetContext.currentFolderName);
  };
  const getItems = () => {
    console.log(trainContext.datasetSource)
    if (!trainContext.datasetSource) {
      return [];
    }
    let displayDataset = trainContext.datasetSource;
    if (datasetContext.selectedTags.length > 0) {
      displayDataset = trainContext.datasetSource.filter(it => {
        return it.captions?.some(tag => datasetContext.selectedTags.includes(tag));
      });
    }
    const currentFolder = getCurrentFolder();
    if (currentFolder) {
      displayDataset = displayDataset.filter(it => currentFolder.images.includes(it.imagePath));
    }
    if (datasetContext.currentFolderName === 'unused') {
      const usedImages = trainContext.datasetFolders!.flatMap(it => it.images);
      displayDataset = displayDataset.filter(it => !usedImages.includes(it.imagePath));
    }
    if (datasetContext.filter.captionFilter) {
      switch (datasetContext.filter.captionFilter) {
        case 'allCaption':
          break;
        case 'hasCaption':
          displayDataset = displayDataset.filter(it => (it.captions ?? []).length > 0);
          break;
        case 'noCaption':
          displayDataset = displayDataset.filter(it => (it.captions ?? []).length === 0);
          break;
      }
    }
    console.log("display datset")
    console.log(displayDataset);
    return displayDataset;
  };
  const deleteFolder = (name: string) => {
    confirm({
      title: t('deleteFolderConfirmTitle'),
      description: t('deleteFolderConfirmMessage', {
        name
      }),
      variant: 'destructive',
      onConfirm: async () => {
        updateTrainContext({
          datasetFolders: [...trainContext.datasetFolders!.filter(it => it.name !== name)]
        });
        updateDatasetContext({
          currentFolderName: 'all'
        });
      }
    });

  };
  const getUniqueTags = () => {
    if (!trainContext.datasetSource) {
      return [];
    }
    const items = unique(getItems().flatMap(it => it.captions || []));
    return items;
  };
  const onRemoveTag = (tag: string) => {
    if (!trainContext.datasetSource) {
      return;
    }
    let updateItems = getItems().map(it => {
      // remove old tags if exists
      const newTags = (it.captions || []).filter(it => it !== tag);
      return {
        ...it,
        captions: newTags
      };
    });
    const newDatasetSource = trainContext.datasetSource.map(it => {
      const item = updateItems.find(item => item.imagePath === it.imagePath);
      if (item) {
        return item;
      }
      return it;
    });
    setTrainContext({
      ...trainContext,
      datasetSource: newDatasetSource
    });
    updateDatasetContext(
      {
        selectedTags: []
      }
    );
  };
  useEffect(() => {
  }, [datasetContext.selectedTags]);
  const onTagClick = (tag: string) => {
    if (datasetContext.selectedTags.includes(tag)) {
      updateDatasetContext({
        selectedTags: [...datasetContext.selectedTags.filter(it => it !== tag)]
      });
    } else {
      updateDatasetContext({
        selectedTags: [...datasetContext.selectedTags, tag]
      });
    }
  };
  const tagIsSelected = (tag: string) => {
    return datasetContext.selectedTags.includes(tag);
  };
  const isItemSelected = (item: DatasetItem) => {
    return datasetContext.selectItemNames.includes(item.imagePath);
  };
  const getSelectedDatasetItems = () => {
    if (!trainContext.datasetSource) {
      return [];
    }
    return trainContext.datasetSource.filter(it => datasetContext.selectItemNames.includes(it.imagePath));
  };
  const handleItemClick = (event: React.MouseEvent<HTMLDivElement>, item: DatasetItem) => {
    if (event.metaKey || event.ctrlKey) {
      if (datasetContext.selectItemNames.includes(item.imagePath)) {
        updateDatasetContext({
          selectItemNames: [...datasetContext.selectItemNames.filter(it => it !== item.imagePath)]
        });
      } else {
        updateDatasetContext({
          selectItemNames: [...datasetContext.selectItemNames, item.imagePath]
        });
      }
    } else if (event.shiftKey) {
      if (datasetContext.selectItemNames.length === 0) {
        updateDatasetContext({
          selectItemNames: [item.imagePath]
        });
      } else {
        const lastItem = datasetContext.selectItemNames[datasetContext.selectItemNames.length - 1];
        const index = trainContext.datasetSource?.findIndex(it => it.imagePath === lastItem);
        const itemIndex = trainContext.datasetSource?.findIndex(it => it === item);
        if (index !== undefined && itemIndex !== undefined) {
          const min = Math.min(index, itemIndex);
          const max = Math.max(index, itemIndex);
          updateDatasetContext({
            selectItemNames: trainContext.datasetSource!.slice(min, max + 1).map(it => it.imagePath)
          });
        }
      }

    } else {
      updateDatasetContext({
        currentFilePath: item.imagePath,
        selectItemNames: []
      });
    }
  };
  const onCopyAction = () => {
    if (datasetContext.selectItemNames.length === 0) {
      return;
    }
    setItemAction({
      action: 'Copy',
      items: datasetContext.selectItemNames,
      source: datasetContext.currentFolderName
    });
    updateDatasetContext({
      selectItemNames: []
    });
  };
  const onMoveAction = () => {
    if (datasetContext.selectItemNames.length === 0) {
      return;
    }
    setItemAction({
      action: 'Move',
      items: datasetContext.selectItemNames,
      source: datasetContext.currentFolderName
    });
    updateDatasetContext({
      selectItemNames: []
    });
  };
  const onPasteAction = () => {
    if (!itemAction) {
      return;
    }
    if (!datasetContext.currentFolderName) {
      return;
    }
    if (itemAction.action === 'Copy') {
      updateTrainContext({
        datasetFolders: [...trainContext.datasetFolders!.map(it => {
          if (it.name === datasetContext.currentFolderName) {
            return {
              ...it,
              images: unique([...it.images, ...itemAction.items])
            };
          }
          return it;
        })]
      });
    }
    if (itemAction.action === 'Move') {
      console.log([...itemAction.items]);
      updateTrainContext({
        datasetFolders: [...trainContext.datasetFolders!.map(it => {
          if (it.name === datasetContext.currentFolderName) {

            return {
              ...it,
              images: unique([...it.images, ...itemAction.items])
            };
          }
          if (it.name === itemAction.source) {
            return {
              ...it,
              images: diff(it.images, itemAction.items)
            };
          }
          return it;
        })]
      });

    }
    updateDatasetContext({
      selectItemNames: []
    });
  };
  const onDeleteSelected = () => {
    if (datasetContext.selectItemNames.length === 0) {
      return;
    }
    if (!datasetContext.currentFolderName) {
      return;
    }
    updateTrainContext({
      datasetFolders: [...trainContext.datasetFolders!.map(it => {
        if (it.name === datasetContext.currentFolderName) {
          let images = it.images.filter(it => !datasetContext.selectItemNames.includes(it));
          return {
            ...it,
            images: images
          };
        }
        return it;
      })]
    });
    updateDatasetContext({
      selectItemNames: []
    });
  };
  const onSelectAll = () => {
    if (!trainContext.datasetSource) {
      return;
    }
    updateDatasetContext({
      selectItemNames: getItems().map(it => it.imagePath)
    });
  };
  const onCaptionSelected = () => {
    setIsCaptionDialogOpen(true);
  };
  const getCurrentFile = () => {
    if (!datasetContext.currentFilePath) {
      return undefined;
    }
    return trainContext.datasetSource?.find(it => it.imagePath === datasetContext.currentFilePath);
  };
  const currentFile = getCurrentFile();
  const onRemoveCaption = (caption: string) => {
    if (!trainContext.datasetSource) {
      return;
    }
    const newCaptions = (currentFile?.captions ?? []).filter(it => it !== caption);
    updateTrainContext({
      datasetSource: [...trainContext.datasetSource.map(it => {
        if (it.imagePath === currentFile?.imagePath) {
          return {
            ...it,
            captions: newCaptions
          };
        }
        return it;
      })]
    });

  };
  const onSetCurrentFileCaption = (captions: string[]) => {
    if (!trainContext.datasetSource) {
      return;
    }
    updateTrainContext({
      datasetSource: [...trainContext.datasetSource.map(it => {
        if (it.imagePath === currentFile?.imagePath) {
          return {
            ...it,
            captions: captions
          };
        }
        return it;
      })]
    });

  };
  const onDeleteSelectedPreprocessImage = () => {
    if (datasetContext.selectItemNames.length === 0) {
      return;
    }
    confirm({
      title: t('deletePreprocessImageConfirmTitle'),
      description: t('deletePreprocessImageConfirmMessage', {
        count: datasetContext.selectItemNames.length
      }),
      variant: 'destructive',
      onConfirm: async () => {
        const deleteImageHash = datasetContext.selectItemNames.map(it => {
          const item = trainContext.datasetSource?.find(it2 => it2.imagePath === it);
          return item?.hash;
        }).filter(it => it !== undefined) as string[];
        await removePreprocessImage(deleteImageHash);
        updateDatasetContext({
          selectItemNames: []
        });

      }
    });
  };
  const onAutoCaptionCurrentFile = () => {
    if (!currentFile) {
      return;
    }
    updateDatasetContext({
      selectItemNames: [currentFile.imageName]
    });
    setIsCaptionDialogOpen(true);
  };
  const onEditDatasetFolder = () => {
    if (!datasetContext.currentFolderName) {
      return;
    }
    setEditDatasetFolder(getCurrentFolder());
  };
  const onSegSelectedAnimeImage = () => {
    if (!datasetContext.selectItemNames || datasetContext.selectItemNames.length === 0) {
      return;
    }
    segAnimeImages(getSelectedDatasetItems());
  };
  const actionMenuHandler = (key: Key) => {
    switch (key) {
      case 'selectAll':
        onSelectAll();
        break;
      case 'copy':
        onCopyAction();
        break;
      case 'cut':
        onMoveAction();
        break;
      case 'paste':
        onPasteAction();
        break;
      case 'delete':
        onDeleteSelected();
        break;
      case 'captionSelectedImage':
        onCaptionSelected();
        break;
      case 'deleteSelectedPreprocessImage':
        onDeleteSelectedPreprocessImage();
        break;
      case 'editDatasetFolder':
        onEditDatasetFolder();
        break;
      case 'removeSelectImageCaption':
        onRemoveSelectImageCaption();
        break;
      case 'createNewFolderWithSelect':
        setCreateNewDatasetWithSelectDialog(true);
        break;
      case 'segAnimeCharacter':
        setSegAnimeDialogOpen(true);
        break;

    }
  };
  const getCaptionImages = (): DatasetItem[] => {
    if (getSelectedDatasetItems().length > 0) {
      return getSelectedDatasetItems();
    }
    if (datasetContext.currentFilePath) {
      if (getCurrentFile()) {
        return [getCurrentFile()!];
      }
    }
    return [];
  };
  const onRemoveAllCaption = () => {
    if (!currentFile || !trainContext.datasetSource) {
      return;
    }
    confirm({
      title: t('removeAllCaptionConfirmTitle'),
      description: t('removeAllCaptionConfirmMessage'),
      variant: 'destructive',
      onConfirm: async () => {
        updateTrainContext({
          datasetSource: [...trainContext.datasetSource!.map(it => {
            if (it.hash === currentFile?.hash) {
              console.log(it);
              return {
                ...it,
                captions: []
              };
            }
            return it;
          })]
        });
      }
    });

  };
  const onAddCurrentFileTags = (tags: string[]) => {
    setAddTagDialogOpen(false);
    if (!currentFile) {
      return;
    }
    updateTrainContext({
      datasetSource: [...trainContext.datasetSource!.map(it => {
        if (it.hash === currentFile?.hash) {
          return {
            ...it,
            captions: unique([...(it.captions ?? []), ...tags])
          };
        }
        return it;
      })]
    });
  };
  const currentFileActionHandler = (key: Key) => {
    switch (key) {
      case 'removeAllCaption':
        onRemoveAllCaption();
        break;
      case 'autoCaption':
        onAutoCaptionCurrentFile();
        break;
      case 'addTags':
        setAddTagDialogOpen(true);
        break;
    }
  };
  const onSelectCaptionFilter = (key: string) => {
    updateDatasetContext({
      filter: {
        ...datasetContext.filter,
        captionFilter: key.toString() as any
      }
    });
  };
  const onUpdateDatasetFolder = (folder: DatasetFolder) => {
    if (!editDatasetFolder) {
      return;
    }
    updateTrainContext({
      datasetFolders: [...trainContext.datasetFolders!.map(it => {
        if (it.name === editDatasetFolder.name) {
          return folder;
        }
        return it;
      })]
    });
    updateDatasetContext({
      currentFolderName: folder.name
    });

  };
  const onRemoveSelectImageCaption = () => {
    if (datasetContext.selectItemNames.length === 0) {
      return;
    }
    if (!trainContext.datasetSource) {
      return;
    }
    confirm({
      title: t('removeSelectedItemCaptionConfirmTitle'),
      description: t('removeSelectedItemCaptionConfirmMessage', {
        count: datasetContext.selectItemNames.length
      }),
      variant: 'destructive',
      onConfirm: async () => {
        updateTrainContext({
          datasetSource: [...trainContext.datasetSource!.map(it => {
            if (datasetContext.selectItemNames.includes(it.imagePath)) {
              return {
                ...it,
                captions: []
              };
            }
            return it;
          })]
        });
      }
    });
  };
  const getDatasetFolderActions = (): Array<{
    label:string
    children:Array<{ key: string, label: string, order: number, group: string,icon:ReactElement }>
  }> => {
    const actions = [
      {
        label: t('selection'),
        children: [
          {
            key: 'selectAll',
            label: t('selectAll'),
            order: 0,
            group: 'select',
            icon: <SelectBoxAll/>
          }
        ]
      }
    ];
    const editAction: any = {
      label: t('editor'),
      children: []
    };
    const captionAction:any = {
      label: t('caption'),
      children: []
    }
    const datasetAction:any = {
      label: t('dataset'),
      children: []
    }
    if (
      datasetContext.currentFolderName !== 'unused' &&
      datasetContext.currentFolderName !== 'all'
    ) {
      editAction.children.push({
        key: 'paste',
        label: t('paste'),
        order: 3,
        group: 'action',
        icon:<Paste />
      });
      editAction.children.push({
        key: 'cut',
        label: t('cut'),
        order: 2,
        group: 'action',
        icon:<Cut/>
      });

    }
    if (datasetContext.selectItemNames.length !== 0) {
      editAction.children.push({
        key: 'copy',
        label: t('copy'),
        order: 1,
        group: 'action',
        icon:<Copy />
      });

      editAction.children.push({
        key: 'delete',
        label: t('delete'),
        order: 4,
        group: 'action',
        icon:<Delete />
      });
      captionAction.children.push({
        key: 'captionSelectedImage',
        label: t('captionSelectedImage'),
        order: 5,
        group: 'action',
        icon:<Label />
      });
      datasetAction.children.push({
        key: 'segAnimeCharacter',
        label: t('segAnimeCharacter'),
        order: 5,
        group: 'action',
        icon:<AutomatedSegment />
      });
      datasetAction.children.push({
        key: 'createNewFolderWithSelect',
        label: t('createNewFolderWithSelect'),
        order: 6,
        group: 'action',
        icon:<FolderAdd />
      });
      captionAction.children.push({
        key: 'removeSelectImageCaption',
        label: t('removeSelectImageCaption'),
        order: 6,
        group: 'action',
        icon:<RemoveCircle />
      });
      datasetAction.children.push({
        key: 'deleteSelectedPreprocessImage',
        label: t('deleteSelectedPreprocessImage'),
        order: 6,
        group: 'action',
        icon:<Delete />
      });
    }
    if (
      datasetContext.currentFolderName &&
      datasetContext.currentFolderName !== 'unused' &&
      datasetContext.currentFolderName !== 'all'
    ) {
      datasetAction.children.push({
        key: 'editDatasetFolder',
        label: t('editDatasetFolder'),
        order: 7,
        group: 'action'
      });
    }
    actions.push(editAction)
    actions.push(datasetAction)
    actions.push(captionAction)
    return actions.filter(it => it.children.length > 0)
  };
  const newFolderWithSelectItems = (name: string, step: number) => {
    if (!trainContext.datasetFolders) {
      return;
    }
    const newFolder: DatasetFolder = {
      name,
      step: step,
      images: datasetContext.selectItemNames
    };
    updateTrainContext({
      datasetFolders: [...trainContext.datasetFolders, newFolder]
    });
    updateDatasetContext({
      currentFolderName: name,
      selectItemNames: []
    });
  };
  const getCurrentSelectImageHistoryTags = () => {
    if (!currentFile) {
      return [];
    }
    let items = currentFile?.captionHistory ?? [];
    const currentCaption = currentFile.captions ?? [];
    items = items.filter(it => {
      return !currentCaption.includes(it.name);
    });
    items = unique(items, it => it.name);
    items = sort(items, it => it.rank, true);
    console.log(items);
    return items;
  };
  const onHistoryTagClick = (tag: string) => {
    if (!currentFile) {
      return;
    }
    updateTrainContext({
      datasetSource: [...trainContext.datasetSource!.map(it => {
        if (it.hash === currentFile?.hash) {
          return {
            ...it,
            captions: unique([...(it.captions ?? []), tag])
          };
        }
        return it;
      })]
    });
  };
  const checkResult = inspector.check();
  const itemError = (item: DatasetItem) => {
    return checkResult.filter(it => it.event === 'noCaption' && it.extra?.item.imagePath === item.imagePath);
  };
  const getItemInvalidateState = (item: DatasetItem) => {
    if (checkResult.find(it => it.type === 'error' && it.extra?.item.imagePath === item.imagePath)) {
      return 'error';
    }
    if (checkResult.find(it => it.type === 'warning' && it.extra?.item.imagePath === item.imagePath)) {
      return 'warning';
    }
    return undefined;
  };
  const getCurrentFileError = () => {
    if (!currentFile) {
      return [];
    }
    return itemError(currentFile);
  };
  const getFolderErrors = () => {
    if (!trainContext.datasetSource) {
      return [];
    }
    const items = trainContext.datasetSource.filter(it => {
      return itemError(it).filter(it => it.type === 'error').length > 0;
    });
    return items;
  };
  const getFolderWarnings = () => {
    if (!trainContext.datasetSource) {
      return [];
    }
    const items = trainContext.datasetSource.filter(it => {
      return itemError(it).filter(it => it.type === 'warning').length > 0;
    });
    return items;
  };

  return (
    <>
      <AddTagDialog
        isOpen={addTagDialogOpen}
        onAdd={onAddCurrentFileTags}
        onClose={() => setAddTagDialogOpen(false)}
      />
      <NewFolderDialog
        isOpen={createNewDatasetWithSelectDialog}
        onClose={() => setCreateNewDatasetWithSelectDialog(false)}
        onNewFolder={newFolderWithSelectItems}
        excludeNames={trainContext.datasetFolders?.map(it => it.name) ?? []}
      />
      <EditDatasetFolderDialog
        isOpen={Boolean(editDatasetFolder)}
        onClose={() => setEditDatasetFolder(undefined)}
        folder={editDatasetFolder}
        onComplete={onUpdateDatasetFolder}
      />
      <SegAnimePersonDialog
        isOpen={segAnimeDialogOpen}
        onClose={() => {
          setSegAnimeDialogOpen(false);
        }}
        onCreate={onSegSelectedAnimeImage}
        onInterrupt={() => {
          segAnimeImagesInterrupt();
        }}
      />
      <CaptionDialog
        isOpen={isCaptionDialogOpen}
        onClose={() => setIsCaptionDialogOpen(false)}
        images={getCaptionImages()}
        onApply={(data) => {
          updateTrainContext({
            datasetSource: trainContext.datasetSource?.map(it => {
              const item = data.find(item => item.imageName === it.imageName);
              if (item) {
                return {
                  ...it,
                  captions: unique([...(it.captions ?? []), ...item.newCaption])
                };
              }
              return it;
            })
          });
          setIsCaptionDialogOpen(false);
        }}
      />
      <div style={{
        display: 'flex',
        height: '100%',
        padding: 16,
        gap: 16,
        boxSizing: 'border-box'
      }}>
        <div className={clsx(styles.actionPanel)}>
          <Well UNSAFE_className={styles.panel} UNSAFE_style={{
            marginBottom: 16
          }}>
            {t('datasetFolders')}
            <div className={styles.tagContainer}>
              <div
                onClick={() => {
                  updateDatasetContext({
                    currentFolderName: 'unused'
                  });
                }}
                className={clsx(styles.folderTag, datasetContext.currentFolderName === 'unused' ? styles.folderTagActive : '')}
              >{t('unused')}</div>
              <div
                className={clsx(styles.folderTag, datasetContext.currentFolderName === 'all' ? styles.folderTagActive : '')}
                onClick={() => {
                  updateDatasetContext({
                    currentFolderName: 'all'
                  });
                }}
              >{t('all')}</div>
              {
                (trainContext.datasetFolders || []).map(it => {
                  return (
                    <div
                      key={it.name}
                      onClick={() => {
                        updateDatasetContext({
                          currentFolderName: it.name
                        });
                      }}
                      className={clsx(styles.folderTag, datasetContext.currentFolderName === it.name ? styles.folderTagActive : '')}
                    >
                      {it.name}
                      <span
                        onClick={() => {
                          deleteFolder(it.name);
                        }}
                        style={{
                          display: 'flex',
                          justifyItems: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Close size={'XS'} />
                      </span>
                    </div>
                  );
                })
              }
            </div>
          </Well>
          <Well UNSAFE_style={{
            flex: 1,
            position: 'relative',
            padding: 0
          }}>
            <div
              className={styles.panel}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
              }}>
              {
                t('tagFilter')
              }
              <div
                className={styles.tagContainer}
                style={{
                  paddingRight: 8
                }}
              >
                {
                  getUniqueTags().map(it => {
                    return (
                      <div
                        key={it}
                        className={clsx(styles.folderTag, tagIsSelected(it) ? styles.folderTagActive : '')}
                        style={{
                          width: '100%'
                        }}
                      >
                        <div
                          onClick={() => onTagClick(it)}
                          style={{
                            flex: 1,
                            padding: 4
                          }}
                        >
                          {
                            it
                          }
                        </div>

                        <span
                          onClick={() => {
                            onRemoveTag(it);
                          }}
                          style={{
                            display: 'flex',
                            justifyItems: 'center',
                            alignItems: 'center'
                          }}
                        >
                        <Close size={'XS'} />
                      </span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </Well>
        </div>
        <Well UNSAFE_className={clsx(styles.flexContainer)} UNSAFE_style={{
          padding: 0
        }}>
          <div
            className={styles.flexContent}
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              gap: 16
            }}>
              <div
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  alignContent: 'flex-start'
                }}
              >
                {datasetContext.currentFolderName ?? t('unused')}
                {
                  getCurrentFolder()?.step && (
                    <div
                      style={{
                        backgroundColor: '#00a868',
                        color: '#fff',
                        fontSize: 12,
                        marginLeft: 16,
                        borderRadius: 4,
                        padding: '2px 8px'
                      }}
                    >
                      {getCurrentFolder()?.step ?? 0}
                    </div>

                  )
                }

                <div style={{
                  marginLeft: 32,
                  gap: 8,
                  display: 'flex'
                }}>
                  <div style={{
                    backgroundColor: '#ff7300',
                    fontSize: 12,
                    paddingLeft: 4,
                    paddingRight: 4,
                    borderRadius: 4,
                    paddingTop: 2,
                    paddingBottom: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    justifyContent: 'center'
                  }}>
                    <Alert size={'XS'} />
                    {getFolderWarnings().length}
                  </div>
                  <div style={{
                    backgroundColor: '#b40000',
                    fontSize: 12,
                    paddingLeft: 4,
                    paddingRight: 4,
                    borderRadius: 4,
                    paddingTop: 2,
                    paddingBottom: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    justifyContent: 'center'
                  }}>
                    <Info size={'XS'} />
                    {getFolderErrors().length}
                  </div>

                </div>

              </div>
              <MenuTrigger>
                <ActionButton isQuiet>
                  <Filter size={'XS'} />
                  <Text>
                    {t('captionFilter')}
                  </Text>
                </ActionButton>
                <Menu
                  selectionMode='single'
                  selectedKeys={[datasetContext.filter.captionFilter]}
                  onSelectionChange={(keys) => {
                    onSelectCaptionFilter((Array.from(keys) as any)[0]);
                  }}
                >
                  <Item key='allCaption'>
                    {t('allCaption')}
                  </Item>
                  <Item key='noCaption'>
                    {t('noCaption')}
                  </Item>
                  <Item key='hasCaption'>
                    {t('hasCaption')}
                  </Item>
                </Menu>
              </MenuTrigger>
              <ActionMenu
                onAction={actionMenuHandler}
                isQuiet
                items={getDatasetFolderActions()}
              >
                {item => (
                  <Section items={item.children} title={item.label} key={item.label}>
                    {item => <Item key={item.key}>
                        {item.icon}
                      <Text>
                        {item.label}
                      </Text>

                    </Item>}
                  </Section>
                )}
              </ActionMenu>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                flex: 1,
                overflowY: 'auto',
                alignContent: 'flex-start',
                gap: 4,
                position: 'relative'
              }}

            >
              {
                getItems().map(it => {
                  return (
                    <div
                      onClick={(e) => {
                        handleItemClick(e, it);
                      }}
                      style={{
                        cursor: 'pointer',
                        zIndex: 9,
                        width: 96,
                        height: 96,
                        position: 'relative'

                      }}
                      className={clsx(isItemSelected(it) ? styles.itemSelect : styles.itemNotSelect)}
                    >
                      <img src={`${it.imagePath}`} className={styles.imageGrid} />
                      {
                        getItemInvalidateState(it) && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            backgroundColor: getTypeColor(getItemInvalidateState(it) ?? '')
                          }}>


                          </div>
                        )
                      }

                    </div>
                  );
                })
              }

            </div>
            {
              getCurrentFileError().length > 0 && (
                <div style={{
                  padding: 16,
                  marginLeft: -16,
                  marginRight: -16,
                  marginBottom: -16,
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  gap: 8
                }}>
                  {
                    getCurrentFileError().map(it => {
                      console.log(it.type);
                      return (
                        <div style={{
                          width: '100%',
                          padding: 8,
                          borderColor: getTypeColor(it.type),
                          // borderLeftColor: 'getTypeColor(it.type)',
                          borderLeft: '4px solid'
                        }}>
                          {it.message}
                        </div>
                      );
                    })
                  }


                </div>
              )
            }

          </div>


        </Well>
        <Well
          UNSAFE_style={{
            padding: 0
          }}
        >
          <Flex
            UNSAFE_className={styles.panel}
            UNSAFE_style={{
              width: 320,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}
            direction={'column'}
          >
            {
              currentFile && (
                <>
                  <div
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      alignContent: 'flex-start',
                      width: '100%'

                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontWeight: 500

                      }}
                    >
                      {
                        t('detail')
                      }
                    </div>
                    <ActionMenu
                      isQuiet
                      onAction={currentFileActionHandler}
                    >
                      <Item
                        key={'removeAllCaption'}
                      >
                        {
                          t('removeImageCaptions')
                        }
                      </Item>
                      <Item
                        key={'autoCaption'}
                      >
                        {t('autoCaption')}
                      </Item>
                      <Item
                        key={'addTags'}
                      >
                        {t('addTags')}
                      </Item>
                    </ActionMenu>
                  </div>

                  <div
                    style={{
                      overflowY: 'auto'
                    }}
                  >
                    <img src={`${currentFile.imagePath}`} className={styles.detailImage}
                         alt={'detail'} />
                  </div>
                  {
                    detailIndex == 0 && (
                      <>
                        <div style={{
                          marginTop: 16,
                          width: '100%',
                          marginBottom: 8
                        }}>
                          {t('imageTags')}
                        </div>


                        <View flex={1} position={'relative'} width={'100%'}>
                          <TagGroup
                            UNSAFE_className={styles.tagContainer}
                            onRemove={(keys) => {
                              if (keys.size === 0) {
                                return;
                              }
                              onRemoveCaption(keys.values().next().value);
                            }}
                            position={'absolute'}
                            top={0}
                            right={0}
                            bottom={0}
                            left={0}
                            UNSAFE_style={{
                              overflowY: 'auto'
                            }}
                            height={'100%'}
                            marginTop={0}
                          >
                            {
                              (currentFile.captions ?? []).map((it: string) => {
                                return (
                                  <Item key={it}>
                                    {it}
                                  </Item>
                                );
                              })

                            }
                          </TagGroup>
                        </View>
                        <div style={{
                          marginTop: 16,
                          width: '100%',
                          marginBottom: 8
                        }}>
                          {t('imageHistoryTags')}
                        </div>
                        <div style={{
                          flex: 1,
                          width: '100%',
                          position: 'relative',
                          marginBottom: 8
                        }}>
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              paddingRight: 8,
                              gap: 4
                            }}
                          >
                            {
                              getCurrentSelectImageHistoryTags().map(it => {
                                return (
                                  <div
                                    key={it.name}
                                    style={{
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      gap: 16,
                                      padding: 4,
                                      alignItems: 'center'
                                    }}
                                    onClick={() => onHistoryTagClick(it.name)}
                                  >
                                    <div
                                      style={{
                                        flex: 1,
                                        lineBreak: 'anywhere'
                                      }}
                                    >
                                      {it.name}
                                    </div>
                                    <div>
                                      {it.taggerId}
                                    </div>
                                    <div>
                                      {it.rank?.toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>

                        </div>
                      </>
                    )
                  }
                  {
                    detailIndex == 1 && (
                      <div
                        style={{
                          flex: 1
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            paddingTop: 8
                          }}
                        >
                          {
                            currentFile.originalPath && (
                              <div style={{ marginBottom: 16 }}>
                                <img src={`${currentFile.originalPath}`} className={styles.detailImage}
                                     alt={'detail'} />
                              </div>
                            )
                          }
                        </div>
                      </div>

                    )
                  }
                  <Flex gap={16} direction={'row'} width={'100%'}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 4,
                        backgroundColor: detailIndex === 0 ? '#007e4f' : undefined
                      }}
                      onClick={() => {
                        setDetailIndex(0);
                      }}
                    >
                      <BookmarkSingle />
                    </div>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 4,
                        backgroundColor: detailIndex === 1 ? '#007e4f' : undefined
                      }}
                      onClick={() => {
                        setDetailIndex(1);
                      }}
                    >
                      <Image />
                    </div>
                  </Flex>

                </>
              )
            }
          </Flex>
        </Well>

      </div>

    </>
  );
};
export default DatasetPanel;
