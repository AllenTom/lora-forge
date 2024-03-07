import { useTranslation } from 'react-i18next';
import {
  ActionButton,
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Flex,
  Heading,
  Slider,
  TextField
} from '@adobe/react-spectrum';
import { useFormik } from 'formik';
import { selectFolder } from '../../../../service/config';

export type NewProjectValues = {
  width: number
  height: number
  name: string
  path: string
}
export type NewProjectDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onCreate: (values: NewProjectValues) => void
}
const NewProjectDialog = (
  {
    isOpen,
    onClose,
    onCreate
  }: NewProjectDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.newProject' });
  const formik = useFormik<{
    width: number
    height: number
    name?: string
    path?: string
  }>({
    initialValues: {
      width: 512,
      height: 512
    },
    onSubmit: (values) => {
      if (!values.name || !values.path) {
        return;
      }
      onCreate({
        name: values.name,
        path: values.path,
        width: values.width,
        height: values.height
      });
    }
  });
  const onSelectPath = async () => {
    const selectPath = await selectFolder({ title: t('selectProjectPath') });
    if (selectPath) {
      formik.setFieldValue('path', selectPath);
    }
  };
  const onCloseDialog = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <DialogContainer onDismiss={onCloseDialog} isDismissable={true}>
      {
        isOpen &&
        (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Divider />
            <Content>
              <TextField
                width={'100%'} value={formik.values.name} onChange={(v) => formik.setFieldValue('name', v)}
                label={t('name')} marginBottom={16} labelPosition={'side'} />
              <Flex width={'100%'} gap={16} alignItems={'center'}>
                <TextField flex={1} value={formik.values.path} onChange={(v) => formik.setFieldValue('path', v)}
                           label={t('path')} labelPosition={'side'} />
                <ActionButton onPress={onSelectPath}>{t('selectPath')}</ActionButton>
              </Flex>
              <div
                style={{
                  marginTop: 32
                }}
              >
                {t('projectProps')}
              </div>
              <Flex marginTop={16} gap={16}>
                <Slider flex={1} label={t('width')} value={formik.values.width}
                        onChange={(v) => formik.setFieldValue('width', v)} minValue={8} maxValue={2048} step={8} />
                <Slider flex={1} label={t('height')} value={formik.values.height}
                        onChange={(v) => formik.setFieldValue('height', v)} minValue={8} maxValue={2048} step={8} />
              </Flex>
              <Flex width={'100%'} marginTop={64} justifyContent={'right'}>
                <ButtonGroup>
                  <Button
                    variant='secondary'
                    onPress={onCloseDialog}
                  >{t('cancel')}</Button>
                  <Button variant='accent' onPress={formik.submitForm}>{t('create')}</Button>
                </ButtonGroup>
              </Flex>
            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};

export default NewProjectDialog;
