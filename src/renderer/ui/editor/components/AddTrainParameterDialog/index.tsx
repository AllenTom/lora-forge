import { TrainParameter } from '../../../../../types';
import { useEffect, useState } from 'react';
import { getTrainParameterList } from '../../data';
import { useTranslation } from 'react-i18next';
import { Button, Content, Dialog, DialogContainer, Flex, Heading, TextField } from '@adobe/react-spectrum';

export type AddTrainParameterDialogProps = {
  isOpen: boolean,
  onClose?: () => void
  onAdd: (params: TrainParameter[]) => void
  excludeParams?: string[]
  additionalParams?: TrainParameter[]
}
const AddTrainParameterDialog = (
  {
    onClose,
    onAdd,
    isOpen,
    excludeParams,
    additionalParams = []
  }: AddTrainParameterDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.addTrainParam' });

  const TrainParameterList = getTrainParameterList(useTranslation('translation').t);
  const [searchInput, setSearchInput] = useState<string>('');
  const getDisplayParam = () => {
    let list = [...TrainParameterList, ...additionalParams];
    if (excludeParams) {
      list = list.filter((param) => {
        return !excludeParams.includes(param.name);
      });
    }
    if (searchInput === '') {
      return list;
    }
    return list.filter((param) => {
      return param.name.includes(searchInput);
    });
  };
  const [selectedParamName, setSelectedParamName] = useState<string[]>([]);
  const onSelected = (param: TrainParameter) => {
    if (selectedParamName.includes(param.name)) {
      setSelectedParamName(selectedParamName.filter((p) => p !== param.name));
    } else {
      setSelectedParamName([...selectedParamName, param.name]);
    }
  };
  const isSelected = (param: TrainParameter) => {
    return selectedParamName.includes(param.name);
  };
  useEffect(() => {
    if (!isOpen) {
      setSelectedParamName([]);
      setSearchInput('');
    }
  }, [isOpen]);

  return (
    <DialogContainer onDismiss={() => onClose?.()} isDismissable>
      {
        isOpen && (
          <Dialog width={'50vw'}>
            <Heading>{t('title')}</Heading>
            <Content marginTop={16}>
              <TextField
                width={'100%'}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e);
                }}
                placeholder={t('search')}
              />
              <div
                style={{
                  height: '50vh',
                  overflowY: 'auto',
                  marginTop: 16
                }}>
                {
                  getDisplayParam().map(param => {
                    return (
                      <div
                        style={{
                          backgroundColor: '#202020',
                          padding: 8,
                          marginBottom: 8,
                          borderRadius: 4,
                          display: 'flex',
                          paddingRight: 16,
                          paddingLeft: 16,
                          alignItems: 'center',
                          cursor: 'pointer',
                          border: isSelected(param) ? '2px solid aqua' : '2px solid #202020'
                        }}
                        onClick={() => {
                          onSelected(param);
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            marginRight: 32
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 16
                            }}
                          >

                            {
                              param.name
                            }
                          </div>
                          <div
                            style={{
                              color: 'gray',
                              fontSize: 12
                            }}>
                            {
                              param.description
                            }
                          </div>
                        </div>
                        <div
                          style={{
                            color: 'gray'
                          }}>
                          {
                            param.type
                          }
                        </div>

                      </div>
                    );
                  })
                }
              </div>
              <Flex width={'100%'} justifyContent={'end'} gap={16} marginTop={32}>
                <Button variant={'accent'} onPress={() => {
                  onAdd(selectedParamName.map((name) => {
                    return getDisplayParam().find((param) => param.name === name)!;
                  }));
                  onClose && onClose();
                }}>
                  {t('add')}
                </Button>
              </Flex>
            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};

export default AddTrainParameterDialog;
