import React, { useState, useEffect, useCallback } from 'react';
import './mock.css';
import { api } from '../../services/api';
import type { MockEndpoint, MockEndpointCreate, MockEndpointUpdate } from '../../types/mock';
import { MockCard } from './MockCard';
import { MockEditorPane } from './MockEditorPane';
import { useToast } from '../../context/ToastContext';

interface MockManagerProps {
  onTestInWorkbench: (mock: MockEndpoint) => void;
}

export const MockManager: React.FC<MockManagerProps> = ({ onTestInWorkbench }) => {
  const toast = useToast();
  const [mocks, setMocks] = useState<MockEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected / Editing Mock state
  const [selectedMock, setSelectedMock] = useState<MockEndpoint | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(true);

  const fetchMocks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMocks();
      setMocks(data);
      if (data.length > 0 && !selectedMock) {
        setSelectedMock(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load mock endpoints.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMock]);

  useEffect(() => {
    fetchMocks();
  }, [fetchMocks]);

  const handleOpenCreate = () => {
    setSelectedMock(null);
    setIsEditorOpen(true);
  };

  const handleSelectMock = (mock: MockEndpoint) => {
    setSelectedMock(mock);
    setIsEditorOpen(true);
  };

  const handleSaveMock = async (
    data: MockEndpointCreate | MockEndpointUpdate,
    isEdit: boolean,
    id?: string
  ) => {
    try {
      if (isEdit && id) {
        const updated = await api.updateMock(id, data as MockEndpointUpdate);
        setSelectedMock(updated);
        toast.success('Mock endpoint updated successfully!');
      } else {
        const created = await api.createMock(data as MockEndpointCreate);
        setSelectedMock(created);
        toast.success('Mock endpoint created successfully!');
      }
      await fetchMocks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save mock endpoint.');
      throw err;
    }
  };

  const handleDeleteMock = async (id: string) => {
    try {
      await api.deleteMock(id);
      setMocks((prev) => prev.filter((m) => m.id !== id));
      if (selectedMock?.id === id) {
        setSelectedMock(null);
        setIsEditorOpen(false);
      }
      toast.success('Mock endpoint deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete mock endpoint.');
    }
  };

  // Filtered Mocks
  const filteredMocks = mocks.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.path.toLowerCase().includes(q) ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      m.method.toLowerCase().includes(q) ||
      m.statusCode.toString().includes(q)
    );
  });

  return (
    <div className="wb-mock-engine-root">
      {/* Top Header matching Figma: Title + Subtitle + [+ Create Mock] */}
      <header className="wb-mock-topbar">
        <div className="wb-mock-title-block">
          <h2 className="wb-mock-heading">Mock API Engine</h2>
          <p className="wb-mock-subheading">Manage and deploy simulated endpoints.</p>
        </div>

        <div className="wb-mock-topbar-actions">
          <button
            type="button"
            className="wb-btn-create-mock-primary"
            onClick={handleOpenCreate}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Mock</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Scrollable 2-Column Grid) */}
      <div className="wb-mock-workspace-scrollable">
        <div className={`wb-mock-workspace-grid ${!isEditorOpen ? 'full-width' : ''}`}>
          {/* Left Column: Mock Endpoints List */}
          <div className="wb-mock-list-column">
            {/* Search Bar */}
            <div className="wb-mock-search-bar">
              <span className="wb-mock-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="wb-mock-search-input"
              />
              <button
                type="button"
                className="wb-mock-filter-btn"
                title="Filter mocks"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="10" y1="18" x2="14" y2="18" />
                </svg>
              </button>
            </div>

            {/* Cards List */}
            {isLoading ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <span>Loading mock endpoints...</span>
              </div>
            ) : error ? (
              <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#dc2626' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
                <button
                  type="button"
                  style={{ marginTop: '0.5rem', background: '#dc2626', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={fetchMocks}
                >
                  Retry
                </button>
              </div>
            ) : filteredMocks.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                  {searchQuery ? 'No matching mocks found' : 'No mock endpoints yet'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                  {searchQuery ? 'Try clearing search terms.' : 'Create simulated API endpoints with custom response bodies.'}
                </p>
                <button
                  type="button"
                  className="wb-btn-create-mock-primary"
                  style={{ margin: '0 auto' }}
                  onClick={handleOpenCreate}
                >
                  + Create First Mock
                </button>
              </div>
            ) : (
              filteredMocks.map((mock) => (
                <MockCard
                  key={mock.id}
                  mock={mock}
                  isSelected={isEditorOpen && selectedMock?.id === mock.id}
                  onSelect={handleSelectMock}
                  onEdit={handleSelectMock}
                  onDelete={handleDeleteMock}
                  onTestInWorkbench={onTestInWorkbench}
                />
              ))
            )}
          </div>

          {/* Right Column: Edit / Create Mock Form */}
          {isEditorOpen && (
            <MockEditorPane
              isOpen={isEditorOpen}
              onClose={() => setIsEditorOpen(false)}
              onSave={handleSaveMock}
              initialMock={selectedMock}
            />
          )}
        </div>
      </div>
    </div>
  );
};
