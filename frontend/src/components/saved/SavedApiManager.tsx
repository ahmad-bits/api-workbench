import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import './saved.css';
import { api } from '../../services/api';
import type { SavedApi, WorkspaceCategory } from '../../types/savedApi';
import { AddApiModal } from './AddApiModal';
import { EditApiModal } from './EditApiModal';
import { NewWorkspaceModal } from './NewWorkspaceModal';
import { NavToggle } from '../common/NavToggle';
import { useConfirm } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

const LOCAL_STORAGE_WS_KEY = 'api_workbench_custom_workspaces';

const slugify = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

interface SavedApiManagerProps {
  onOpenInTester: (apiId: string) => void;
  onCountChange?: (count: number) => void;
}

export const SavedApiManager: React.FC<SavedApiManagerProps> = ({
  onOpenInTester,
  onCountChange,
}) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const toast = useToast();

  const basePrefix = location.pathname.startsWith('/my-apis') ? '/my-apis' : '/apis';

  const [apis, setApis] = useState<SavedApi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'workspaces' | 'all'>('workspaces');

  const [workspaces, setWorkspaces] = useState<WorkspaceCategory[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_WS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      return [];
    }
    return [];
  });

  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingApi, setEditingApi] = useState<SavedApi | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    api.getSavedApis()
      .then((data) => {
        if (isSubscribed) {
          setApis(data);
          if (onCountChange) onCountChange(data.length);
          setIsLoading(false);

          setWorkspaces((prevWs) => {
            const existingNames = new Set(prevWs.map((w) => w.name.toLowerCase()));
            const newDiscovered: WorkspaceCategory[] = [];

            data.forEach((item) => {
              const cat = (item.category || '').trim();
              if (cat && cat !== 'General' && !existingNames.has(cat.toLowerCase())) {
                existingNames.add(cat.toLowerCase());
                newDiscovered.push({
                  id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: cat,
                  description: `${cat} workspace collection`,
                  iconTheme: 'blue',
                });
              }
            });

            if (newDiscovered.length > 0) {
              const combined = [...prevWs, ...newDiscovered];
              try {
                localStorage.setItem(LOCAL_STORAGE_WS_KEY, JSON.stringify(combined));
              } catch {
                return combined;
              }
              return combined;
            }
            return prevWs;
          });
        }
      })
      .catch((err: unknown) => {
        if (isSubscribed) {
          const msg = err instanceof Error ? err.message : 'Failed to load saved APIs.';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [onCountChange]);

  const activeWorkspace = useMemo<WorkspaceCategory | null>(() => {
    if (!slug) return null;
    const cleanSlug = slug.toLowerCase().trim();

    const matchedWs = workspaces.find((w) => slugify(w.name) === cleanSlug);
    if (matchedWs) return matchedWs;

    const matchedApi = apis.find((a) => slugify(a.category || '') === cleanSlug);
    if (matchedApi && matchedApi.category) {
      return {
        id: `ws-${cleanSlug}`,
        name: matchedApi.category,
        description: `${matchedApi.category} workspace collection`,
        iconTheme: 'blue',
      };
    }

    const humanized = cleanSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      id: `ws-${cleanSlug}`,
      name: humanized,
      description: `${humanized} workspace collection`,
      iconTheme: 'blue',
    };
  }, [slug, workspaces, apis]);

  const saveWorkspaces = (newList: WorkspaceCategory[]) => {
    setWorkspaces(newList);
    try {
      localStorage.setItem(LOCAL_STORAGE_WS_KEY, JSON.stringify(newList));
    } catch {
      return;
    }
  };

  const handleWorkspaceCreated = (newWs: WorkspaceCategory) => {
    saveWorkspaces([...workspaces, newWs]);
    navigate(`${basePrefix}/workspace/${slugify(newWs.name)}`);
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, ws: WorkspaceCategory) => {
    e.preventDefault();
    e.stopPropagation();
    const wsApis = getWorkspaceApis(ws.name);
    const confirmed = await confirm({
      title: 'Delete Workspace',
      message: `Are you sure you want to delete the workspace "${ws.name}"?`,
      details: wsApis.length > 0
        ? `This will permanently delete "${ws.name}" and all ${wsApis.length} saved endpoint(s) inside it.`
        : 'This action will permanently delete this workspace collection.',
      confirmText: wsApis.length > 0 ? 'Delete Workspace & Endpoints' : 'Delete Workspace',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteSavedApisByWorkspace(ws.name);

      const remainingApis = apis.filter(
        (a) => (a.category || 'General').toLowerCase() !== ws.name.toLowerCase()
      );
      setApis(remainingApis);
      if (onCountChange) onCountChange(remainingApis.length);

      const remaining = workspaces.filter((w) => w.id !== ws.id && slugify(w.name) !== slugify(ws.name));
      saveWorkspaces(remaining);

      if (activeWorkspace && slugify(activeWorkspace.name) === slugify(ws.name)) {
        navigate(basePrefix);
      }
      toast.success(`Workspace "${ws.name}" and all its endpoints were permanently deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace endpoints.';
      toast.error(msg);
    }
  };

  const handleApiCreated = (newApi: SavedApi) => {
    setApis((prev) => [newApi, ...prev]);
    if (onCountChange) onCountChange(apis.length + 1);
    toast.success(`API "${newApi.name}" was saved successfully!`);
  };

  const handleApiUpdated = (updatedApi: SavedApi) => {
    setApis((prev) => prev.map((item) => (item.id === updatedApi.id ? updatedApi : item)));
    toast.success(`API "${updatedApi.name}" was updated.`);
  };

  const handleDelete = async (e: React.MouseEvent, item: SavedApi) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete API',
      message: `Are you sure you want to delete "${item.name}"?`,
      details: 'This action cannot be undone. The API configuration will be permanently removed from your workspace.',
      confirmText: 'Delete API',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await api.deleteSavedApi(item.id);
      const remaining = apis.filter((a) => a.id !== item.id);
      setApis(remaining);
      if (onCountChange) onCountChange(remaining.length);
      toast.success(`API "${item.name}" was deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete saved API.';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, item: SavedApi) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopiedUrlId(item.id);
    toast.info('API endpoint URL copied to clipboard.');
    setTimeout(() => setCopiedUrlId(null), 1500);
  };

  const getWorkspaceApis = (workspaceName: string) => {
    return apis.filter((item) => (item.category || 'General').toLowerCase() === workspaceName.toLowerCase());
  };

  const filteredApis = apis.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  });

  const formatRelativeTime = (isoStr: string) => {
    if (!isoStr) return 'Recently';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const detectMethod = (name: string, url: string) => {
    const text = (name + ' ' + url).toLowerCase();
    if (text.includes('auth') || text.includes('login') || text.includes('create') || text.includes('order') || text.includes('post')) return 'POST';
    if (text.includes('update') || text.includes('setting') || text.includes('config') || text.includes('put')) return 'PUT';
    if (text.includes('delete') || text.includes('remove')) return 'DELETE';
    if (text.includes('patch')) return 'PATCH';
    return 'GET';
  };

  return (
    <div className="wb-saved-engine-root">
      <header className="wb-saved-topbar">
        <div className="wb-saved-left-wrap">
          <NavToggle />
          <div className="wb-saved-title-block">
            <div className="wb-saved-breadcrumb-row">
              {activeWorkspace ? (
                <div className="wb-breadcrumb-nav">
                  <Link to={basePrefix} className="wb-breadcrumb-link">
                    Workspaces
                  </Link>
                  <span className="wb-breadcrumb-separator">/</span>
                  <span className="wb-breadcrumb-current">{activeWorkspace.name}</span>
                </div>
              ) : (
                <h2 className="wb-saved-heading">My APIs</h2>
              )}
            </div>
            <p className="wb-saved-subheading">
              {activeWorkspace
                ? activeWorkspace.description
                : 'Manage and test saved API endpoints.'}
            </p>
          </div>
        </div>

        <div className="wb-saved-topbar-actions">
          <div className="wb-saved-search-wrap">
            <span className="wb-saved-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={activeWorkspace ? `Search in ${activeWorkspace.name}...` : 'Search workspaces & APIs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="wb-saved-search-input"
            />
          </div>

          {!activeWorkspace && (
            <button
              type="button"
              className="wb-btn-top-secondary"
              onClick={() => setIsNewWorkspaceModalOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Workspace</span>
            </button>
          )}

          <button
            type="button"
            className="wb-btn-top-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{activeWorkspace ? 'Add Endpoint' : 'Add API'}</span>
          </button>
        </div>
      </header>

      <div className="wb-saved-content-viewport">
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              maxWidth: '1040px',
              margin: '0 auto 1.25rem auto',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <span>Loading workspaces & APIs...</span>
          </div>
        ) : !activeWorkspace && viewMode === 'workspaces' ? (
          <div className="wb-workspaces-dashboard">
            <div className="wb-workspaces-view-header">
              <div className="wb-view-tabs">
                <button
                  type="button"
                  className="wb-view-tab active"
                  onClick={() => setViewMode('workspaces')}
                >
                  Workspaces ({workspaces.length})
                </button>
                <button
                  type="button"
                  className="wb-view-tab"
                  onClick={() => setViewMode('all')}
                >
                  All Endpoints ({apis.length})
                </button>
              </div>
            </div>

            {workspaces.length === 0 ? (
              <div className="wb-saved-empty-card">
                <div className="wb-saved-empty-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="wb-saved-empty-title">No Workspaces Yet</h3>
                <p className="wb-saved-empty-desc">
                  Create workspaces to organize, group, and manage your API endpoints into dedicated project collections.
                </p>
                <button
                  type="button"
                  className="wb-btn-top-primary"
                  onClick={() => setIsNewWorkspaceModalOpen(true)}
                >
                  + Create First Workspace
                </button>
              </div>
            ) : (
              <div className="wb-workspaces-grid">
                {workspaces
                  .filter((ws) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return ws.name.toLowerCase().includes(q) || ws.description.toLowerCase().includes(q);
                  })
                  .map((ws) => {
                    const wsApis = getWorkspaceApis(ws.name);
                    const count = wsApis.length;
                    const updatedText = wsApis.length > 0 ? `Updated ${formatRelativeTime(wsApis[0].created_at)}` : 'No endpoints yet';

                    return (
                      <Link
                        key={ws.id}
                        to={`${basePrefix}/workspace/${slugify(ws.name)}`}
                        className="wb-workspace-card"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
                      >
                        <div className="wb-workspace-card-top">
                          <div className="wb-workspace-icon-squircle">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>

                          <button
                            type="button"
                            className="wb-btn-action-icon danger"
                            onClick={(e) => handleDeleteWorkspace(e, ws)}
                            title="Delete Workspace"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>

                        <h3 className="wb-workspace-card-title">{ws.name}</h3>
                        <p className="wb-workspace-card-desc">{ws.description}</p>

                        <div className="wb-workspace-card-footer">
                          <span className="wb-workspace-card-count">{count} {count === 1 ? 'Endpoint' : 'Endpoints'}</span>
                          <span className="wb-workspace-card-updated">{updatedText}</span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          <div className="wb-saved-cards-container">
            {activeWorkspace && (
              <div className="wb-workspace-detail-banner">
                <div className="wb-workspace-banner-left">
                  <div className="wb-workspace-icon-squircle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="wb-workspace-banner-title">{activeWorkspace.name}</h3>
                    <p className="wb-workspace-banner-desc">{activeWorkspace.description}</p>
                  </div>
                </div>

                <div className="wb-workspace-banner-actions">
                  <button
                    type="button"
                    className="wb-btn-top-secondary"
                    onClick={(e) => handleDeleteWorkspace(e, activeWorkspace)}
                    title={`Delete "${activeWorkspace.name}" workspace and all its endpoints`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete Workspace</span>
                  </button>

                  <button
                    type="button"
                    className="wb-btn-top-primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Endpoint</span>
                  </button>
                </div>
              </div>
            )}

            {!activeWorkspace && viewMode === 'all' && (
              <div className="wb-workspaces-view-header" style={{ marginBottom: '1.25rem' }}>
                <div className="wb-view-tabs">
                  <button
                    type="button"
                    className="wb-view-tab"
                    onClick={() => setViewMode('workspaces')}
                  >
                    Workspaces ({workspaces.length})
                  </button>
                  <button
                    type="button"
                    className="wb-view-tab active"
                    onClick={() => setViewMode('all')}
                  >
                    All Endpoints ({apis.length})
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const currentList = activeWorkspace
                ? getWorkspaceApis(activeWorkspace.name).filter((item) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase().trim();
                  return item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
                })
                : filteredApis;

              if (currentList.length === 0) {
                if (activeWorkspace) {
                  return searchQuery ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                      No endpoints matching "{searchQuery}" in {activeWorkspace.name}.
                    </div>
                  ) : null;
                }

                return (
                  <div className="wb-saved-empty-card">
                    <div className="wb-saved-empty-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <h3 className="wb-saved-empty-title">
                      {searchQuery ? 'No Matching Endpoints' : 'No Saved APIs Yet'}
                    </h3>
                    <p className="wb-saved-empty-desc">
                      {searchQuery
                        ? `No APIs match "${searchQuery}".`
                        : 'Save your endpoints to organize, test, and share them in one click.'}
                    </p>
                    <button
                      type="button"
                      className="wb-btn-top-primary"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add First Endpoint</span>
                    </button>
                  </div>
                );
              }

              return currentList.map((item) => {
                const method = detectMethod(item.name, item.url);

                return (
                  <div
                    key={item.id}
                    className="wb-saved-card"
                    onClick={() => onOpenInTester(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="wb-saved-card-left">
                      <div className="wb-saved-icon-squircle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      </div>

                      <div className="wb-saved-card-meta">
                        <div className="wb-saved-card-title-row">
                          <h4 className="wb-saved-card-title">{item.name}</h4>
                          {item.category && item.category !== 'General' && (
                            <span className="wb-saved-workspace-badge">{item.category}</span>
                          )}
                        </div>

                        <div className="wb-saved-url-row">
                          <span className={`wb-method-badge ${method.toLowerCase()}`}>{method}</span>
                          <span className="wb-saved-url-text" title={item.url}>
                            {item.url}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="wb-saved-card-right">
                      <div className="wb-saved-meta-col">
                        <span className="wb-saved-meta-lbl">Updated</span>
                        <span className="wb-saved-meta-time">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <div className="wb-saved-card-actions">
                        <button
                          type="button"
                          className="wb-btn-action-test"
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
                          className="wb-btn-action-icon"
                          onClick={(e) => handleCopyUrl(e, item)}
                          title="Copy endpoint URL"
                        >
                          {copiedUrlId === item.id ? (
                            <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>✓</span>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>

                        <button
                          type="button"
                          className="wb-btn-action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingApi(item);
                          }}
                          title="Edit API"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="wb-btn-action-icon danger"
                          onClick={(e) => handleDelete(e, item)}
                          disabled={deletingId === item.id}
                          title="Delete API"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      <NewWorkspaceModal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
        onCreated={handleWorkspaceCreated}
        existingNames={workspaces.map((w) => w.name)}
      />

      <AddApiModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleApiCreated}
        workspaces={workspaces}
        defaultCategory={activeWorkspace ? activeWorkspace.name : undefined}
      />

      <EditApiModal
        isOpen={Boolean(editingApi)}
        onClose={() => setEditingApi(null)}
        apiItem={editingApi}
        onUpdated={handleApiUpdated}
        workspaces={workspaces}
      />
    </div>
  );
};
