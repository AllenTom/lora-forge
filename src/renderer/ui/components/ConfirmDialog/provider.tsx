import * as React from 'react';
import ConfirmDialog from './index';
import { SpectrumAlertDialogProps } from '@adobe/react-spectrum';
import { useTranslation } from 'react-i18next';

export interface ConfirmationOptions {
  variant: SpectrumAlertDialogProps['variant']
  title: string
  description: string
  onConfirm?: () => Promise<void>
  onCancel?: () => Promise<void>
  positiveLabel?: string
  negativeLabel?: string,
  width?: SpectrumAlertDialogProps['width']
}


const ConfirmationServiceContext = React.createContext<
  (options: ConfirmationOptions) => void
>(Promise.reject);

export const useConfirmation = () =>
  React.useContext(ConfirmationServiceContext);
export const ConfirmationServiceProvider = ({ children }:{
  children: React.ReactNode
}) => {
  const {t} = useTranslation()
  const [
    confirmationState,
    setConfirmationState
  ] = React.useState<ConfirmationOptions | null>(null);



  const openConfirmation = (options: ConfirmationOptions) => {
    setConfirmationState(options);
  };

  const handleClose = async () => {
    if (confirmationState?.onCancel){
      await confirmationState.onCancel();
    }
    setConfirmationState(null);
  };

  const handleSubmit = async () => {
    if (confirmationState?.onConfirm){
      await confirmationState.onConfirm();
    }
    setConfirmationState(null);
  };

  return (
    <>
      <ConfirmationServiceContext.Provider
        value={openConfirmation}
        children={children}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmationState)}
        onOk={handleSubmit}
        onClose={handleClose}
        variant={confirmationState?.variant}
        title={confirmationState?.title ?? ""}
        description={confirmationState?.description ?? ""}
        positiveLabel={confirmationState?.positiveLabel ?? t('other.confirmDialog.confirm')}
        cancelLabel={confirmationState?.negativeLabel ?? t('other.confirmDialog.cancel')}
        width={confirmationState?.width}
      />
    </>
  );
};
