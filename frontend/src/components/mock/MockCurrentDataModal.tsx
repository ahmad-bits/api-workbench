import React, { useState, useMemo } from 'react';
import type { MockEndpoint } from '../../types/mock';
import { useToast } from '../../context/ToastContext';

interface MockCurrentDataModalProps {
  mock: MockEndpoint | null;
  isOpen: boolean;
  onClose: () => void;
  onMockUpdated?: (updated: MockEndpoint) => void;
}

export const MockCurrentDataModal: React.FC<MockCurrentDataModalProps> = ({
  mock,
  isOpen,
  onClose,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const rawData = useMemo(() => {
    if (!mock) return '';
    if (mock.currentResourceData !== undefined && mock.currentResourceData !== null) {
      return mock.currentResourceData;
    }
    return mock.initialResourceData || '';
  }, [mock]);

  const isEmpty = useMemo(() => {
    return !rawData || !rawData.trim();
  }, [rawData]);

  const currentDataStr = useMemo(() => {
    if (isEmpty) return '';
    try {
      const parsed = JSON.parse(rawData);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawData;
    }
  }, [rawData, isEmpty]);

  if (!isOpen || !mock) return null;

  const handleCopy = () => {
    if (isEmpty) return;
    navigator.clipboard.writeText(currentDataStr);
    setCopied(true);
    toast.info('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="wb-curdata-overlay" onClick={onClose}>
      <div
        className="wb-curdata-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="wb-curdata-header">
          <div className="wb-curdata-title-group">
            <span className={`wb-mock-method-badge ${mock.method.toLowerCase()}`}>
              {mock.method}
            </span>
            <h3 className="wb-curdata-title">Current Data</h3>
            <span className="wb-curdata-path-badge">{mock.path}</span>
          </div>

          <div className="wb-curdata-actions">
            {!isEmpty && (
              <button
                type="button"
                className="wb-simple-copy-btn"
                onClick={handleCopy}
                title="Copy JSON"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}

            {/* Single Close Button */}
            <button
              type="button"
              className="wb-curdata-btn-close"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content: Formatted JSON or Clean Light Empty State */}
        <div className="wb-curdata-body-simple">
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.25rem', color: '#64748b' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.85rem',
                  color: '#64748b',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
                Resource Deleted
              </p>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                The resource data has been deleted. You can edit this endpoint to add new data anytime.
              </p>
            </div>
          ) : (
            <pre className="wb-history-light-data-box">
              <code>{currentDataStr}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
