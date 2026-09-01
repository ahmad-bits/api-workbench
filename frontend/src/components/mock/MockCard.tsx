import React, { useState } from 'react';
import type { MockEndpoint } from '../../types/mock';
import { useConfirm } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

interface MockCardProps {
  mock: MockEndpoint;
  isSelected?: boolean;
  onSelect: (mock: MockEndpoint) => void;
  onEdit: (mock: MockEndpoint) => void;
  onDelete: (id: string) => void;
  onTestInWorkbench: (mock: MockEndpoint) => void;
}

export const MockCard: React.FC<MockCardProps> = ({
  mock,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onTestInWorkbench,
}) => {
  const confirm = useConfirm();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fullUrl = mock.fullUrl || `http://127.0.0.1:8000${mock.mockUrl}`;

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.info('Simulated Mock URL copied to clipboard.');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    const confirmed = await confirm({
      title: 'Delete Mock Endpoint',
      message: `Are you sure you want to delete mock endpoint '${mock.method} ${mock.path}'?`,
      details: 'This will permanently remove the simulated route. Any test clients relying on it will receive 404 Not Found.',
      confirmText: 'Delete Mock',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDelete(mock.id);
    }
  };

  const getStatusPillClass = (code: number) => {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  };

  const getStatusLabel = (code: number) => {
    if (code === 200) return '200 OK';
    if (code === 201) return '201 Created';
    if (code === 204) return '204 No Content';
    if (code === 400) return '400 Bad Req';
    if (code === 401) return '401 Unauth';
    if (code === 404) return '404 Not Found';
    if (code === 500) return '500 Error';
    return `${code}`;
  };

  return (
    <div
      className={`wb-mock-card-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(mock)}
    >
      {/* Top Row: Title + Status Pill + Menu */}
      <div className="wb-mock-card-top">
        <h4 className="wb-mock-card-name">{mock.name || `${mock.method} ${mock.path}`}</h4>

        <div className="wb-mock-card-top-right">
          <span className={`wb-mock-status-pill ${getStatusPillClass(mock.statusCode)}`}>
            {getStatusLabel(mock.statusCode)}
          </span>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="wb-mock-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              title="Options"
            >
              ⋮
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.1)',
                  zIndex: 20,
                  minWidth: '150px',
                  padding: '0.35rem 0',
                }}
              >
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.85rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8rem',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(mock);
                  }}
                >
                  <span>✏️</span>
                  <span>Edit Mock</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.85rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8rem',
                    color: '#1860ec',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onTestInWorkbench(mock);
                  }}
                >
                  <span>⚡</span>
                  <span>Test in Tester</span>
                </button>

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.25rem 0' }} />

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.85rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                  onClick={handleDelete}
                >
                  <span>🗑️</span>
                  <span>Delete Mock</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Method + Path Row */}
      <div className="wb-mock-route-row">
        <span className={`wb-mock-method-badge ${mock.method.toLowerCase()}`}>
          {mock.method}
        </span>
        <span className="wb-mock-route-path">{mock.path}</span>
      </div>

      {/* URL Box Row */}
      <div className="wb-mock-url-box">
        <span className="wb-mock-url-text" title={fullUrl}>
          {fullUrl}
        </span>
        <button
          type="button"
          className={`wb-mock-btn-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopyUrl}
          title="Copy simulated URL"
        >
          {copied ? (
            <span>✓ Copied</span>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Action Strip */}
      <div className="wb-mock-card-actions-bar">
        <button
          type="button"
          className="wb-mock-btn-test"
          onClick={(e) => {
            e.stopPropagation();
            onTestInWorkbench(mock);
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Test in API Tester</span>
        </button>

        <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
          {mock.callCount || 0} calls
        </span>
      </div>
    </div>
  );
};
