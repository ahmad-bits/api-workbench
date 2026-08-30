import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { SavedApi } from '../../types/savedApi';
import { AddApiModal } from './AddApiModal';
import { EditApiModal } from './EditApiModal';

interface SavedApiManagerProps {
  onOpenInTester: (apiId: string) => void;
  onCountChange?: (count: number) => void;
}

export const SavedApiManager: React.FC<SavedApiManagerProps> = ({
  onOpenInTester,
  onCountChange,
}) => {
  const [apis, setApis] = useState<SavedApi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingApi, setEditingApi] = useState<SavedApi | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  const fetchApis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSavedApis();
      setApis(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved APIs.');
    } finally {
      setIsLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchApis();
  }, [fetchApis]);

  const handleApiCreated = (newApi: SavedApi) => {
    setApis((prev) => [newApi, ...prev]);
    if (onCountChange) onCountChange(apis.length + 1);
    setActionSuccess(`API "${newApi.name}" was saved successfully.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleApiUpdated = (updatedApi: SavedApi) => {
    setApis((prev) => prev.map((item) => (item.id === updatedApi.id ? updatedApi : item)));
    setActionSuccess(`API "${updatedApi.name}" was updated successfully.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleDelete = async (item: SavedApi) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await api.deleteSavedApi(item.id);
      const remaining = apis.filter((a) => a.id !== item.id);
      setApis(remaining);
      if (onCountChange) onCountChange(remaining.length);
      setActionSuccess(`API "${item.name}" was deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete saved API.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = (item: SavedApi) => {
    navigator.clipboard.writeText(item.url);
    setCopiedUrlId(item.id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const filteredApis = apis.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
  });

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="saved-api-manager-container">
      {/* Top Header & Actions Bar */}
      <div className="saved-api-header-bar">
        <div className="saved-api-header-left">
          <div className="saved-api-title-row">
            <span className="saved-api-header-icon">🗂️</span>
            <h1 className="saved-api-main-title">My Saved APIs</h1>
            <span className="saved-api-count-badge">
              {apis.length} {apis.length === 1 ? 'API' : 'APIs'}
            </span>
          </div>
          <p className="saved-api-header-subtitle">
            Manage your personal library of saved endpoints and encrypted API keys.
          </p>
        </div>

        <div className="saved-api-header-right">
          <button
            type="button"
            className="btn-primary btn-add-api"
            onClick={() => setIsAddModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add API</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="auth-alert success" style={{ marginBottom: '1.25rem' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="auth-alert error" style={{ marginBottom: '1.25rem' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button
            type="button"
            className="btn-link"
            style={{ marginLeft: 'auto', fontSize: '0.8rem' }}
            onClick={fetchApis}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      {apis.length > 0 && (
        <div className="saved-api-search-bar">
          <div className="input-with-icon" style={{ maxWidth: '420px', width: '100%' }}>
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search saved APIs by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
          <span className="saved-api-filter-count">
            Showing {filteredApis.length} of {apis.length}
          </span>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="saved-api-loading-state">
          <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
          <span>Loading your saved APIs...</span>
        </div>
      ) : apis.length === 0 ? (
        <div className="saved-api-empty-state">
          <div className="empty-state-icon">🗂️</div>
          <h3 className="empty-state-title">No Saved APIs Yet</h3>
          <p className="empty-state-desc">
            Save frequent API endpoints and keys so you can test them anytime in one click.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ marginTop: '1rem' }}
          >
            + Add Your First API
          </button>
        </div>
      ) : filteredApis.length === 0 ? (
        <div className="saved-api-empty-state" style={{ padding: '2.5rem 1.5rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🔍</span>
          <h3 className="empty-state-title" style={{ marginTop: '0.5rem' }}>No Matching APIs Found</h3>
          <p className="empty-state-desc">
            No saved APIs match "{searchQuery}". Try a different search term.
          </p>
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setSearchQuery('')}
            style={{ marginTop: '0.75rem' }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="saved-api-grid">
          {filteredApis.map((item) => (
            <div key={item.id} className="saved-api-card glass-card">
              {/* Card Header */}
              <div className="saved-api-card-header">
                <div className="saved-api-name-badge-group">
                  <h3 className="saved-api-card-name" title={item.name}>
                    {item.name}
                  </h3>
                  {item.has_api_key ? (
                    <span className="badge-key-pill secured" title="API Key is securely encrypted with AES at rest">
                      🔒 Key: {item.api_key_masked || '••••••••'}
                    </span>
                  ) : (
                    <span className="badge-key-pill open" title="No API key configured for this endpoint">
                      🔓 No Key
                    </span>
                  )}
                </div>

                <div className="saved-api-date-label">
                  {formatDate(item.created_at)}
                </div>
              </div>

              {/* Card URL Body */}
              <div className="saved-api-url-row">
                <span className="url-method-tag">ENDPOINT</span>
                <span className="saved-api-url-text" title={item.url}>
                  {item.url}
                </span>
                <button
                  type="button"
                  className="btn-copy-url"
                  onClick={() => handleCopyUrl(item)}
                  title="Copy URL to clipboard"
                >
                  {copiedUrlId === item.id ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Card Footer Actions */}
              <div className="saved-api-card-footer">
                <button
                  type="button"
                  className="btn-open-tester"
                  onClick={() => onOpenInTester(item.id)}
                  title="Load URL and decrypted API Key into API Tester"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Open in Tester</span>
                </button>

                <div className="saved-api-sub-actions">
                  <button
                    type="button"
                    className="btn-card-action edit"
                    onClick={() => setEditingApi(item)}
                    title="Edit API name, URL, or key"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    className="btn-card-action delete"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    title="Delete saved API"
                  >
                    {deletingId === item.id ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add API Modal */}
      <AddApiModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleApiCreated}
      />

      {/* Edit API Modal */}
      <EditApiModal
        isOpen={Boolean(editingApi)}
        onClose={() => setEditingApi(null)}
        apiItem={editingApi}
        onUpdated={handleApiUpdated}
      />
    </div>
  );
};
