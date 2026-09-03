import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './mock.css';
import { api } from '../../services/api';
import type { MockEndpoint, MockEndpointCreate, MockEndpointUpdate } from '../../types/mock';
import { MockCard } from './MockCard';
import { MockEditorPane } from './MockEditorPane';
import { NavToggle } from '../common/NavToggle';
import { useToast } from '../../context/ToastContext';

interface MockManagerProps {
  onTestInWorkbench: (mock: MockEndpoint) => void;
}

export const MockManager: React.FC<MockManagerProps> = ({ onTestInWorkbench }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [mocks, setMocks] = useState<MockEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedMock, setSelectedMock] = useState<MockEndpoint | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
    setSelectedMock(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedMock(null);
  };

  const handleSelectMock = (mock: MockEndpoint) => {
    setSelectedMock(mock);
    setIsEditorOpen(true);
  };

  const handleOpenHistory = (mock: MockEndpoint) => {
    try {
      sessionStorage.setItem('active_history_mock', JSON.stringify(mock));
    } catch {
      // ignore
    }
    navigate('/mocks/history', { state: { mock } });
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
        toast.success('Mock endpoint updated.');
      } else {
        const created = await api.createMock(data as MockEndpointCreate);
        setSelectedMock(created);
        toast.success('Mock endpoint created.');
      }
      setIsEditorOpen(false);
      setSelectedMock(null);
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
      toast.success('Mock endpoint deleted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete mock endpoint.');
    }
  };

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

  const showList = !isEditorOpen || mocks.length > 0;
  const isSingleColumn = !showList || !isEditorOpen;

  return (
    <div className="wb-mock-engine-root">
      <header className="wb-mock-topbar">
        <div className="wb-mock-left-wrap">
          <NavToggle />
          <div className="wb-mock-title-block">
            <h2 className="wb-mock-heading">Mock APIs</h2>
            <p className="wb-mock-subheading">Create and manage simulated API endpoints.</p>
          </div>
        </div>

        <div className="wb-mock-topbar-actions">
          {!isEditorOpen && (
            <button
              type="button"
              className="wb-btn-create-mock-primary"
              onClick={handleOpenCreate}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Endpoint</span>
            </button>
          )}
        </div>
      </header>

      <div className="wb-mock-workspace-scrollable">
        <div className={`wb-mock-workspace-grid ${isSingleColumn ? 'full-width' : ''}`}>
          {showList && (
            <div className="wb-mock-list-column">
              <div className="wb-mock-search-bar">
                <span className="wb-mock-search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search endpoints..."
                  className="wb-mock-search-input"
                />
              </div>

              {isLoading ? (
                <div className="wb-mock-loading-state">Loading endpoints...</div>
              ) : error ? (
                <div className="wb-mock-error-state">
                  <p>{error}</p>
                  <button type="button" className="wb-mock-error-retry" onClick={fetchMocks}>
                    Retry
                  </button>
                </div>
              ) : filteredMocks.length === 0 ? (
                <div className="wb-mock-empty-state">
                  <h4 className="wb-mock-empty-title">
                    {searchQuery ? 'No matching endpoints' : 'No endpoints yet'}
                  </h4>
                  <p className="wb-mock-empty-desc">
                    {searchQuery
                      ? 'Try different search terms.'
                      : 'Create your first mock API endpoint.'}
                  </p>
                  {!isEditorOpen && !searchQuery && (
                    <button
                      type="button"
                      className="wb-btn-create-mock-primary"
                      onClick={handleOpenCreate}
                    >
                      Create Endpoint
                    </button>
                  )}
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
                    onViewHistory={handleOpenHistory}
                  />
                ))
              )}
            </div>
          )}

          {isEditorOpen && (
            <MockEditorPane
              isOpen={isEditorOpen}
              onClose={handleCloseEditor}
              onSave={handleSaveMock}
              initialMock={selectedMock}
              existingMocks={mocks}
              onOpenHistory={handleOpenHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
};
