import styles from './index.module.css';
import { configAtom, itemsAtom, modelsAtom, outputModelAtom, trainingContextAtom, TrainingState } from './model';
import React, { Key, useEffect, useState } from 'react';
import { CaptionHistory, ChannelsKeys, DatasetItem, LoraOutputModel, OriginalItem, Project } from '../../../types';
import {
  createDataset,
  getRecentlyProjects,
  loadProject,
  newProject,
  saveProject
} from '../../service/training/dataset';
import { diff, merge } from 'radash';
import { useAtom } from 'jotai';
import ImageImportModal from './components/import';
import logoImg from '../../../../assets/icon.png';
import NewFolderDialog from './components/NewFolderDialog';
import RepoManagerDialog from './components/RepoManagerDialog';
import LoraConfigManagerDialog from './components/LoraConfigManagerDialog';
import { selectFolder } from '../../service/config';
import AddTagDialog from './components/AddTagDialog';
import { openFolder } from '../../service/vcs';
import DatasetPanel from './panel/DatasetPanel';
import TrainingPanel from './panel/TrainingPanel';
import TrainConfigPanel from './panel/TrainConfigPanel';
import { getTrainConfigs, savePreviewProps } from '../../service/training/train';
import ModelsPanel from './panel/ModelsPanel';
import { getLoraList, openStableDiffusionModelFolder } from '../../service/training/lora';
import SettingsDialog from './components/SettingsDialog';
import { ipcRenderer } from '../../service/base';
import { exportLog, openLog } from '../../service/training/log';
import { useTranslation } from 'react-i18next';
import PreviewManagerDialog from './components/PreviewManagerDialog';
import StartPanel from './panel/StartPanel';
import {
  ActionButton,
  DialogTrigger,
  Flex,
  Item,
  Menu,
  MenuTrigger,
  Section,
  TabList,
  TabPanels,
  Tabs,
  Text
} from '@adobe/react-spectrum';
import DataMapping from '@spectrum-icons/workflow/DataMapping';
import Apps from '@spectrum-icons/workflow/Apps';
import Folder from '@spectrum-icons/workflow/Folder';
import Dashboard from '@spectrum-icons/workflow/Dashboard';
import OriginalPanel from './panel/OriginalPanel';
import Images from '@spectrum-icons/workflow/Images';
import NewProjectDialog, { NewProjectValues } from './components/NewProjectDialog';
import ImportOriginalDialog from './components/ImportOriginalDialog';
import Remove from '@spectrum-icons/workflow/Remove';
import ViewSingle from '@spectrum-icons/workflow/ViewSingle';
import Close from '@spectrum-icons/workflow/Close';
import clsx from 'clsx';
import { closeWindow, minimizeWindow, resizeWindow } from '../../service/training/window';
import { openPretrainedModelFolder } from '../../service/training/pretrained';
import useProjectInspector from './hooks/ProjectInspector';
import InspectorPopup from './parts/InspectorPopup';
import Info from '@spectrum-icons/workflow/Info';
import Alert from '@spectrum-icons/workflow/Alert';
import { useConfirmation } from '../components/ConfirmDialog/provider';
import { toast } from 'react-toastify';
import FolderAdd from '@spectrum-icons/workflow/FolderAdd';
import CollectionAdd from '@spectrum-icons/workflow/CollectionAdd';
import CollectionCheck from '@spectrum-icons/workflow/CollectionCheck';
import CollectionAddTo from '@spectrum-icons/workflow/CollectionAddTo';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import SaveFloppy from '@spectrum-icons/workflow/SaveFloppy';
import FolderAddTo from '@spectrum-icons/workflow/FolderAddTo';
import ImageAdd from '@spectrum-icons/workflow/ImageAdd';
import ImageAutoMode from '@spectrum-icons/workflow/ImageAutoMode';
import ImageCheckedOut from '@spectrum-icons/workflow/ImageCheckedOut';
import BookmarkSingle from '@spectrum-icons/workflow/BookmarkSingle';
import Settings from '@spectrum-icons/workflow/Settings';
import Draw from '@spectrum-icons/workflow/Draw';
import FileTxt from '@spectrum-icons/workflow/FileTxt';
import Text2ImageDialog2 from './components/Text2ImageDialog2';
import OpenProjectDialog from './components/OpenProjectDialog';
import { getIsRemoteMode } from '../../service/training/common';

export type ItemsAction = {
  source?: string
  items: string[]
  action: 'Copy' | 'Move' | ''
}
const MainEditorPage = () => {
  const confirm = useConfirmation();
  const [trainContext, setTrainContext] = useAtom(trainingContextAtom);
  const [configContext, setConfigContext] = useAtom(configAtom);
  const [outputModels, setOutputModels] = useAtom(outputModelAtom);
  const [modelsContext, setModelsContext] = useAtom(modelsAtom);
  const [items, setItems] = useAtom(itemsAtom);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [repoManagerDialogOpen, setRepoManagerDialogOpen] = useState(false);
  const [loraConfigManagerDialogOpen, setLoraConfigManagerDialogOpen] = useState(false);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [previewPropsDialogOpen, setPreviewPropsDialogOpen] = useState(false);
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [previewSettingsDialogOpen, setPreviewSettingsDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [importOriginalImageDialogOpen, setImportOriginalImageDialogOpen] = useState(false);
  const [openProjectDialogOpen, setOpenProjectDialogOpen] = useState(false);
  const inspector = useProjectInspector();
  const inspectorResult = inspector.check();
  const { t } = useTranslation();
  const loadedProject = async (
    {
      project,
      useTrainContext = trainContext
    }: {
      project: Project,
      useTrainContext: TrainingState
    }) => {
    const recentProjects = await getRecentlyProjects();
    console.log(project);
    setTrainContext({
      ...useTrainContext,
      datasetSource: project.source,
      datasetFolders: project.dataset,
      preprocessPath: project.preProcessPath,
      datasetPath: project.datasetPath,
      modelOutPath: project.modelOutPath,
      originalImage: project.original,
      projectParams: project.params,
      recentProjects
    });

    // load saved config
    const TrainConfigs = await getTrainConfigs();
    console.log(TrainConfigs)
    setConfigContext({
      ...configContext,
      list: TrainConfigs,
      currentConfigId: TrainConfigs.length > 0 ? TrainConfigs[0].name : undefined
    });

    // load models
    const models = await getLoraList();
    console.log(models)
    setModelsContext({
      ...modelsContext,
      list: models
    });

  };
  const load = async ({ useTrainContext = trainContext,projectPath =  useTrainContext.workDir}:any) => {
    const project: Project = await loadProject(projectPath);
    loadedProject({
      project,
      useTrainContext
    });
  };
  const init = async () => {
    const recentProjects = await getRecentlyProjects();

    setTrainContext({
      ...trainContext,
      recentProjects,
    });
  };
  useEffect(() => {
    init();
  }, []);
  const onAddTag = (tags: string[]) => {
    if (!trainContext.datasetSource) {
      return;
    }
    let updateItems = items.map(it => {
      // remove old tags if exists
      const newTags = diff(it.captions || [], tags);
      // append new tags to head
      newTags.unshift(...tags);
      console.log(newTags);
      return {
        ...it,
        captions: newTags
      };
    });
    const newTags = merge(trainContext.datasetSource, updateItems, f => f.imagePath);

    setTrainContext({
      ...trainContext,
      datasetSource: [...newTags]
    });
    setAddTagDialogOpen(false);
  };

  const onCreateNewFolder = (name: string, step: number) => {
    setTrainContext({
      ...trainContext,
      datasetFolders: [...(trainContext.datasetFolders ?? []), {
        name,
        step,
        images: []
      }]
    });
  };


  const onOpenProject = async ({ projectPath }: { projectPath?: string }) => {
    if (await getIsRemoteMode()) {
      setOpenProjectDialogOpen(true);
      return;
    }
    let openPath = projectPath;
    if (!openPath) {
      openPath = await selectFolder({ title: t('dialogs.openProject.title') });
      if (!openPath) {
        return;
      }
    }

    const newContext = {
      ...trainContext,
      workDir: openPath,
      preprocessPath: openPath + '/preprocess',
      datasetPath: openPath + '/dataset',
      modelOutPath: openPath + '/model'
    };
    setTrainContext(newContext);
    await load({ useTrainContext: newContext });
  };
  const onOpenRemoteProject = async (projectId:string) => {
    setOpenProjectDialogOpen(false)
    const newContext = {
      ...trainContext,
      workDir: projectId,
      preprocessPath: projectId + '/preprocess',
      datasetPath: projectId + '/dataset',
      modelOutPath: projectId + '/model'
    };
    setTrainContext(newContext);
    await load({ useTrainContext: newContext });
  }
  const onCreateDatasetHandler = async () => {
    if (!trainContext.datasetFolders || !trainContext.datasetPath || !trainContext.datasetSource) {
      return;
    }
    await createDataset(trainContext.datasetSource, trainContext.datasetFolders, trainContext.datasetPath);
  };
  const openDatasetFolder = () => {
    if (!trainContext.datasetPath) {
      return;
    }
    openFolder({ path: trainContext.datasetPath });
  };
  const openPreprocessFolder = () => {
    if (!trainContext.preprocessPath) {
      return;
    }
    openFolder({ path: trainContext.preprocessPath });
  };
  const openModelFolder = () => {
    if (!trainContext.modelOutPath) {
      return;
    }
    openFolder({ path: trainContext.modelOutPath });
  };
  const openProjectFolder = () => {
    if (!trainContext.workDir) {
      return;
    }
    openFolder({ path: trainContext.workDir });
  };
  const onSaveProject = async () => {
    if (!trainContext.workDir || !trainContext.datasetFolders || !trainContext.datasetSource) {
      return;
    }
    await saveProject({
      dataset: trainContext.datasetSource,
      folders: trainContext.datasetFolders,
      workDir: trainContext.workDir
    });
    toast.success(t('notice.saveProjectSuccess'), {
      position: 'bottom-center',
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: 'dark',
      hideProgressBar: true,
      closeButton: false
    });
  };
  const onExportLog = async () => {
    const selectPathResult = await selectFolder({ title: '选择导出路径' });
    if (!selectPathResult) {
      return;
    }
    const { exportPath } = await exportLog(selectPathResult);
    toast.success(t('dialogs.exportLog.success'), {
      position: 'bottom-center',
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: 'dark',
      hideProgressBar: true,
      closeButton: false
    });
  };
  const onOpenLog = async () => {
    openLog();
  };
  const onOpenStableDiffusionModelsFolder = async () => {
    openStableDiffusionModelFolder()
  }
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.loraSaved, (data: LoraOutputModel) => {
      setOutputModels([
        ...outputModels.filter(it => it.path !== data.path),
        data
      ]);
    });
    ipcRenderer.on(ChannelsKeys.textImageCallback, (
      {
        id,
        option,
        img
      }: any) => {
      setOutputModels(outputModels.map(it => {
        if (it.path === id) {
          return {
            ...it,
            outImage: img,
            props: option
          };
        }
        return it;
      }));
    });
    ipcRenderer.on(ChannelsKeys.newPreprocessImageFile, (data: any) => {
      const newDatasetSource = trainContext.datasetSource?.filter(it => it.imagePath !== data.imagePath) ?? [];
      setTrainContext({
        ...trainContext,
        datasetSource: [...newDatasetSource, data]
      });
    });
    ipcRenderer.on(ChannelsKeys.preprocessImageRemoveEvent, (hashes: string[]) => {
      const newDatasetSource = trainContext.datasetSource?.filter(it => !hashes.includes(it.hash)) ?? [];
      const newDataset = trainContext.datasetFolders?.map(it => {
        return {
          ...it,
          images: it.images.filter(img => !hashes.includes(img))
        };
      }) ?? [];
      setTrainContext({
        ...trainContext,
        datasetSource: [...newDatasetSource],
        datasetFolders: [...newDataset]
      });
    });
    ipcRenderer.on(ChannelsKeys.captionHistoryUpdate, (filename: string, data: CaptionHistory[]) => {
      setTrainContext({
        ...trainContext,
        datasetSource: (trainContext.datasetSource ?? []).map(it => {
          if (it.imageName === filename) {
            return {
              ...it,
              captionHistory: data
            };
          }
          return it;
        })
      });
    });
    ipcRenderer.on(ChannelsKeys.preprocessDone, (
      {
        original,
        preprocess,
      }: {
        original: OriginalItem[],
        preprocess: DatasetItem[]
      }) => {
      console.log({ original, preprocess });
      setTrainContext({
        ...trainContext,
        originalImage: [...original],
        datasetSource:preprocess
      });
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.loraSaved);
      ipcRenderer.removeAllListeners(ChannelsKeys.textImageCallback);
      ipcRenderer.removeAllListeners(ChannelsKeys.newPreprocessImageFile);
      ipcRenderer.removeAllListeners(ChannelsKeys.preprocessImageRemoveEvent);
      ipcRenderer.removeAllListeners(ChannelsKeys.captionHistoryUpdate);
      ipcRenderer.removeAllListeners(ChannelsKeys.preprocessDone);
    };
  }, [outputModels, trainContext]);
  useEffect(() => {
   console.log("trainContext.originalImage",trainContext.originalImage)
  }, [trainContext.originalImage]);
  const onNewProject = async () => {
    setNewProjectDialogOpen(true);
  };
  const onCreateProject = async (value: NewProjectValues) => {
    const project: Project = await newProject(value);
    await loadedProject({
      project,
      useTrainContext: {
        ...trainContext,
        workDir: project.path
      }
    });
    setNewProjectDialogOpen(false);
  };
  const onImportOriginalImagesComplete = async (result: OriginalItem[]) => {
    setTrainContext({
      ...trainContext,
      originalImage: [...result]
    });
    setImportOriginalImageDialogOpen(false);
  };
  return (
    <div className={styles.root}>
      <OpenProjectDialog
        isOpen={openProjectDialogOpen}
        onClose={() => setOpenProjectDialogOpen(false)}
        onOpen={onOpenRemoteProject}
      />
      <Text2ImageDialog2
        isOpen={previewPropsDialogOpen}
        onClose={() => {
          setPreviewPropsDialogOpen(false);
        }}
        onOk={(values) => {
          savePreviewProps(values);
          setPreviewPropsDialogOpen(false);
        }}
      />
      <ImageImportModal
        isOpen={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
        }}
        width={trainContext.projectParams?.width ?? 0}
        height={trainContext.projectParams?.height ?? 0}
      />
      <SettingsDialog
        isOpen={settingDialogOpen}
        onClose={() => {
          setSettingDialogOpen(false);
        }}
      />
      <NewFolderDialog
        isOpen={newFolderDialogOpen}
        onClose={() => setNewFolderDialogOpen(false)}
        onNewFolder={onCreateNewFolder}
        excludeNames={trainContext.datasetFolders?.map(it => it.name) ?? []}
      />
      <RepoManagerDialog isOpen={repoManagerDialogOpen} onClose={() => setRepoManagerDialogOpen(false)} />
      <LoraConfigManagerDialog
        isOpen={loraConfigManagerDialogOpen}
        onClose={() => setLoraConfigManagerDialogOpen(false)} />
      <AddTagDialog
        isOpen={addTagDialogOpen}
        onAdd={onAddTag}
        onClose={() => setAddTagDialogOpen(false)}
      />
      <PreviewManagerDialog
        isOpen={previewSettingsDialogOpen}
        onCancel={() => {
          setPreviewSettingsDialogOpen(false);
        }} />
      <NewProjectDialog
        isOpen={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onCreate={onCreateProject}
      />
      <ImportOriginalDialog
        isOpen={importOriginalImageDialogOpen}
        onClose={() => setImportOriginalImageDialogOpen(false)}
        onComplete={onImportOriginalImagesComplete}
      />
      <div className={clsx(styles.toolbar, styles.dragBar)}>
        <img className={clsx(styles.logo, styles.dragSpace)} src={logoImg}></img>
        <Flex>
          <MenuTrigger>
            <ActionButton isQuiet>
              {t('menu.file')}
            </ActionButton>
            <Menu
              onAction={(key) => {
                switch (key) {
                  case 'newProject':
                    onNewProject();
                    break;
                  case 'openProject':
                    onOpenProject({});
                    break;
                  case 'saveProject':
                    onSaveProject();
                    break;
                  case 'openProjectFolder':
                    openProjectFolder();
                    break;
                  default:
                    onOpenProject({ projectPath: key.toString() });
                }
              }}
            >
              <Section>
                <Item key={'newProject'}>
                  <FolderAdd />
                  <Text>{t('menu.newProject')}</Text>
                </Item>
                <Item key={'openProject'}>
                  <FolderOpen />
                  <Text>{t('menu.openProject')}</Text>
                </Item>
                <Item key={'saveProject'}>
                  <SaveFloppy />
                  <Text>{t('menu.saveProject')}</Text>
                </Item>
                <Item key={'openProjectFolder'}>
                  <FolderAddTo />
                  <Text>{t('menu.openProjectFolder')}</Text>
                </Item>
              </Section>
              <Section title={t('menu.recentProjects')}>
                {
                  trainContext.recentProjects?.slice(0, 10).map(item => <Item key={item.path}>{item.name}</Item>)
                }
              </Section>
            </Menu>
          </MenuTrigger>
          <MenuTrigger>
            <ActionButton isQuiet>
              {t('menu.dataset')}
            </ActionButton>
            <Menu
              onAction={(key) => {
                switch (key) {
                  case 'newDataset':
                    setNewFolderDialogOpen(true);
                    break;
                  case 'generateDataset':
                    onCreateDatasetHandler();
                    break;
                  case 'openDatasetFolder':
                    openDatasetFolder();
                    break;
                }
              }}
            >
              <Item key={'newDataset'}>
                <CollectionAdd />
                <Text>{t('menu.newDataset')}</Text>
              </Item>
              <Item key={'generateDataset'}>
                <CollectionCheck />
                <Text>{t('menu.generateDataset')}</Text>
              </Item>
              <Item key={'openDatasetFolder'}>
                <CollectionAddTo />
                <Text>{t('menu.openDatasetFolder')}</Text>
              </Item>
            </Menu>
          </MenuTrigger>
          <MenuTrigger>
            <ActionButton isQuiet>
              {t('menu.source')}
            </ActionButton>
            <Menu
              onAction={(key) => {
                switch (key) {
                  case 'importFromFolder':
                    setImportDialogOpen(true);
                    break;
                  case 'openImportFolder':
                    openPreprocessFolder();
                    break;
                  case 'importOriginalImages':
                    setImportOriginalImageDialogOpen(true);
                    break;
                }
              }}
            >
              <Item key={'importOriginalImages'}>
                <ImageAdd />
                <Text>{t('menu.importOriginalImages')}</Text>
              </Item>
              <Item key={'importFromFolder'}>
                <ImageAutoMode />
                <Text>{t('menu.importFromFolder')}</Text>
              </Item>
              <Item key={'openImportFolder'}>
                <ImageCheckedOut />
                <Text>{t('menu.openImportFolder')}</Text>
              </Item>
            </Menu>
          </MenuTrigger>
          <MenuTrigger>
            <ActionButton isQuiet>
              {t('menu.tag')}
            </ActionButton>
            <Menu
              onAction={(key) => {
                switch (key) {
                  case 'addTag':
                    setAddTagDialogOpen(true);
                    break;
                }
              }}
            >
              <Item key={'addTag'}>
                <BookmarkSingle />
                <Text>{t('menu.addTag')}</Text>
              </Item>
            </Menu>
          </MenuTrigger>
          <MenuTrigger>
            <ActionButton isQuiet>
              LoRa
            </ActionButton>
            <Menu
              onAction={(key) => {
                switch (key) {
                  case 'loraPresetManager':
                    setLoraConfigManagerDialogOpen(true);
                    break;
                  case 'generationPreviewImageProps':
                    setPreviewPropsDialogOpen(true);
                    break;
                  case 'openOutputModelFolder':
                    openModelFolder();
                    break;
                  case 'openPretrainedModelFolder':
                    openPretrainedModelFolder();
                    break;
                }
              }}
            >
              <Item key={'loraPresetManager'}>
                <Settings />
                <Text>{t('menu.loraPresetManager')}</Text>
              </Item>

              <Section>
                <Item key={'openOutputModelFolder'}>
                  <FolderAddTo />
                  <Text>{t('menu.openOutputModelFolder')}</Text>
                </Item>
                <Item key={'openPretrainedModelFolder'}>
                  <FolderAddTo />
                  <Text>{t('menu.openPretrainedModelFolder')}</Text>
                </Item>
              </Section>

            </Menu>
          </MenuTrigger>
          <MenuTrigger>
            <ActionButton isQuiet>
              {t('menu.settings')}
            </ActionButton>
            <Menu
              onAction={(key) => {
                switch (key) {
                  case 'scriptManager':
                    setRepoManagerDialogOpen(true);
                    break;
                  case 'previewManager':
                    setPreviewSettingsDialogOpen(true);
                    break;
                  case 'settings':
                    setSettingDialogOpen(true);
                    break;
                  case 'openLog':
                    onOpenLog();
                    break;
                  case 'exportLog':
                    onExportLog();
                    break;
                  case 'onOpenStableDiffusionModelsFolder':
                    onOpenStableDiffusionModelsFolder();
                    break;
                }
              }}
            >
              <Section>
                <Item key={'scriptManager'}>
                  <Settings />
                  <Text>{t('menu.scriptManager')}</Text>
                </Item>
                <Item key={'previewManager'}>
                  <Settings />
                  <Text>{t('menu.previewManager')}</Text>
                </Item>
                <Item key={'onOpenStableDiffusionModelsFolder'}>
                  <FolderOpen />
                  <Text>{t('menu.openStableDiffusionModelFolder')}</Text>
                </Item>
              </Section>
              <Section >
              <Item key={'settings'}>
                <Settings />
                <Text>{t('menu.settings')}</Text>
              </Item>
              </Section>
              <Section>
              <Item key={'openLog'}>
                <FileTxt />
                <Text>{t('menu.openLog')}</Text>
              </Item>
              <Item key={'exportLog'}>
                <FolderAddTo />
                <Text>{t('menu.exportLog')}</Text>
              </Item>
              </Section>
            </Menu>
          </MenuTrigger>
        </Flex>
        <div
          style={{
            flex: 1,
            height: '100%'

          }}
          className={styles.dragSpace}
        >

        </div>
        <Flex>
          <ActionButton
            isQuiet
            onPress={minimizeWindow}
          >
            <Remove />
          </ActionButton>
          <ActionButton
            isQuiet
            onPress={resizeWindow}
          >
            <ViewSingle />
          </ActionButton>
          <ActionButton
            isQuiet
            onPress={closeWindow}
          >
            <Close />
          </ActionButton>
        </Flex>
      </div>
      {
        trainContext.workDir ? (
            <div className={styles.split}>
              <Tabs
                orientation='vertical'
                defaultSelectedKey={'0'}
                disallowEmptySelection
                selectedKey={trainContext.panelIndex}
                onSelectionChange={(key: Key) => {
                  setTrainContext({
                    ...trainContext,
                    panelIndex: key
                  });
                }}
                isQuiet
              >
                <Flex
                  UNSAFE_style={{
                    backgroundColor: '#202020',
                    paddingTop: 16
                  }}
                >
                  <TabList>
                    <Item key='4'>
                      <Images />
                    </Item>
                    <Item key='0'>
                      <Folder />
                    </Item>
                    <Item key='2'>
                      <DataMapping />
                    </Item>
                    <Item key='1'>
                      <Dashboard />
                    </Item>
                    <Item key='3'>
                      <Apps />
                    </Item>
                  </TabList>
                </Flex>
                <TabPanels>
                  <Item key='4'>
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '100%'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto'
                      }}>
                        <OriginalPanel />
                      </div>
                    </div>

                  </Item>
                  <Item key='0'>
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '100%'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto'
                      }}>
                        <DatasetPanel />
                      </div>
                    </div>
                  </Item>
                  <Item key='1'>
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '100%'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto'
                      }}>
                        <TrainingPanel />

                      </div>
                    </div>
                  </Item>
                  <Item key='2'>
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '100%'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto'
                      }}>
                        <TrainConfigPanel />
                      </div>
                    </div>
                  </Item>
                  <Item key='3'>
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '100%'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto'
                      }}>
                        <ModelsPanel />
                      </div>
                    </div>
                  </Item>
                </TabPanels>

              </Tabs>

            </div>
          ) :
          <div style={{ flex: 1 }}>
            <StartPanel
              onCreateProject={onNewProject}
              onOpenProject={() => onOpenProject({})}
              onOpenProjectWithPath={(projectPath) => onOpenProject({ projectPath })}
            />
          </div>
      }
      <div
        style={{
          backgroundColor: '#202020',
          display: 'flex',
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 16,
          paddingRight: 16
        }}>
        <div
          style={{
            flex: 1
          }}
        >
        </div>
        <DialogTrigger type='popover'>
          <ActionButton isQuiet>

            <div style={{
              display: 'flex',
              gap: 8,
              paddingLeft: 16,
              paddingRight: 16,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              项目检查器
              <div style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <Info size={'XXS'} />
                {
                  inspectorResult.filter(it => it.type === 'error').length
                }
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <Alert />
                {
                  inspectorResult.filter(it => it.type === 'warning').length
                }
              </div>
            </div>

          </ActionButton>
          {
            <InspectorPopup inspectorResult={inspectorResult} />
          }
        </DialogTrigger>
      </div>

    </div>
  );
};
export default MainEditorPage;
