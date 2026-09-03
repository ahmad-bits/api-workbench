import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { MockEndpoint, MockRequestHistoryItem } from '../../types/mock';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ModalContext';
import { NavToggle } from '../common/NavToggle';

export const MockHistoryPage: React.FC = () => {
  const { mockId: paramMockId } = useParams<{ mockId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  // Retrieve mock from location.state or sessionStorage
  const [mock, setMock] = useState<MockEndpoint | null>(() => {
    const stateMock = (location.state as { mock?: MockEndpoint })?.mock;
    if (stateMock) return stateMock;
    try {
      const stored = sessionStorage.getItem('active_history_mock');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [history, setHistory] = useState<MockRequestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const effectiveMockId = mock?.id || paramMockId;

  const fetchData = useCallback(async () => {
    if (!effectiveMockId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [mockData, historyData] = await Promise.all([
        api.getMock(effectiveMockId).catch(() => null),
        api.getMockHistory(effectiveMockId),
      ]);
      if (mockData) {
        setMock(mockData);
        try {
          sessionStorage.setItem('active_history_mock', JSON.stringify(mockData));
        } catch {
          // ignore
        }
      }
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Failed to load request history.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveMockId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearHistory = async () => {
    if (!effectiveMockId) return;
    const confirmed = await confirm({
      title: 'Clear Request History',
      message: `Are you sure you want to clear all recorded requests for "${mock?.path || 'this endpoint'}"?`,
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await api.clearMockHistory(effectiveMockId);
        setHistory([]);
        toast.success('Request history cleared.');
      } catch (err: any) {
        toast.error(err.message || 'Failed to clear history.');
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info('Copied received data to clipboard.');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatReceivedData = (rawBody: string): string => {
    if (!rawBody || !rawBody.trim()) return '(empty)';
    try {
      const parsed = JSON.parse(rawBody);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawBody;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const trimmed = timeStr.trim();
    // If already in clean format e.g. "Sep 3, 2026, 8:51 PM", display directly
    if (/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}\s+(AM|PM)$/i.test(trimmed)) {
      return trimmed;
    }
    try {
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) return trimmed;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return trimmed;
    }
  };

  return (
    <div className="wb-mock-engine-root">
      {/* Consistent Workbench Topbar */}
      <header className="wb-mock-topbar">
        <div className="wb-mock-left-wrap">
          <NavToggle />
          <div className="wb-mock-title-block">
            <h2 className="wb-mock-heading">Request History</h2>
            <p className="wb-mock-subheading">
              {mock ? `${mock.method} ${mock.path}` : 'Captured requests for endpoint'}
            </p>
          </div>
        </div>

        <div className="wb-mock-topbar-actions">
          {effectiveMockId && (
            <button
              type="button"
              className="wb-simple-history-btn-refresh"
              onClick={fetchData}
              disabled={isLoading}
              title="Refresh history"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
            </button>
          )}

          {effectiveMockId && history.length > 0 && (
            <button
              type="button"
              className="wb-simple-history-btn-clear"
              onClick={handleClearHistory}
              disabled={isLoading}
              title="Clear all request history"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="wb-history-page-scrollable">
        <div className="wb-history-page-card">
          {!effectiveMockId ? (
            <div className="wb-simple-history-empty">
              <p className="wb-simple-empty-title">No Endpoint Selected</p>
              <p className="wb-simple-empty-desc">
                Please visit <button type="button" onClick={() => navigate('/mocks')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Mock APIs</button> and click <strong>History</strong> on a POST, PUT, or PATCH endpoint.
              </p>
            </div>
          ) : isLoading && history.length === 0 ? (
            <div className="wb-simple-history-loading">
              <div className="wb-history-spinner"></div>
              <span>Loading request history...</span>
            </div>
          ) : error ? (
            <div className="wb-simple-history-error">
              <p>{error}</p>
              <button type="button" onClick={fetchData} className="wb-history-btn-retry">
                Retry
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="wb-simple-history-empty">
              <p className="wb-simple-empty-title">No requests received yet</p>
              <p className="wb-simple-empty-desc">
                When a client sends a {mock?.method || 'POST'} request to <code>{mock?.path || 'this endpoint'}</code>, the received data and timestamp will be shown here.
              </p>
            </div>
          ) : (
            <div className="wb-history-page-list">
              <div className="wb-history-page-list-header">
                <span className="wb-history-page-count">
                  {history.length} {history.length === 1 ? 'request' : 'requests'} captured
                </span>
              </div>

              {history.map((item, index) => {
                const formattedData = formatReceivedData(item.body);
                const formattedTimeString = formatTime(item.createdAt);

                return (
                  <div key={item.id} className="wb-simple-history-item-block">
                    {index > 0 && <div className="wb-simple-history-divider" />}

                    <div className="wb-simple-history-entry">
                      {/* Received Section */}
                      <div className="wb-simple-entry-section">
                        <div className="wb-simple-entry-label-row">
                          <span className="wb-simple-entry-label">Received:</span>
                          <button
                            type="button"
                            className="wb-simple-copy-btn"
                            onClick={() => handleCopy(formattedData, item.id)}
                            title="Copy received data"
                          >
                            {copiedId === item.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="wb-history-light-data-box">
                          <code>{formattedData}</code>
                        </pre>
                      </div>

                      {/* Time Section */}
                      <div className="wb-simple-entry-section">
                        <span className="wb-simple-entry-label">Time:</span>
                        <div className="wb-simple-entry-time">{formattedTimeString}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
