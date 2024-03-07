import React from 'react';
import { TrainParams } from '../../../../../types';
import { useFormik } from 'formik';
import { defaultParams } from '../../data';
import { useTranslation } from 'react-i18next';
import { Button, Content, Dialog, DialogContainer, Flex, Heading, Switch, TextField } from '@adobe/react-spectrum';

export type NewLoraConfigDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onCreate: (name: string, config: TrainParams) => void
}

const NewLoraConfigDialog = (
  {
    isOpen,
    onClose,
    onCreate
  }: NewLoraConfigDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.newLoraPreset' });
  const formik = useFormik<{
    name?: string
    params: TrainParams,
  }>({
    initialValues:{
      params: defaultParams
    },
    onSubmit: (values, actions) => {
      console.log(values);
      onCreate(values.name!, values.params);
    }
  })
  return (
    <DialogContainer onDismiss={onClose} isDismissable>
      {
        isOpen && (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Content marginTop={16}>
              <Flex

                gap={16}
                direction={'column'}
                height={'60vh'}
                UNSAFE_style={{
                overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingLeft: 16,
                  paddingRight: 16

              }}>


              <TextField label={t('name')} value={formik.values.name} onChange={(value) => {formik.setFieldValue('name', value)}} width={"100%"}/>
              {
                Object.keys(defaultParams).map((key) => {
                  const fieldName = `params.${key}`;
                  switch (typeof defaultParams[key]) {
                    case 'boolean':
                      return (
                        <Switch isSelected={formik.values.params[key]} onChange={(isSelect) => formik.setFieldValue(fieldName,isSelect)} width={"100%"}>
                          {key}
                        </Switch>
                      );
                    case 'string':
                      return (
                        <TextField label={key} onChange={e => formik.setFieldValue(fieldName,e)} value={formik.values.params[key]} width={"100%"}/>
                      );
                    case 'number':
                      return (
                        <TextField label={key} onChange={e => formik.setFieldValue(fieldName,e)} value={formik.values.params[key]} width={"100%"}/>
                      );

                  }
                  return (<div></div>);
                })
              }
              </Flex>

              <Flex marginTop={32} justifyContent={'end'} gap={16}>
                <Button variant={'accent'} onPress={formik.submitForm}>
                  {t("create")}
                </Button>
                <Button variant={'primary'} onPress={onClose}>
                  {
                    t("cancel")
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

export default NewLoraConfigDialog;
