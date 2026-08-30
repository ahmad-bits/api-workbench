import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import type { SavedApi } from '../../types/savedApi';

interface EditApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiItem: SavedApi | null;
  onUpdated: (updated: SavedApi) => void;
}

export const EditApiModal: React.FC<EditApiModalProps> = ({
  isOpen,
  onClose,
  apiItem,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [removeKey, setRemoveKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && apiItem) {
      setName(apiItem.name);
      setUrl(apiItem.url);
      setApiKey('');
      setRemoveKey(false);
      setShowPassword(false);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, apiItem]);

  if (!isOpen || !apiItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    if (!cleanName) {
      setError('Please enter a name for this API.');
      return;
    }
    if (!cleanUrl) {
      setError('A valid API URL is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: cleanName,
        url: cleanUrl,
      };

      if (removeKey) {
        payload.api_key = ''; // Clear key
      } else if (apiKey.trim()) {
        payload.api_key = apiKey.trim(); // Update key
      }

      const updated = await api.updateSavedApi(apiItem.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content save-api-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">✏️</span>
            <h2 className="modal-title">Edit Saved API</h2>
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
            <label className="form-label" htmlFor="edit-api-name">
              API Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="edit-api-name"
              ref={inputRef}
              type="text"
              className="form-input"
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
            <label className="form-label" htmlFor="edit-api-url">
              API URL <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="edit-api-url"
              type="text"
              className="form-input"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://api.example.com/..."
              disabled={isSubmitting}
              maxLength={1000}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="edit-api-key">
                API Key (Optional)
              </label>
              {apiItem.has_api_key && !removeKey && (
                <span className="badge-key-detected" style={{ fontSize: '0.75rem' }}>
                  🔒 Key Stored: ••••••••
                </span>
              )}
            </div>

            {!removeKey ? (
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="edit-api-key"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={apiItem.has_api_key ? 'Enter new API key to overwrite, or leave blank' : 'Optional API key (e.g. Bearer token, X-API-Key)'}
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
            ) : (
              <div className="auth-alert success" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
                <span>Existing API key will be removed upon saving.</span>
                <button
                  type="button"
                  className="btn-link"
                  style={{ marginLeft: 'auto', fontSize: '0.8rem' }}
                  onClick={() => setRemoveKey(false)}
                >
                  Undo
                </button>
              </div>
            )}

            {apiItem.has_api_key && !removeKey && (
              <div style={{ marginTop: '0.35rem', textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn-link-action"
                  style={{ color: 'var(--accent-danger)', fontSize: '0.78rem' }}
                  onClick={() => {
                    setRemoveKey(true);
                    setApiKey('');
                  }}
                >
                  🗑️ Remove Stored API Key
                </button>
              </div>
            )}
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update API</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
