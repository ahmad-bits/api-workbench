/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import type { ConfirmOptions } from '../types/modal';

export type { ModalVariant, ConfirmOptions } from '../types/modal';

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setModalState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {modalState.isOpen && (
        <ConfirmationModal
          isOpen={modalState.isOpen}
          options={modalState.options}
          onConfirm={handleConfirm}
          onCancel={handleClose}
        />
      )}
    </ModalContext.Provider>
  );
};

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ModalProvider');
  }
  return context.confirm;
}
