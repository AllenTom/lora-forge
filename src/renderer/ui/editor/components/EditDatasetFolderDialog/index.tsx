import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Button, Content, Dialog, DialogContainer, Flex, Heading, TextField } from '@adobe/react-spectrum';
import { DatasetFolder } from '../../../../../types';
import { useEffect } from 'react';

export type EditFolderDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onComplete?: (folder:DatasetFolder) => void
  folder?: DatasetFolder
}
const EditFolderDialog = (
  {
    onClose,
    onComplete,
    isOpen,
    folder
  }: EditFolderDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.editDatasetFolder' });
  const formik = useFormik<{
    name?: string;
    step?: string;
  }>(
    {
      initialValues: {

      },
      onSubmit: values => {
        if (!folder){
          return
        }
        onComplete?.({
          ...folder,
          name:values.name!,
          step:parseInt(values.step!)
        });
        onClose();
      }
    });
  useEffect(() => {
    if (!folder){
      return
    }
    formik.setFieldValue('name', folder.name)
    formik.setFieldValue('step', folder.step.toString())
  },[folder])
  return (
    <DialogContainer
      onDismiss={onClose}
      isDismissable
    >
      {
        isOpen && (
          <Dialog>
            <Heading>{t("title")}</Heading>
            <Content marginTop={16}>
              <Flex direction={'column'} gap={16}>
                <TextField
                  label={t("title")}
                  name={'name'}
                  onChange={(val) => formik.setFieldValue('name', val)}
                  value={formik.values.name}
                  width={"100%"}
                />
                <TextField
                  label={t("step")}
                  name={'step'}
                  onChange={(val) => formik.setFieldValue('step', val)}
                  value={formik.values.step}
                  width={"100%"}
                />
              </Flex>

              <Flex width={"100%"} justifyContent={'right'} marginTop={'size-325'} gap={16}>
                <Button variant={'primary'} onPress={() => formik.submitForm()}>
                  {t("save")}
                </Button>
                <Button variant={'secondary'} onPress={onClose}>
                  {t("cancel")}
                </Button>
              </Flex>
            </Content>
          </Dialog>
        )
      }

    </DialogContainer>
  );
};
export default EditFolderDialog;
