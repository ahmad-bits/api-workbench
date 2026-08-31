import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { SavedApi } from '../../types/savedApi';

interface EditApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiItem: SavedApi | null;
  onUpdated: (updatedApi: SavedApi) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && apiItem) {
      setName(apiItem.name);
      setUrl(apiItem.url);
      setApiKey('');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen, apiItem]);

  if (!isOpen || !apiItem) return null;

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
      const payload: any = {
        name: cleanName,
        url: cleanUrl,
      };
      if (apiKey.trim()) {
        payload.api_key = apiKey.trim();
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
    <div className="wb-modal-backdrop" onClick={onClose}>
      <div className="wb-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>✏️</span>
            <h3 className="wb-modal-title">Edit Saved API</h3>
          </div>
          <button
            type="button"
            className="wb-mock-btn-close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wb-modal-body">
            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}

            <div className="wb-form-field">
              <label className="wb-form-label">API Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                className="wb-form-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="wb-form-field">
              <label className="wb-form-label">API Endpoint URL <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                className="wb-form-input"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                style={{ fontFamily: 'JetBrains Mono', fontSize: '0.825rem' }}
                required
              />
            </div>

            <div className="wb-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="wb-form-label" style={{ margin: 0 }}>Update API Key (Optional)</label>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {apiItem.has_api_key ? 'Encrypted key already configured' : 'No key configured'}
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="wb-form-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isSubmitting}
                  style={{ paddingRight: '2.5rem', fontFamily: 'JetBrains Mono' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.65rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  title={showPassword ? 'Hide key' : 'Show key'}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>
          </div>

          <div className="wb-modal-footer">
            <button
              type="button"
              className="wb-btn-mock-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="wb-btn-mock-save"
              disabled={isSubmitting || !name.trim() || !url.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
