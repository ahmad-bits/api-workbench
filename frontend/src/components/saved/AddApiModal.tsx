import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import type { SavedApi } from '../../types/savedApi';

interface AddApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (savedApi: SavedApi) => void;
}

export const AddApiModal: React.FC<AddApiModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUrl('');
      setApiKey('');
      setShowPassword(false);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    if (!cleanName) {
      setError('Please enter an API name.');
      return;
    }
    if (!cleanUrl) {
      setError('Please enter a target API URL.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createSavedApi({
        name: cleanName,
        url: cleanUrl,
        api_key: apiKey.trim() ? apiKey.trim() : undefined,
      });
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content save-api-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">✨</span>
            <h2 className="modal-title">Add New API Configuration</h2>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="save-api-form">
          {error && (
            <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="add-api-name">
              API Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="add-api-name"
              ref={inputRef}
              type="text"
              className="form-input"
              placeholder="e.g. OpenAI Chat API, Stripe Billing, GitHub GraphQL"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              maxLength={120}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="add-api-url">
              API URL <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="add-api-url"
              type="text"
              className="form-input"
              placeholder="https://api.example.com/v1/resource"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              maxLength={1000}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="add-api-key">
                API Key (Optional)
              </label>
              <span className="form-label-hint">Encrypted with AES-128</span>
            </div>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="add-api-key"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Optional API key (e.g. sk_live_..., Bearer token, api_token)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide key' : 'Show key'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <span className="form-label-hint" style={{ fontSize: '0.74rem' }}>
              🔒 Never stored as plain text. Automatically loaded into tester when opened.
            </span>
          </div>

          <div className="modal-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !name.trim() || !url.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                  <span>Adding API...</span>
                </>
              ) : (
                <span>Save API</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
