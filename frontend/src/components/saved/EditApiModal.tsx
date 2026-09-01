import React, { useState } from 'react';
import { api } from '../../services/api';
import type { SavedApi, WorkspaceCategory } from '../../types/savedApi';
import { useToast } from '../../context/ToastContext';

interface EditApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiItem: SavedApi | null;
  onUpdated: (updatedApi: SavedApi) => void;
  workspaces?: WorkspaceCategory[];
}

const EditApiModalContent: React.FC<{
  onClose: () => void;
  apiItem: SavedApi;
  onUpdated: (updatedApi: SavedApi) => void;
  workspaces: WorkspaceCategory[];
}> = ({ onClose, apiItem, onUpdated, workspaces }) => {
  const toast = useToast();
  const [name, setName] = useState(apiItem.name);
  const [url, setUrl] = useState(apiItem.url);
  const [category, setCategory] = useState(apiItem.category || 'General');
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    if (!cleanName) {
      setError('Please enter an API name.');
      toast.warning('Please enter an API name.');
      return;
    }
    if (!cleanUrl) {
      setError('Please enter a target API URL.');
      toast.warning('Please enter a target API URL.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: { name: string; url: string; category: string; api_key?: string } = {
        name: cleanName,
        url: cleanUrl,
        category: category.trim() || 'General',
      };
      if (apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }

      const updated = await api.updateSavedApi(apiItem.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update API.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wb-modal-backdrop" onClick={onClose}>
      <div className="wb-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3 className="wb-modal-title">Edit Saved API</h3>
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
              <label className="wb-form-label">Workspace / Category</label>
              {workspaces.length > 0 ? (
                <select
                  className="wb-form-input"
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
                  type="text"
                  className="wb-form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Core API, Authentication, General"
                  disabled={isSubmitting}
                />
              )}
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
                  {apiItem.has_api_key ? 'Key configured' : 'No key configured'}
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
                  style={{ position: 'absolute', right: '0.65rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showPassword ? 'Hide key' : 'Show key'}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
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
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditApiModal: React.FC<EditApiModalProps> = ({
  isOpen,
  onClose,
  apiItem,
  onUpdated,
  workspaces = [],
}) => {
  if (!isOpen || !apiItem) return null;

  return (
    <EditApiModalContent
      key={apiItem.id}
      onClose={onClose}
      apiItem={apiItem}
      onUpdated={onUpdated}
      workspaces={workspaces}
    />
  );
};
