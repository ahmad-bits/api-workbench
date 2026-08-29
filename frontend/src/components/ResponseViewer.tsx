import React, { useState } from 'react';
import type { WorkbenchResponse, BatchWorkbenchResponse } from '../types/workbench';
import { BenchmarkViewer } from './BenchmarkViewer';

interface ResponseViewerProps {
  response: WorkbenchResponse | null;
  batchResponse: BatchWorkbenchResponse | null;
  requestCount: number;
  isLoading: boolean;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  batchResponse,
  requestCount,
  isLoading,
}) => {
  // Tabs for single response mode
  const [singleActiveTab, setSingleActiveTab] = useState<'body' | 'headers'>('body');
  // Tabs for benchmark multi-response mode
  const [benchmarkTab, setBenchmarkTab] = useState<'stats' | 'body' | 'headers' | 'runs'>('stats');

  const [copied, setCopied] = useState(false);
  const [headerFilter, setHeaderFilter] = useState('');

  const isMultiRequest = requestCount > 1 && batchResponse !== null;

  const handleCopy = () => {
    const target = isMultiRequest ? batchResponse?.latestResponse : response;
    if (!target) return;
    const content =
      typeof target.data === 'object'
        ? JSON.stringify(target.data, null, 2)
        : String(target.data || '');

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
      {/* Top Header Bar */}
      <div className="response-header">
        <div className="response-title-group">
          <span className="response-heading">
            {isMultiRequest ? 'Benchmark Analysis' : 'Response'}
          </span>

          {/* Single Request Meta Tags */}
          {!isMultiRequest && response && !isLoading && (
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

          {/* Multi Request Meta Tags */}
          {isMultiRequest && batchResponse && !isLoading && (
            <div className="response-meta-tags">
              <span className="badge-tag multi-count-badge">
                {batchResponse.stats.totalRequests} Requests
              </span>
              <span className="meta-tag">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Avg {batchResponse.stats.avgLatencyMs} ms
              </span>
              <span className="meta-tag text-emerald">
                {batchResponse.stats.successRate}% Success
              </span>
            </div>
          )}
        </div>

        {/* Single Request Header Controls */}
        {!isMultiRequest && response && !isLoading && (
          <div className="response-tabs-controls">
            <div className="tab-buttons">
              <button
                type="button"
                className={`tab-btn ${singleActiveTab === 'body' ? 'active' : ''}`}
                onClick={() => setSingleActiveTab('body')}
              >
                Body {response.isJson && <span className="pill-subtle">JSON</span>}
              </button>
              <button
                type="button"
                className={`tab-btn ${singleActiveTab === 'headers' ? 'active' : ''}`}
                onClick={() => setSingleActiveTab('headers')}
              >
                Headers ({Object.keys(response.headers).length})
              </button>
            </div>

            {singleActiveTab === 'body' && (
              <button type="button" className="btn-copy" onClick={handleCopy} title="Copy response to clipboard">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="response-loading-state">
          <div className="spinner"></div>
          <span>
            {requestCount > 1
              ? `Executing benchmark across ${requestCount} parallel requests through FastAPI proxy...`
              : 'Dispatching request through FastAPI proxy...'}
          </span>
        </div>
      ) : !response && !batchResponse ? (
        /* Empty State */
        <div className="response-empty-state">
          <div className="empty-icon">⚡</div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            No Response Yet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enter a target URL, select request count (1–100), and click <strong>Send</strong> to execute.
          </p>
        </div>
      ) : isMultiRequest && batchResponse ? (
        /* Multi-Request Benchmark View */
        <BenchmarkViewer
          batchResponse={batchResponse}
          activeTab={benchmarkTab}
          onTabChange={setBenchmarkTab}
          headerFilter={headerFilter}
          onHeaderFilterChange={setHeaderFilter}
          onCopy={handleCopy}
          copied={copied}
        />
      ) : response?.error ? (
        /* Single Request Error */
        <div className="response-error-panel">
          <div className="error-badge">Dispatch Failed</div>
          <p className="error-detail">{response.error}</p>
        </div>
      ) : response ? (
        /* Single Request Normal Content Area */
        <div className="response-body-area">
          {singleActiveTab === 'body' && (
            <div className="code-viewer-container">
              <pre className="code-content">
                {typeof response.data === 'object'
                  ? JSON.stringify(response.data, null, 2)
                  : String(response.data || '')}
              </pre>
            </div>
          )}

          {singleActiveTab === 'headers' && (
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
      ) : null}
    </div>
  );
};
