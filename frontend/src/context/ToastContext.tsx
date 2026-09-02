import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastContainer } from '../components/common/ToastContainer';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastOptions {
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCountRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      toastCountRef.current += 1;
      const id = `toast_${Date.now()}_${toastCountRef.current}`;
      const duration = options?.duration !== undefined ? options.duration : (type === 'error' ? 5000 : 3500);

      const newToast: ToastItem = {
        id,
        type,
        title: options?.title,
        message,
        duration,
      };

      setToasts((prev) => {
        const trimmed = prev.length >= 5 ? prev.slice(prev.length - 4) : prev;
        return [...trimmed, newToast];
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => showToast('success', message, options),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => showToast('error', message, options),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => showToast('warning', message, options),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => showToast('info', message, options),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
