import { useTranslation } from 'react-i18next';
import { readTrainerSettings, saveTrainerSettings } from '../../../../service/training/config';
import { useEffect, useState } from 'react';
import { TrainerSettings } from '../../../../../types';
import {
  ActionButton,
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogContainer,
  Flex,
  Form,
  Heading,
  Switch,
  TextField
} from '@adobe/react-spectrum';
import { useFormik } from 'formik';
import { selectFolder } from '../../../../service/config';

export type PreviewManagerDialogProps = {
  isOpen: boolean,
  onCancel: () => void
}

function Divider() {
  return null;
}

const PreviewManagerDialog = (
  {
    isOpen,
    onCancel
  }: PreviewManagerDialogProps
) => {
  const [trainSettings, setTrainSettings] = useState<TrainerSettings>();
  const [progress, setProgress] = useState<number>(0);
  const formContext = useFormik<Partial<TrainerSettings>>({
    initialValues: {},
    onSubmit: () => {},
    validate:values => {
      const errors: {[key: string]: string} = {};
      return errors;
    }
  });
  const init = async () => {
    const trainerSettings = await readTrainerSettings();
    setTrainSettings(trainerSettings);
    console.log(trainerSettings);
    if (trainerSettings) {
      formContext.setValues({
        ...trainerSettings
      });
    }
  };
  useEffect(() => {
    init();
  }, []);
  const save = async () => {
    const values = formContext.values;
    await saveTrainerSettings({
      ...trainSettings,
      ...values
    });
  };


  const onApplyHandler = async () => {
    await save();
    onCancel();
  };
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.previewManager' });
  return (
    <DialogContainer onDismiss={onCancel} isDismissable={true}>
      {
        isOpen &&
        (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Divider />
            <Content>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 16
                }}
              >
                {t('titleConfig')}
              </div>
              <Form width={'100%'}>
                <div
                  style={{
                    display:'flex',
                    alignItems:'end',
                    gap:16
                  }}
                >
                  <TextField
                    flex={1}
                    label={t('fieldSdModelPath')}
                    value={formContext.values.sdwModelPath}
                    onChange={(e) => formContext.setFieldValue('sdwModelPath', e)}
                  />
                  <ActionButton
                    onPress={async () => {
                      const path = await selectFolder({ title: t('selectPath') });
                      if (path) {
                        formContext.setFieldValue('sdwModelPath', path);
                      }
                  }}>
                    {t('selectPath')}
                  </ActionButton>
                </div>

                <Switch
                  isSelected={formContext.values.previewXformers}
                  onChange={(e) => formContext.setFieldValue('previewXformers', e)}
                >
                  xformers
                </Switch>
              </Form>
              <Flex width={'100%'} marginTop={16} justifyContent={'right'}>
                <ButtonGroup>
                  <Button
                    variant='secondary'
                    onPress={onCancel}
                  >{t('cancel')}</Button>
                  <Button variant='accent' onPress={onApplyHandler}>{t('apply')}</Button>
                </ButtonGroup>
              </Flex>

            </Content>

          </Dialog>
        )
      }

    </DialogContainer>
  );
};
export default PreviewManagerDialog;
