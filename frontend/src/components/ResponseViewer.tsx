import React, { useState } from 'react';
import type { WorkbenchResponse } from '../types/workbench';

interface ResponseViewerProps {
  response: WorkbenchResponse | null;
  isLoading: boolean;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);
  const [headerFilter, setHeaderFilter] = useState('');

  const handleCopy = () => {
    if (!response) return;
    const content =
      typeof response.data === 'object'
        ? JSON.stringify(response.data, null, 2)
        : String(response.data || '');

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusClass = (code: number) => {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const headersList = response
    ? Object.entries(response.headers).filter(([key, val]) => {
        if (!headerFilter) return true;
        return (
          key.toLowerCase().includes(headerFilter.toLowerCase()) ||
          String(val).toLowerCase().includes(headerFilter.toLowerCase())
        );
      })
    : [];

  return (
    <div className="response-viewer glass-card">
      {/* Header Bar */}
      <div className="response-header">
        <div className="response-title-group">
          <span className="response-heading">Response</span>
          {response && !isLoading && (
            <div className="response-meta-tags">
              <span className={`status-tag ${getStatusClass(response.statusCode)}`}>
                {response.statusCode} {response.statusText}
              </span>
              <span className="meta-tag">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {response.elapsedMs} ms
              </span>
              <span className="meta-tag">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {formatSize(response.sizeBytes)}
              </span>
            </div>
          )}
        </div>

        {response && !isLoading && (
          <div className="response-tabs-controls">
            <div className="tab-buttons">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveTab('body')}
              >
                Body {response.isJson && <span className="pill-subtle">JSON</span>}
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveTab('headers')}
              >
                Headers ({Object.keys(response.headers).length})
              </button>
            </div>

            {activeTab === 'body' && (
              <button type="button" className="btn-copy" onClick={handleCopy} title="Copy response to clipboard">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Response Content Area */}
      {isLoading ? (
        <div className="response-loading-state">
          <div className="spinner"></div>
          <span>Dispatching request through FastAPI proxy...</span>
        </div>
      ) : !response ? (
        <div className="response-empty-state">
          <div className="empty-icon">⚡</div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            No Response Yet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enter a URL above and click <strong>Send</strong> or select a quick preset to execute a request.
          </p>
        </div>
      ) : response.error ? (
        <div className="response-error-panel">
          <div className="error-badge">Dispatch Failed</div>
          <p className="error-detail">{response.error}</p>
        </div>
      ) : (
        <div className="response-body-area">
          {activeTab === 'body' && (
            <div className="code-viewer-container">
              <pre className="code-content">
                {typeof response.data === 'object'
                  ? JSON.stringify(response.data, null, 2)
                  : String(response.data || '')}
              </pre>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="headers-table-wrapper">
              <div className="headers-search-bar">
                <input
                  type="text"
                  placeholder="Filter response headers..."
                  value={headerFilter}
                  onChange={(e) => setHeaderFilter(e.target.value)}
                  className="kv-input"
                  style={{ maxWidth: '300px' }}
                />
                <span className="headers-count-badge">
                  {headersList.length} header{headersList.length !== 1 ? 's' : ''}
                </span>
              </div>

              <table className="kv-table headers-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Header Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {headersList.map(([key, val]) => (
                    <tr key={key}>
                      <td className="header-key-cell">{key}</td>
                      <td className="header-val-cell">{String(val)}</td>
                    </tr>
                  ))}
                  {headersList.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No headers matching search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
