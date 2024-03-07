import styles from './index.module.css';
import { useEffect, useState } from 'react';
import { ipcRenderer } from '../../../../service/base';
import { ChannelsKeys, InstallMessage } from '../../../../../types';
import { interruptInstallTrainRepo } from '../../../../service/training/repo';
import { useTranslation } from 'react-i18next';
import { Button, Content, Dialog, DialogContainer, Divider, Flex, Heading } from '@adobe/react-spectrum';

export type ConsoleOutDialogProps = {
  isOpen: boolean,
  onClose?: () => void
}
const ConsoleOutDialog = (
  {
    isOpen,
    onClose
  }: ConsoleOutDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.consoleOut' });
  const [installLog, setInstallLog] = useState<string>('');
  const [isInstallSuccess, setIsInstallSuccess] = useState<boolean>(false);
  const [installFailed, setInstallFailed] = useState<boolean>(false);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.installLog, (arg: InstallMessage) => {
      switch (arg.event) {
        case 'message':
          setInstallLog(arg.message + '\n' + installLog);
          break;
        case 'repo-install-success':
          setIsInstallSuccess(true);
          console.log('success');
          break;
        case 'repo-install-failed':
          setInstallFailed(true);
          break;
      }
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.installLog);
    };
  }, [installLog, isInstallSuccess, installFailed]);
  const closeHandler = () => {
    setInstallLog('');
    setIsInstallSuccess(false);
    setInstallFailed(false);
    onClose && onClose();
  };
  const onInterruptHandler = () => {
    interruptInstallTrainRepo();
  };
  return (
    <DialogContainer onDismiss={() => onClose?.()} >
      {
        isOpen &&
        (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Divider />
            <Content>
              <pre className={styles.logContent}>
            {
              installLog
            }
            </pre>
              <Flex width={'100%'} marginTop={16} justifyContent={'right'} gap={16}>
              {
                !installFailed ?
                  <Button
                    variant={'accent'}
                    isDisabled={!isInstallSuccess}
                    onPress={closeHandler}
                  >
                    {t('complete')}
                  </Button>
                  :
                  <Button
                    variant={'negative'}
                    onPress={closeHandler}
                  >
                    {t('installFailed')}
                  </Button>
              }
              {
                !installFailed && !isInstallSuccess && (
                  <Button
                    variant={'primary'}
                    onPress={onInterruptHandler}>
                    {
                      t('interrupt')
                    }
                  </Button>
                )
              }
              </Flex>
            </Content>

          </Dialog>
        )
      }
    </DialogContainer>
  );
};
export default ConsoleOutDialog;
