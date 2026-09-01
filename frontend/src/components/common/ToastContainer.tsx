import React, { useEffect, useState, useCallback } from 'react';
import type { ToastItem } from '../../context/ToastContext';
import './toast.css';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, handleDismiss]);

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'error':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`wb-toast-card ${toast.type} ${isExiting ? 'exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="wb-toast-icon-wrap">{renderIcon()}</div>
      <div className="wb-toast-body">
        {toast.title && <div className="wb-toast-title">{toast.title}</div>}
        <div className="wb-toast-message">{toast.message}</div>
      </div>
      <button
        type="button"
        className="wb-toast-close-btn"
        onClick={handleDismiss}
        title="Dismiss notification"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside aria-label="Notifications" className="wb-toast-viewport">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
};
