import React, { useState, useEffect, useCallback } from 'react';
import type { MockEndpoint, MockRequestHistoryItem } from '../../types/mock';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ModalContext';

interface MockRequestHistoryModalProps {
  mock: MockEndpoint;
  isOpen: boolean;
  onClose: () => void;
  onHistoryCleared?: () => void;
}

export const MockRequestHistoryModal: React.FC<MockRequestHistoryModalProps> = ({
  mock,
  isOpen,
  onClose,
  onHistoryCleared,
}) => {
  const toast = useToast();
  const confirm = useConfirm();

  const [history, setHistory] = useState<MockRequestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMockHistory(mock.id);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load request history.');
    } finally {
      setIsLoading(false);
    }
  }, [mock.id]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: 'Clear Request History',
      message: `Clear all recorded requests for "${mock.path}"?`,
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await api.clearMockHistory(mock.id);
        setHistory([]);
        toast.success('Request history cleared.');
        if (onHistoryCleared) onHistoryCleared();
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
    <div className="wb-history-overlay" onClick={onClose}>
      <div className="wb-simple-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="wb-simple-history-header">
          <div className="wb-simple-history-title-group">
            <h3 className="wb-simple-history-title">Request History</h3>
            <span className="wb-simple-history-subtitle">{mock.path}</span>
          </div>

          <div className="wb-simple-history-actions">
            <button
              type="button"
              className="wb-simple-history-btn-refresh"
              onClick={fetchHistory}
              disabled={isLoading}
              title="Refresh history"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className={isLoading ? 'spinning' : ''}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                className="wb-simple-history-btn-clear"
                onClick={handleClearHistory}
                title="Clear all entries"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              className="wb-simple-history-btn-close"
              onClick={onClose}
              title="Close"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="wb-simple-history-body">
          {isLoading && history.length === 0 ? (
            <div className="wb-simple-history-loading">
              <div className="wb-history-spinner"></div>
              <span>Loading history...</span>
            </div>
          ) : error ? (
            <div className="wb-simple-history-error">
              <p>{error}</p>
              <button type="button" onClick={fetchHistory} className="wb-history-btn-retry">
                Retry
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="wb-simple-history-empty">
              <p className="wb-simple-empty-title">No requests received yet</p>
              <p className="wb-simple-empty-desc">
                When a client sends a POST request to <code>{mock.path}</code>, the received data and timestamp will be shown here.
              </p>
            </div>
          ) : (
            <div className="wb-simple-history-list">
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
                        <pre className="wb-simple-entry-data">
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
