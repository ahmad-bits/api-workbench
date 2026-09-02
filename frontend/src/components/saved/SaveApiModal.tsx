import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import type { SavedApi, WorkspaceCategory } from '../../types/savedApi';
import { useToast } from '../../context/ToastContext';

interface SaveApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  detectedApiKey?: string | null;
  onSaved: (savedApi: SavedApi) => void;
  workspaces?: WorkspaceCategory[];
}

export const SaveApiModal: React.FC<SaveApiModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  detectedApiKey,
  onSaved,
  workspaces = [],
}) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(
    workspaces.length > 0 ? workspaces[0].name : 'General'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setCategory(workspaces.length > 0 ? workspaces[0].name : 'General');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a name for this API.');
      toast.warning('Please enter an API name.');
      return;
    }
    if (!currentUrl.trim()) {
      setError('A valid API URL is required to save.');
      toast.warning('A valid API URL is required to save.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await api.createSavedApi({
        name: cleanName,
        url: currentUrl.trim(),
        category: category.trim() || 'General',
        api_key: detectedApiKey ? detectedApiKey.trim() : undefined,
      });
      onSaved(saved);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save API.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content save-api-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Save API Configuration</h2>
          </div>
          <button type="button" className="btn-close-modal" onClick={handleClose} title="Close">
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
            <label className="form-label" htmlFor="save-api-name">
              API Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              id="save-api-name"
              ref={inputRef}
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              placeholder="e.g. List Products, Auth Service"
              maxLength={120}
              required
            />
            <span className="form-label-hint">Give this API configuration an easily identifiable name.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="save-api-category">
              Workspace / Category
            </label>
            {workspaces.length > 0 ? (
              <select
                id="save-api-category"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                style={{ cursor: 'pointer' }}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.name}>
                    {ws.name}
                  </option>
                ))}
                <option value="General">General (No Workspace)</option>
              </select>
            ) : (
              <input
                id="save-api-category"
                type="text"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Core API, Authentication, General"
                disabled={isSubmitting}
              />
            )}
          </div>

          <div className="save-api-preview-box">
            <div className="preview-row">
              <span className="preview-label">API URL:</span>
              <span className="preview-value-url" title={currentUrl}>
                {currentUrl || '(No URL configured)'}
              </span>
            </div>
            <div className="preview-row">
              <span className="preview-label">API Key:</span>
              <span className="preview-value-key">
                {detectedApiKey ? (
                  <span className="badge-key-detected">
                    Auto-Captured &bull; ••••••••
                  </span>
                ) : (
                  <span className="badge-no-key">None (Optional)</span>
                )}
              </span>
            </div>
          </div>

          <div className="modal-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save to My APIs</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
