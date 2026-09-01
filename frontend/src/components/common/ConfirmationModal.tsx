import React, { useState, useEffect, useRef } from 'react';
import type { ConfirmOptions } from '../../types/modal';
import './modal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  options,
  onConfirm,
  onCancel,
}) => {
  const {
    title,
    message,
    details,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    requireInputText,
    inputPlaceholder,
  } = options;

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (requireInputText) {
        inputRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [requireInputText]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isInputValid = !requireInputText || inputValue.trim() === requireInputText;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInputValid) {
      onConfirm();
    }
  };

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'primary':
      case 'info':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className="wb-confirm-backdrop" onClick={onCancel} role="presentation">
      <div
        className="wb-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-confirm-title"
      >
        <div className="wb-confirm-header">
          <div className={`wb-confirm-icon-badge ${variant}`}>{renderIcon()}</div>
          <div className="wb-confirm-title-area">
            <h3 id="wb-confirm-title" className="wb-confirm-title">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="wb-confirm-close-btn"
            onClick={onCancel}
            title="Cancel"
            aria-label="Close dialog"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="wb-confirm-body">
            <p className="wb-confirm-message">{message}</p>
            {details && <p className="wb-confirm-details">{details}</p>}

            {requireInputText && (
              <div className="wb-confirm-input-group">
                <label htmlFor="wb-confirm-input" className="wb-confirm-input-label">
                  Type <strong>{requireInputText}</strong> to confirm:
                </label>
                <input
                  id="wb-confirm-input"
                  ref={inputRef}
                  type="text"
                  className="wb-confirm-input-field"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder || requireInputText}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
            )}
          </div>

          <div className="wb-confirm-footer">
            <button
              type="button"
              className="wb-btn-confirm-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              ref={confirmBtnRef}
              type="submit"
              className={`wb-btn-confirm-action ${variant}`}
              disabled={!isInputValid}
            >
              <span>{confirmText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
