import { LorePreset } from '../../../../../types';
import React, { useEffect, useState } from 'react';
import { addTrainConfig, getLoraPresetList, removeTrainConfig } from '../../../../service/training/train';
import NewLoraConfigDialog from '../NewLoraConfigDialog';
import { useTranslation } from 'react-i18next';
import {
  ActionButton,
  Cell,
  Column,
  Content,
  Dialog,
  DialogContainer,
  Flex,
  Heading,
  Row,
  TableBody,
  TableHeader,
  TableView
} from '@adobe/react-spectrum';

export type LoraConfigManagerDialogProps = {
  isOpen: boolean,
  onClose: () => void

}
const LoraConfigManagerDialog = (
  {
    isOpen,
    onClose
  }: LoraConfigManagerDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.loraPresetManager' });
  const [lorePresets, setLorePresets] = useState<LorePreset[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const refresh = async () => {
    const list = await getLoraPresetList();
    setLorePresets(list);
  };
  useEffect(() => {
    refresh();
  }, []);
  const onDelete = async (name: string) => {
    await removeTrainConfig(name);
    await refresh();
  };
  return (
    <>
      <DialogContainer onDismiss={onClose} isDismissable>
      {
        isOpen && (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Content marginTop={16}>
              <ActionButton onPress={() => setIsCreateDialogOpen(true)}>{t("new")}</ActionButton>
              <Flex
                marginTop={16}
                direction={'column'}
                UNSAFE_style={{
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}
              >
                <TableView
                  overflowMode={'truncate'}
                  width={'100%'}
                  height={'60vh'}
                  defaultSelectedKeys={"0"}
                >
                  <TableHeader>
                    <Column>{t('name')}</Column>
                    <Column>{t('actions')}</Column>
                  </TableHeader>
                  <TableBody>
                    {
                      lorePresets.map(it => {
                        return (
                          <Row key={it.name}>
                            <Cell>{it.name}</Cell>
                            <Cell>
                              {
                                it.builtIn ?


                                      t('builtIn')

                                  :
                                  <Flex >
                                    <ActionButton
                                      onPress={() => onDelete(it.name)}
                                    >
                                      {
                                        t('delete')
                                      }
                                    </ActionButton>
                                  </Flex>
                              }

                            </Cell>
                          </Row>
                        );
                      })
                    }
                  </TableBody>
                </TableView>
              </Flex>
            </Content>
          </Dialog>
        )
      }
      </DialogContainer>
      <NewLoraConfigDialog
        onClose={() => setIsCreateDialogOpen(false)}
        isOpen={isCreateDialogOpen}
        onCreate={async (name, config) => {
          // no built-in config
          const isBuiltIn = lorePresets.find(it => it.name === name && it.builtIn);
          if (isBuiltIn) {
            return;
          }
          await addTrainConfig({
            name,
            params: config,
            builtIn: false
          });
          await refresh();
          setIsCreateDialogOpen(false);
        }}
      />
    </>

  );
};
export default LoraConfigManagerDialog;
