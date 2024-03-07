import { TrainerSettingParameter, TrainerSettings } from '../../../../../types';
import { useEffect, useState } from 'react';
import { readTrainerSettings, saveTrainerSettings } from '../../../../service/training/config';
import styles from './index.module.css';
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
  Item,
  Picker,
  Switch,
  TextField
} from '@adobe/react-spectrum';


export type SettingsDialogProps = {
  isOpen: boolean,
  onClose?: () => void
}
const SettingsDialog = (
  {
    isOpen,
    onClose
  }: SettingsDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.setting' });
  const params: TrainerSettingParameter[] = [
    {
      name: 'proxy',
      label: t('proxy'),
      type: 'string',
      description: t('proxy'),
      default: undefined
    }
  ];
  const [settings, setSettings] = useState<TrainerSettings>({});
  const [invalid, setInvalid] = useState<{ [key: string]: string }>({});
  const refreshSettings = async () => {
    const settings = await readTrainerSettings();
    if (!settings) {
      return;
    }
    setSettings(settings);
  };
  const onSave = async () => {
    await saveTrainerSettings(settings);
    onClose?.();
  };
  useEffect(() => {
    refreshSettings();
  }, [isOpen]);
  useEffect(() => {
    const result: { [key: string]: string } = {};
    if (settings.proxy) {
      try {
        new URL(settings.proxy);
      } catch (e) {
        result.proxy = t('invalidProxy');
      }
    }
    setInvalid(result);
  }, [settings]);
  return (
    <DialogContainer onDismiss={() => onClose?.()} isDismissable={true}>
      {
        isOpen &&
        (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Divider />

            <Content>
              {
                params.map(it => {
                  const renderInput = () => {
                    if (it.choices) {
                      return (
                        <Picker
                          onSelectionChange={(e) => {
                            setSettings({
                              ...settings,
                              [it.name]: e.toString()
                            } as any);
                          }}
                          selectedKey={settings[it.name]}
                          label={it.label}
                          width={'100%'}
                          validationState={invalid[it.name] ? 'invalid' : undefined}
                          errorMessage={invalid[it.name]}
                        >
                          {
                            it.choices.map(choice => {
                              return (
                                <Item key={choice}>
                                  {choice}
                                </Item>
                              );
                            })
                          }
                        </Picker>
                      );
                    }
                    switch (it.type) {
                      case 'string':
                        return (
                          <TextField
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                [it.name]: e
                              } as any);
                            }}
                            value={settings[it.name]}
                            label={it.label}
                            width={'100%'}
                            validationState={invalid[it.name] ? 'invalid' : undefined}
                            errorMessage={invalid[it.name]}
                          />
                        );
                      case 'boolean':
                        return (
                          <Switch
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                [it.name]: e
                              } as any);
                            }}
                            isSelected={settings[it.name]}
                            width={'100%'}

                          >
                            {
                              it.label
                            }
                          </Switch>
                        );
                      case 'number':
                        return (
                          <TextField
                            value={settings[it.name]}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                [it.name]: e
                              } as any);
                            }}
                            label={it.label}
                            width={'100%'}
                            validationState={invalid[it.name] ? 'invalid' : undefined}
                            errorMessage={invalid[it.name]}
                          />
                        );

                    }
                  };
                  return (
                    <div className={styles.settingItem}>
                      {renderInput()}
                    </div>
                  );
                })
              }
              <Flex width={'100%'} marginTop={16} justifyContent={'right'}>
                <ButtonGroup>
                  <Button
                    variant='secondary'
                    onPress={onClose}

                  >{t('cancel')}</Button>
                  <Button
                    variant='accent'
                    onPress={onSave}
                    isDisabled={Object.keys(invalid).length > 0}
                  >{t('save')}</Button>
                </ButtonGroup>
              </Flex>
            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );

};

export default SettingsDialog;
