import { useEffect, useState } from 'react';
import { ChannelsKeys, DataStoreKeys, LoraConfig, RepoCloneProgress, TrainerSettings } from '../../../../../types';
import { ipcRenderer } from '../../../../service/base';
import { openAccelerateConfig } from '../../../../service/trainer/installer';
import { updateTrainRepo } from '../../../../service/training/repo';
import { useTranslation } from 'react-i18next';
import { saveTrainerSettings } from '../../../../service/training/config';
import { readConfig, saveConfig, selectFolder } from '../../../../service/config';
import { cloneTrainRepo, installTrainRepo, openFolder } from '../../../../service/vcs';
import {
  ActionButton,
  Button,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Flex,
  Heading,
  ProgressBar,
  Switch,
  TextField,
  Well
} from '@adobe/react-spectrum';
import ConsoleOutDialog from '../ConsoleOutDialog';
import { toast } from 'react-toastify';
import { useConfirmation } from '../../../components/ConfirmDialog/provider';

export type RepoManagerDialogProps = {
  isOpen: boolean,
  onClose: () => void
}
const RepoManagerDialog = (
  {
    isOpen,
    onClose
  }: RepoManagerDialogProps
) => {
  const confirm = useConfirmation()
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.scriptManager' });
  const [consoleOutDialogOpen, setConsoleOutDialogOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<RepoCloneProgress | undefined>(undefined);
  const init = async () => {
    const saveConfigData = await readConfig({ key: DataStoreKeys.trainerConfig });
    console.log(saveConfigData);
    if (saveConfigData) {
      setConfig(saveConfigData);
    }
    const saveTrainSettings = await readConfig({ key: DataStoreKeys.trainerSetting });
    if (saveTrainSettings) {
      setSettings(saveTrainSettings);
    }
  };
  const [config, setConfig] = useState<LoraConfig>({});
  const [settings, setSettings] = useState<TrainerSettings>({});
  const onSaveHandler = async () => {
    saveConfig({ key: 'training_config', value: config });
    toast.success(t('saveConfigSuccess'), {
      position: "bottom-center",
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
      hideProgressBar:true,
      closeButton:false,
    });
    onClose();
  };
  const updateTrainSettings = async (updateData: Partial<TrainerSettings>) => {
    await saveTrainerSettings({
      ...settings,
      ...updateData
    });
  };
  const onSelectExecPath = async () => {
    const selectPath = await selectFolder({ title: t('selectPath') });
    console.log({
      ...config,
      loraPythonExec: selectPath,
      preprocessRepo: selectPath
    });
    if (selectPath) {
      setConfig({
        ...config,
        loraPythonExec: selectPath,
        preprocessRepo: selectPath
      });
    }
  };
  const onSaveSettingsConfig = async (config: Partial<TrainerSettings>) => {

  };
  useEffect(() => {
    init();
    ipcRenderer.on(ChannelsKeys.cloneSuccess, ({ repo }: { repo: string }) => {
      switch (repo) {
        case 'train':
          toast.success(t('downloadScriptSuccess'), {
            position: "bottom-center",
            autoClose: 2000,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            hideProgressBar:true,
            closeButton:false,
          });
      }
    });
    ipcRenderer.on(ChannelsKeys.cloneFail, ({ repo, e }: { repo: string, e: Error }) => {
      switch (repo) {
        case 'train':
          toast.error(t('downloadScriptFailed', { e: e }), {
            position: "bottom-center",
            autoClose: 2000,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            hideProgressBar:true,
            closeButton:false,
          });
          break;
      }
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.cloneSuccess);
      ipcRenderer.removeAllListeners(ChannelsKeys.cloneFail);
    };
  }, []);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.cloneRepoProgress, (data: RepoCloneProgress) => {
      setProgress(data);
    });
  }, [progress]);
  const onUpdateTrainRepo = async () => {
    toast.info(t('updateScript'), {
      position: "bottom-center",
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
      hideProgressBar:true,
      closeButton:false,
    });
    try {
      await updateTrainRepo();

    } catch (e) {
      toast.error(t('updateScriptFailed'), {
        position: "bottom-center",
        autoClose: 2000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "dark",
        hideProgressBar:true,
        closeButton:false,
      });
      return;
    }
    toast.success(t('updateScriptSuccess'), {
      position: "bottom-center",
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
      hideProgressBar:true,
      closeButton:false,
    });
  };
  const onUpdateRepo = () => {
    confirm({
      title: t('updateScript'),
      description: t('updateScriptConfirmContent'),
      variant: 'warning',
      onConfirm: async () => {
        toast.info(t('downloadScriptTitle'), {
          position: "bottom-center",
          autoClose: 2000,
          closeOnClick: true,
          pauseOnHover: true,
          theme: "dark",
          hideProgressBar:true,
          closeButton:false,
        });
        cloneTrainRepo({ workDir: config.loraPythonExec! });
      }
    });

  }
  return (
    <>
      <ConsoleOutDialog isOpen={consoleOutDialogOpen} onClose={() => setConsoleOutDialogOpen(false)} />
      <DialogContainer onDismiss={() => onClose?.()} isDismissable={true}>
        {
          isOpen &&
          (
            <Dialog width={'70vw'}>
              <Heading>{t('title')}</Heading>
              <Divider />
              <Content>
                <Flex
                  width={'100%'}
                  gap={16}
                  alignItems={'last baseline'}
                >
                  <TextField
                    value={config.loraPythonExec}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        loraPythonExec: e,
                        preprocessRepo: e
                      });
                    }}
                    label={t('scriptPath')}
                    flex={1}
                  />
                  <ActionButton onPress={onSelectExecPath}>
                    {
                      t('selectPath')
                    }
                  </ActionButton>
                </Flex>
                <Flex marginTop={16}>
                  <Switch
                    isSelected={settings.loraScriptCnRepo}
                    onChange={(e) => {
                      updateTrainSettings({
                        loraScriptCnRepo: e
                      });
                    }}
                    flex={1}
                  >
                    {
                      t('useCnRepo')
                    }
                  </Switch>
                </Flex>
                <Well>
                  <Flex marginTop={16} gap={16}>
                    <ActionButton
                      onPress={onUpdateRepo}
                    >
                      {
                        t('downloadScriptTitle')
                      }
                    </ActionButton>
                    <ActionButton
                      onPress={onUpdateTrainRepo}
                    >
                      {t('updateScript')}
                    </ActionButton>
                    <ActionButton
                      onPress={() => {
                        installTrainRepo({ workDir: config.loraPythonExec! });
                        setConsoleOutDialogOpen(true);
                      }}
                    >
                      {
                        t('installScript')
                      }
                    </ActionButton>
                    <ActionButton
                      onPress={() => {
                        openAccelerateConfig();
                      }}
                    >
                      Accelerate Config
                    </ActionButton>
                    <ActionButton
                      onPress={() => {
                        openFolder({ path: config.loraPythonExec! });
                      }}
                    >
                      {
                        t('openFolder')
                      }
                    </ActionButton>
                  </Flex>
                </Well>
                <ProgressBar
                  value={progress?.progress}
                  width={'100%'}
                  label={' '}
                  marginTop={16}
                />
                <Flex gap={16} marginTop={32} justifyContent={'right'}>
                  <Button
                    onPress={onSaveHandler}
                    variant={'accent'}
                  >
                    {
                      t('saveAndClose')
                    }
                  </Button>
                  <Button variant={'primary'} onPress={onClose}>
                    {t('close')}
                  </Button>
                </Flex>


              </Content>
            </Dialog>
          )
        }
      </DialogContainer>
    </>
  );

};
export default RepoManagerDialog;
