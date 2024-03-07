import { AlertDialog, DialogContainer, SpectrumAlertDialogProps } from '@adobe/react-spectrum';
import React from 'react';

export type ConfirmDialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  onOk: () => void
  title: string;
  description: string;
  variant: SpectrumAlertDialogProps['variant'],
  width: SpectrumAlertDialogProps['width'],
  positiveLabel: string;
  cancelLabel: string;

}

const ConfirmDialog = ({
                         isOpen,
                         onClose,
                         title,
                         description,
                         onOk,
                         variant,
                         positiveLabel,
                         cancelLabel,
                         width
                       }: ConfirmDialogProps) => {
  return (
    <DialogContainer
      onDismiss={() => {
        onClose?.();
      }}
    >
      {
        isOpen && (
          <AlertDialog
            title={title}
            variant={variant}
            onPrimaryAction={onOk}
            onCancel={onClose}
            cancelLabel={cancelLabel}
            width={width}
            primaryActionLabel={positiveLabel}>
            <pre style={{
              lineBreak: 'anywhere',

            }}>
              {description}
            </pre>

          </AlertDialog>
        )
      }
    </DialogContainer>
  );
};

export default ConfirmDialog;
