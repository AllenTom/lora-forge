import { useTranslation } from 'react-i18next';
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Flex,
  Heading,
  ProgressBar
} from '@adobe/react-spectrum';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import { ipcRenderer } from '../../../../service/base';
import { ChannelsKeys, ProcessOutputEvent, SegOut } from '../../../../../types';
import { useConfirmation } from '../../../components/ConfirmDialog/provider';
import ConsoleOut, { ConsoleOutMessage } from '../../../components/ConsoleOut';

export type SegAnimePersonDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onCreate: () => void
  onInterrupt: () => void
}
const SegAnimePersonDialog = (
  {
    isOpen,
    onClose,
    onCreate,
    onInterrupt
  }: SegAnimePersonDialogProps) => {
  const confirm = useConfirmation();
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.segAnimeCharacter' });
  const [progress, setProgress] = React.useState(0);
  const [isDone, setIsDone] = React.useState(true);
  const [outputMessages, setOutputMessages] = React.useState<ConsoleOutMessage[]>([]);
  const formik = useFormik<{}>({
    initialValues: {
      width: 512,
      height: 512
    },
    onSubmit: (values) => {
      setIsDone(false);
      setProgress(0)
      setOutputMessages([])
      onCreate();
    }
  });
  const onCloseDialog = () => {
    formik.resetForm();
    onClose();
  };
  const interrupt = () => {
    onInterrupt();
    setIsDone(true);
  };
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.segAnimeCharacterOut, (event: ProcessOutputEvent<SegOut>) => {
      setOutputMessages([
        ...outputMessages,
        {
          type: 'info',
          message: JSON.stringify(event)
        }
      ]);
      if (event.event === 'aniseg_progress' && event.vars) {
        const data = event.vars;
        if (data.total > 0) {
          setProgress((data.current / data.total) * 100);
        }
        if (data.current === data.total) {
          setIsDone(true);
          onCloseDialog();
        }
      }
    });
    ipcRenderer.on(ChannelsKeys.segAnimeCharacterStdErr, (data: string) => {
      setOutputMessages([
        ...outputMessages,
        {
          type: 'error',
          message: data
        }
      ]);
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.segAnimeCharacterOut);
      ipcRenderer.removeAllListeners(ChannelsKeys.segAnimeCharacterStdErr);
    };
  }, [isDone, progress, outputMessages]);
  return (
    <DialogContainer onDismiss={onCloseDialog} isDismissable={true}>
      {
        isOpen &&
        (
          <Dialog isDismissable={!isDone}>
            <Heading>{t('title')}</Heading>
            <Divider />
            <Content>
              <Flex direction={'column'}>
                <ProgressBar value={progress} width={'100%'} label={t('progress')} />
                <ConsoleOut messages={outputMessages} style={{
                  backgroundColor: '#2a2a2a',
                  height: '40vh',
                  marginTop: 16,
                }} />
              </Flex>
              <Flex width={'100%'} marginTop={64} justifyContent={'right'}>
                <ButtonGroup>
                  <Button
                    variant='secondary'
                    onPress={onCloseDialog}
                    isDisabled={!isDone}
                  >{t('cancel')}</Button>
                  <Button
                    variant='secondary'
                    onPress={interrupt}
                    isDisabled={isDone}
                  >{t('interrupt')}</Button>
                  <Button variant='accent' onPress={formik.submitForm} isDisabled={!isDone}>{t('generate')}</Button>
                </ButtonGroup>
              </Flex>
            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};

export default SegAnimePersonDialog;
