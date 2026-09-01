export type ModalVariant = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  requireInputText?: string;
  inputPlaceholder?: string;
}
