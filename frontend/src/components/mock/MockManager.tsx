import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { MockEndpoint, MockEndpointCreate, MockEndpointUpdate } from '../../types/mock';
import { MockCard } from './MockCard';
import { MockModal } from './MockModal';


interface MockManagerProps {
  onTestInWorkbench: (mock: MockEndpoint) => void;
}

export const MockManager: React.FC<MockManagerProps> = ({ onTestInWorkbench }) => {
  const [mocks, setMocks] = useState<MockEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMock, setEditingMock] = useState<MockEndpoint | null>(null);

  const fetchMocks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMocks();
      setMocks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mock endpoints.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMocks();
  }, [fetchMocks]);

  const handleOpenCreate = () => {
    setEditingMock(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mock: MockEndpoint) => {
    setEditingMock(mock);
    setIsModalOpen(true);
  };

  const handleSaveMock = async (
    data: MockEndpointCreate | MockEndpointUpdate,
    isEdit: boolean,
    id?: string
  ) => {
    if (isEdit && id) {
      await api.updateMock(id, data as MockEndpointUpdate);
    } else {
      await api.createMock(data as MockEndpointCreate);
    }
    await fetchMocks();
  };

  const handleDeleteMock = async (id: string) => {
    try {
      await api.deleteMock(id);
      setMocks((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete mock endpoint.');
    }
  };

  // Filtered Mocks
  const filteredMocks = mocks.filter((m) => {
    const matchesMethod = methodFilter === 'ALL' || m.method.toUpperCase() === methodFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.statusCode.toString().includes(searchQuery.trim());
    return matchesMethod && matchesSearch;
  });

  const totalCalls = mocks.reduce((sum, m) => sum + (m.callCount || 0), 0);

  return (
    <div className="mock-manager-container">
      {/* Mock Header Hero */}
      <div className="mock-hero-banner glass-card">
        <div className="mock-hero-content">
          <div className="mock-hero-icon">🎭</div>
          <div>
            <h2 className="mock-hero-title">Mock API Server</h2>
            <p className="mock-hero-subtitle">
              Create instant, realistic fake REST endpoints with custom status codes and JSON payloads for rapid frontend integration
            </p>
          </div>
        </div>

        <div className="mock-hero-actions">
          <button
            type="button"
            className="btn-create-mock"
            onClick={handleOpenCreate}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>+</span>
            <span>Create Mock Endpoint</span>
          </button>
        </div>
      </div>

      {/* Stats and Filter Toolbar */}
      <div className="mock-toolbar glass-card">
        <div className="toolbar-search-wrapper">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search mocks by path, status, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mock-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="method-filter-group">
          {['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
            <button
              key={m}
              type="button"
              className={`method-filter-pill ${methodFilter === m ? 'active' : ''}`}
              onClick={() => setMethodFilter(m)}
            >
              {m}
              {m === 'ALL' ? (
                <span className="filter-count">{mocks.length}</span>
              ) : (
                <span className="filter-count">
                  {mocks.filter((x) => x.method === m).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mock-stats-pills">
          <div className="mock-stat-badge">
            <strong>{mocks.length}</strong> Endpoints
          </div>
          <div className="mock-stat-badge highlight">
            <strong>⚡ {totalCalls}</strong> Total Hits
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="response-loading-state" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <span>Loading mock endpoints from server...</span>
        </div>
      ) : error ? (
        <div className="response-error-panel">
          <div className="error-badge">Error Loading Mocks</div>
          <p className="error-detail">{error}</p>
          <button
            type="button"
            className="btn-secondary-sm"
            style={{ marginTop: '0.75rem' }}
            onClick={fetchMocks}
          >
            Retry
          </button>
        </div>
      ) : filteredMocks.length === 0 ? (
        <div className="empty-mocks-card glass-card">
          <div className="empty-mocks-icon">🎯</div>
          <h3>
            {searchQuery || methodFilter !== 'ALL'
              ? 'No Mock Endpoints Match Filter'
              : 'No Mock Endpoints Created Yet'}
          </h3>
          <p>
            {searchQuery || methodFilter !== 'ALL'
              ? 'Try resetting the search query or selecting another HTTP method filter.'
              : 'Create fake endpoints with custom JSON responses to simulate real backend APIs during development and testing.'}
          </p>
          {searchQuery || methodFilter !== 'ALL' ? (
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={() => {
                setSearchQuery('');
                setMethodFilter('ALL');
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenCreate}
            >
              + Create Your First Mock
            </button>
          )}
        </div>
      ) : (
        <div className="mock-cards-grid">
          {filteredMocks.map((mock) => (
            <MockCard
              key={mock.id}
              mock={mock}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteMock}
              onTestInWorkbench={onTestInWorkbench}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <MockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMock}
        initialMock={editingMock}
      />
    </div>
  );
};
