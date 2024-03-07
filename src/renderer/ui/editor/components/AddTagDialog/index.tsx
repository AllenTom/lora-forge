import { useFormik } from 'formik';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Content, Dialog, DialogContainer, Flex, Heading, TextField } from '@adobe/react-spectrum';

export type AddTagDialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  onAdd: (tags:string[]) => void;
}
const AddTagDialog = (
  {
    isOpen,
    onAdd,
    onClose
  }: AddTagDialogProps
) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.addTagDialog' });
  const formik = useFormik<{
    names?:string
  }>({
    initialValues:{

    },
    onSubmit: (values) => {
      if (!values.names) {
        return;
      }
      onAdd?.(values.names.split(','));
    },
    validate: values => {
      const result: { [key: string]: string } = {};
      if (!values.names || values.names.length === 0) {
        result['names'] = t('nameRequired');
      }
      if (values.names && values.names.length !== 0) {
        const tags = values.names.split(',');
        for (const tag of tags) {
          if (!tag || tag.length === 0) {
            result['names'] = t('existEmptyTag');
          }
        }
        // without duplicate
        if (tags.length !== new Set(tags).size) {
          result['names'] = t('existDuplicateTag');
        }
      }
      return result;
    }
  })
  useEffect(() => {
    formik.resetForm()
  },[isOpen])
  return (
    <DialogContainer
      onDismiss={() => {
        onClose?.();
      }}
      isDismissable
    >
      {
        isOpen && (
          <Dialog width={'70vw'}>
            <Heading>{t('title')}</Heading>
            <Content marginTop={'size-160'}>
              <Flex minHeight={'20vh'} direction={'column'} gap={16}>
                <div style={{
                  display:"flex",
                  flexDirection:"row",
                  flexWrap:"wrap",
                  gap:8,
                }}>
                  {
                    formik.values.names?.split(',').filter(it => it !== '').map((item) => {
                      return (
                        <Badge variant="positive" key={"item"}>{item}</Badge>
                      )
                    })
                  }
                </div>

                <TextField
                  label={t('tagsLabel')}
                  width={'100%'}
                  onChange={(e) => { formik.setFieldValue("names",e) }}
                  validationState={formik.errors.names ? 'invalid' : undefined}
                  errorMessage={formik.errors.names}
                />
              </Flex>
              <Flex justifyContent={'right'} gap={'size-100'} marginTop={'size-325'}>
                <Button
                  onPress={formik.submitForm}
                        variant={'accent'}>
                  {t('add')}
                </Button>
                <Button onPress={onClose} variant={'secondary'}>
                  {t('cancel')}
                </Button>
              </Flex>
            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};
export default AddTagDialog;
