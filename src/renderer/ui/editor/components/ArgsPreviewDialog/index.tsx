import { TrainEnvContext } from '../../../../../types';
import styles from './index.module.css';
import { useTranslation } from 'react-i18next';
import { Content, Dialog, DialogContainer, Divider, Flex, Heading } from '@adobe/react-spectrum';

export type ArgsPreviewDialogProps = {
  isOpen: boolean,
  onClose?: () => void
  data?: TrainEnvContext
}
const ArgsPreviewDialog = (
  {
    isOpen,
    data,
    onClose
  }: ArgsPreviewDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.trainArgPreview' });
  return (
    <DialogContainer onDismiss={() => onClose?.()} isDismissable={true}>
      {
        isOpen &&
        (
          <Dialog height={"70vh"}>
            <Heading>{t('title')}</Heading>
            <Divider />
            <Content
            >
              <Flex
                direction={'column'}
                gap={8}
              >
                {
                  data && (
                    <>
                      <div>
                        {t('trainArg')}
                      </div>

                      {
                        Object.keys(data.argObject).map((item, index) => {
                          return (
                            <div key={index} className={styles.item}>
                              <div className={styles.itemArgName}>
                                {item}
                              </div>
                              <div>
                                {
                                  data.argObject[item]
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      <div>

                        {t('command')}

                      </div>
                      <div className={styles.item}>
                        {
                          data.trainingArgs.join(' ')
                        }
                      </div>


                    </>
                  )
                }
              </Flex>


            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  );
};

export default ArgsPreviewDialog;
