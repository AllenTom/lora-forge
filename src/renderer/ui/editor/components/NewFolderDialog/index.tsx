import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Button, Content, Dialog, DialogContainer, Flex, Heading, TextField } from '@adobe/react-spectrum';
import { useEffect } from 'react';
import { FormikHelpers } from 'formik/dist/types';

export type NewFolderDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onNewFolder?: (name: string, step: number) => void,
  excludeNames: string[]
}
const NewFolderDialog = (
  {
    onClose,
    onNewFolder,
    isOpen,
    excludeNames
  }: NewFolderDialogProps) => {
  const { t } = useTranslation();

  const formik = useFormik<{
    name?: string;
    step?: string;
  }>(
    {
      initialValues: {},
      onSubmit: (values,formikHelpers: FormikHelpers<any>) => {
        onNewFolder?.(values.name!, parseInt(values.step!));
        formikHelpers.resetForm();
        onClose();
      },
      validate: values => {
        const result: { [key: string]: string } = {};
        if (!values.name || values.name.length === 0) {
          result['name'] = t('dialogs.newDataset.nameRequired');
        }
        if (!values.step || values.step.length === 0) {
          result['step'] = t('dialogs.newDataset.stepRequired');
        }
        // step must integer
        if (values.step && values.step.length !== 0 && !/^\d+$/.test(values.step)) {
          result['step'] = t('dialogs.newDataset.stepMustInteger');
        }

        if (values.name && excludeNames.includes(values.name)) {
          result['name'] = t('dialogs.newDataset.nameExists',{
            name: values.name
          });
        }
        return result;
      },
      initialErrors: {
        name: t('dialogs.newDataset.nameRequired'),
        step: t('dialogs.newDataset.stepRequired')
      },
      onReset: (_, formikHelpers: FormikHelpers<any>) => {
        console.log('reset')
        formikHelpers.setValues({
          name: '',
          step: ''
        });
      }
    });
  useEffect(() => {

    formik.resetForm();

  }, [open]);

  return (
    <DialogContainer
      onDismiss={onClose}
      isDismissable
    >
      {
        isOpen && (
          <Dialog>
            <Heading>{t('dialogs.newDataset.title')}</Heading>
            <Content marginTop={16}>
              <Flex direction={'column'} gap={16}>
                <TextField
                  label={t('dialogs.newDataset.name')}
                  name={'name'}
                  onChange={(val) => formik.setFieldValue('name', val)}
                  value={formik.values.name}
                  width={'100%'}
                  validationState={formik.errors.name ? 'invalid' : undefined}
                  errorMessage={formik.errors.name}
                />
                <TextField
                  label={t('dialogs.newDataset.step')}
                  name={'step'}
                  onChange={(val) => formik.setFieldValue('step', val)}
                  value={formik.values.step}
                  width={'100%'}
                  validationState={formik.errors.step ? 'invalid' : undefined}
                  errorMessage={formik.errors.step}
                />
              </Flex>

              <Flex width={'100%'} justifyContent={'right'} marginTop={'size-325'}>
                <Button variant={'primary'} onPress={() => formik.submitForm()}>
                  {t('dialogs.newDataset.create')}
                </Button>
              </Flex>
            </Content>
          </Dialog>
        )
      }

    </DialogContainer>
  );
};
export default NewFolderDialog;
