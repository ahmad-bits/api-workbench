import React, { useState } from 'react';
import type { MockEndpoint } from '../../types/mock';

interface MockCardProps {
  mock: MockEndpoint;
  onEdit: (mock: MockEndpoint) => void;
  onDelete: (id: string) => void;
  onTestInWorkbench: (mock: MockEndpoint) => void;
}

export const MockCard: React.FC<MockCardProps> = ({
  mock,
  onEdit,
  onDelete,
  onTestInWorkbench,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fullUrl = mock.fullUrl || `http://127.0.0.1:8000${mock.mockUrl}`;

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete mock endpoint '${mock.method} ${mock.path}'?`)) {
      setIsDeleting(true);
      try {
        await onDelete(mock.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusClass = (code: number) => {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  };

  const getMethodClass = (method: string) => {
    return `method-tag method-${method.toLowerCase()}`;
  };

  return (
    <div className="mock-card glass-card">
      {/* Top Header */}
      <div className="mock-card-header">
        <div className="mock-card-title-group">
          <span className={getMethodClass(mock.method)}>{mock.method}</span>
          <span className="mock-path" title={mock.path}>
            {mock.path}
          </span>
          <span className={`status-tag ${getStatusClass(mock.statusCode)}`}>
            {mock.statusCode}
          </span>
        </div>

        <div className="mock-card-meta">
          <span className="mock-hit-badge" title="Total times this mock endpoint was called">
            ⚡ {mock.callCount} hit{mock.callCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Name / Description */}
      {mock.name && mock.name !== `${mock.method} ${mock.path}` && (
        <div className="mock-name-label">{mock.name}</div>
      )}
      {mock.description && (
        <div className="mock-desc-label">{mock.description}</div>
      )}

      {/* Generated Mock URL Bar */}
      <div className="mock-url-box">
        <span className="mock-url-prefix">Mock URL:</span>
        <code className="mock-url-text" title={fullUrl}>
          {fullUrl}
        </code>
        <button
          type="button"
          className={`btn-copy-url ${copied ? 'copied' : ''}`}
          onClick={handleCopyUrl}
          title="Copy Mock URL to clipboard"
        >
          {copied ? (
            <>
              <span className="copy-check">✓</span>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy URL</span>
            </>
          )}
        </button>
      </div>

      {/* Card Actions Bar */}
      <div className="mock-card-actions">
        <div className="left-actions">
          <button
            type="button"
            className="btn-test-workbench"
            onClick={() => onTestInWorkbench(mock)}
            title="Load in Workbench and execute request"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Test in Workbench
          </button>

          <button
            type="button"
            className="btn-preview-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Hide Response' : '▼ Preview Response'}
          </button>
        </div>

        <div className="right-actions">
          <button
            type="button"
            className="btn-action-icon edit"
            onClick={() => onEdit(mock)}
            title="Edit mock endpoint"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>

          <button
            type="button"
            className="btn-action-icon delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete mock endpoint"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Expandable Preview Area */}
      {expanded && (
        <div className="mock-preview-drawer">
          <div className="preview-section-title">Configured Response Body:</div>
          <div className="code-viewer-container preview-code-container">
            <pre className="code-content">{mock.responseBody || '(Empty body)'}</pre>
          </div>

          {Object.keys(mock.responseHeaders || {}).length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div className="preview-section-title">Response Headers:</div>
              <div className="headers-preview-pills">
                {Object.entries(mock.responseHeaders).map(([k, v]) => (
                  <span key={k} className="header-preview-pill">
                    <strong>{k}:</strong> {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
