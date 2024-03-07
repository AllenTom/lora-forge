import { useTranslation } from 'react-i18next';
import {
  ActionButton,
  Button,
  Content,
  Dialog,
  DialogContainer,
  Flex,
  Heading,
  Item,
  ListView,
  ProgressBar
} from '@adobe/react-spectrum';
import { useEffect, useState } from 'react';
import { unique } from 'radash';
import { importImagesFromFiles, importOriginalImage } from '../../../../service/training/preprocess';
import { ipcRenderer } from '../../../../service/base';
import { ChannelsKeys, ImportOriginalProcess, OriginalItem } from '../../../../../types';

export type ImportOriginalDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onComplete?: (items: OriginalItem[]) => void
}

const ImportOriginalDialog = (
  {
    isOpen,
    onClose,
    onComplete
  }: ImportOriginalDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.importOriginal' });
  const [importPaths, setImportPaths] = useState<string[]>([]);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportOriginalProcess | null>(null);
  const onSelectImage = async () => {
    const paths = await importImagesFromFiles();
    if (paths) {
      setImportPaths(unique([...importPaths, ...paths]));
    }
  };
  const reset = () => {
    setImportPaths([]);
    setCurrentFilePath(null);
    setSelectedItems([]);
    setIsImporting(false);
    setProgress(null);
  }
  const onDeleteSelected = () => {
    setImportPaths(importPaths.filter(it => !selectedItems.includes(it)));
    setSelectedItems([]);
  };
  const onImport = async () => {
    setIsImporting(true);
    const result = await importOriginalImage(importPaths);
    if (result) {
      onComplete?.(result);
    }
  };
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.importImageProcessEvent, (progress: ImportOriginalProcess) => {
      setProgress(progress);
      console.log(progress)

    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.importImageProcessEvent);
    }
  }, [progress, isImporting]);
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  },[isOpen])
  const getImportProgress = () => {
    if (progress && progress.total > 0) {
      return Math.round(progress.current / progress.total * 100);
    }
    return 0;
  };
  const getProgressText = () => {
    if (progress) {
      return `${progress.current}/${progress.total}`;
    }
    return '';
  }
  return (
    <DialogContainer onDismiss={onClose} isDismissable>
      {
        isOpen && (
          <Dialog width={'70vw'}>
            <Heading>{t('title')}</Heading>
            <Content marginTop={16}>
              <Flex width={'100%'} gap={16}>
                <ActionButton marginBottom={16} onPress={onSelectImage} flex={1}>
                  {
                    t('selectImage')
                  }
                </ActionButton>
                <ActionButton onPress={onDeleteSelected}>
                  {
                    t('deleteSelected')
                  }
                </ActionButton>
              </Flex>
              {
                isImporting &&
                (
                  <ProgressBar value={getImportProgress()} width={'100%'} marginBottom={32} label={getProgressText()}/>

                )
              }
              <Flex gap={16}>
                <ListView
                  items={importPaths.map(it => ({ id: it, name: it }))}
                  width={'100%'}
                  height={320}
                  onAction={(key) => {
                    if (key) {
                      setCurrentFilePath(key.toString())
                    }
                  }}
                  selectionMode={'multiple'}
                  onSelectionChange={(keys) => setSelectedItems(Array.from(keys) as any)}
                  selectedKeys={selectedItems}
                >
                  {(item) => <Item>{item.name}</Item>}
                </ListView>
                <div style={{
                  width: 320,
                  height: 320
                }}>
                  {
                    currentFilePath &&
                    <>
                      <img
                        src={`file:///${currentFilePath}`}
                        style={{
                          width: 320,
                          height: 320 - 64,
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{
                        width: 320,
                        height: 64
                      }}>
                        {
                          currentFilePath
                        }
                      </div>
                    </>
                  }
                </div>
              </Flex>

              <Flex width={'100%'} justifyContent={'end'} gap={16} marginTop={32}>
                <Button variant={'accent'} onPress={onImport}>
                  {
                    t('import')
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
export default ImportOriginalDialog;
