import React, { useState, useRef, useEffect } from 'react';
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
  const copyTimeoutRef = useRef<number | null>(null);

  const fullUrl = mock.fullUrl || `http://127.0.0.1:8000${mock.mockUrl}`;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.info('Mock URL copied to clipboard.');
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(mock);
  };

  const handleTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTestInWorkbench(mock);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Mock Endpoint',
      message: `Delete "${mock.method} ${mock.path}"?`,
      details: 'This will permanently remove the endpoint. Clients relying on it will receive 404.',
      confirmText: 'Delete',
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

  return (
    <div
      className={`wb-mock-card-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(mock)}
    >
      {/* Main Content */}
      <div className="wb-mock-card-main">
        {/* Route: Method + Path + Status + Meta Badges */}
        <div className="wb-mock-route-row">
          <span className={`wb-mock-method-badge ${mock.method.toLowerCase()}`}>
            {mock.method}
          </span>
          <span className="wb-mock-route-path">{mock.path}</span>
          <span className={`wb-mock-status-pill ${getStatusPillClass(mock.statusCode)}`}>
            {mock.statusCode}
          </span>
          {mock.authType === 'api_key' && (
            <span className="wb-mock-meta-badge wb-mock-auth-badge" title={`Requires Header "${mock.authHeaderName || 'X-API-Key'}"`}>
              API Key
            </span>
          )}
          {mock.authType === 'bearer' && (
            <span className="wb-mock-meta-badge wb-mock-auth-badge" title="Requires Bearer Token in Authorization Header">
              Bearer
            </span>
          )}
          {mock.delayMs !== undefined && mock.delayMs > 0 && (
            <span className="wb-mock-meta-badge wb-mock-delay-badge" title={`Response delay: ${mock.delayMs}ms`}>
              {mock.delayMs}ms
            </span>
          )}
        </div>

        {/* URL */}
        <div className="wb-mock-url-display" title={fullUrl}>
          {fullUrl}
        </div>
      </div>

      {/* Actions */}
      <div className="wb-mock-card-actions">
        <button type="button" className="wb-mock-action-btn action-edit" onClick={handleEdit} title="Edit endpoint">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Edit</span>
        </button>

        <button type="button" className="wb-mock-action-btn action-test" onClick={handleTest} title="Test in API Tester">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Test</span>
        </button>

        <button
          type="button"
          className={`wb-mock-action-btn action-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopyUrl}
          title="Copy URL"
        >
          {copied ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>

        <button type="button" className="wb-mock-action-btn action-delete" onClick={handleDelete} title="Delete endpoint">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Delete</span>
        </button>

        <span className="wb-mock-card-call-count">
          {mock.callCount || 0} calls
        </span>
      </div>
    </div>
  );
};
