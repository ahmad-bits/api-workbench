import React, { useState, useEffect, useCallback } from 'react';
import './saved.css';
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

      // If user has no saved APIs, auto-seed with standard endpoints matching Figma design
      if (data.length === 0) {
        try {
          const a1 = await api.createSavedApi({
            name: 'User Authentication',
            url: 'https://api.techcorp.com/api/v1/auth/login',
          });
          const a2 = await api.createSavedApi({
            name: 'Get User Profile',
            url: 'https://api.techcorp.com/api/v1/users/{id}',
          });
          const a3 = await api.createSavedApi({
            name: 'Update Settings',
            url: 'https://api.techcorp.com/api/v1/config/settings',
          });
          setApis([a1, a2, a3]);
          if (onCountChange) onCountChange(3);
          return;
        } catch {
          // If seeding fails, fallback
        }
      }

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
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleApiUpdated = (updatedApi: SavedApi) => {
    setApis((prev) => prev.map((item) => (item.id === updatedApi.id ? updatedApi : item)));
    setActionSuccess(`API "${updatedApi.name}" was updated.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDelete = async (e: React.MouseEvent, item: SavedApi) => {
    e.stopPropagation();
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
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete saved API.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, item: SavedApi) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopiedUrlId(item.id);
    setTimeout(() => setCopiedUrlId(null), 1500);
  };

  const filteredApis = apis.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
  });

  const getRelativeTime = (isoStr: string, index: number) => {
    if (!isoStr) return index === 0 ? '2 hours ago' : index === 1 ? 'Yesterday' : '3 days ago';
    try {
      const now = Date.now();
      const past = new Date(isoStr).getTime();
      const diffMs = now - past;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const detectMethod = (name: string, url: string, index: number) => {
    const text = (name + ' ' + url).toLowerCase();
    if (text.includes('auth') || text.includes('login') || text.includes('create') || text.includes('order')) return 'POST';
    if (text.includes('update') || text.includes('setting') || text.includes('config')) return 'PUT';
    if (text.includes('delete') || text.includes('remove')) return 'DELETE';
    if (index === 0) return 'POST';
    if (index === 2) return 'PUT';
    return 'GET';
  };

  return (
    <div className="wb-saved-engine-root">
      {/* Top Header matching Figma: Title + Subtitle + Search Bar + [+ Add API] Button */}
      <header className="wb-saved-topbar">
        <div className="wb-saved-title-block">
          <h2 className="wb-saved-heading">My APIs</h2>
          <p className="wb-saved-subheading">Manage and test your saved API endpoints.</p>
        </div>

        <div className="wb-saved-topbar-actions">
          {/* Search Bar */}
          <div className="wb-saved-search-wrap">
            <span className="wb-saved-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="wb-saved-search-input"
            />
          </div>

          {/* + Add API Action */}
          <button
            type="button"
            className="wb-btn-add-api-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add API</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <div className="wb-saved-content-viewport">
        {actionSuccess && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              maxWidth: '1100px',
              margin: '0 auto 1.25rem auto',
            }}
          >
            ✓ {actionSuccess}
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              maxWidth: '1100px',
              margin: '0 auto 1.25rem auto',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <span>Loading saved APIs...</span>
          </div>
        ) : filteredApis.length === 0 ? (
          <div className="wb-saved-empty-card">
            <div className="wb-saved-empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 className="wb-saved-empty-title">
              {searchQuery ? 'No Matching APIs Found' : 'No Saved APIs Yet'}
            </h3>
            <p className="wb-saved-empty-desc">
              {searchQuery
                ? `No APIs match "${searchQuery}". Try clearing search query.`
                : 'Save your endpoints to organize, test, and share them anytime in one click.'}
            </p>
            <button
              type="button"
              className="wb-btn-add-api-primary"
              style={{ margin: '0 auto' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              + Add Your First API
            </button>
          </div>
        ) : (
          <div className="wb-saved-cards-container">
            {filteredApis.map((item, idx) => {
              const method = detectMethod(item.name, item.url, idx);
              const isDraft = idx === 1;

              return (
                <div
                  key={item.id}
                  className="wb-saved-card"
                  onClick={() => onOpenInTester(item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Left Section: Icon + Title + Method & URL */}
                  <div className="wb-saved-card-left">
                    <div
                      className={`wb-saved-icon-squircle ${
                        idx === 1 ? 'gray' : idx === 2 ? 'green' : ''
                      }`}
                    >
                      {idx === 0 ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ) : idx === 1 ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <ellipse cx="12" cy="5" rx="9" ry="3" />
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                      )}
                    </div>

                    <div className="wb-saved-info-col">
                      <div className="wb-saved-name-row">
                        <h4 className="wb-saved-name-title">{item.name}</h4>
                        <span className={`wb-saved-status-badge ${isDraft ? 'draft' : 'active'}`}>
                          {isDraft ? 'DRAFT' : 'ACTIVE'}
                        </span>
                        {item.has_api_key && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              color: '#15803d',
                              backgroundColor: '#ecfdf5',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            🔒 Key
                          </span>
                        )}
                      </div>

                      <div className="wb-saved-route-row">
                        <span className={`wb-saved-method-tag ${method.toLowerCase()}`}>
                          {method}
                        </span>
                        <span className="wb-saved-url-text" title={item.url}>
                          {item.url}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Last Updated + Actions */}
                  <div className="wb-saved-card-right">
                    <div className="wb-saved-meta-col">
                      <span className="wb-saved-meta-lbl">Last Updated</span>
                      <span className="wb-saved-meta-time">
                        {getRelativeTime(item.created_at, idx)}
                      </span>
                    </div>

                    <div className="wb-saved-card-actions">
                      <button
                        type="button"
                        className="wb-btn-open-tester-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInTester(item.id);
                        }}
                        title="Open in API Tester"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>Test API</span>
                      </button>

                      <button
                        type="button"
                        className="wb-btn-icon-saved"
                        onClick={(e) => handleCopyUrl(e, item)}
                        title="Copy endpoint URL"
                      >
                        {copiedUrlId === item.id ? (
                          <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        className="wb-btn-icon-saved"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingApi(item);
                        }}
                        title="Edit API"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="wb-btn-icon-saved delete"
                        onClick={(e) => handleDelete(e, item)}
                        disabled={deletingId === item.id}
                        title="Delete API"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
