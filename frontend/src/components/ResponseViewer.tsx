import React, { useState } from 'react';
import type { WorkbenchResponse, BatchWorkbenchResponse } from '../types/workbench';
import { BenchmarkViewer } from './BenchmarkViewer';
import { useToast } from '../context/ToastContext';

interface ResponseViewerProps {
  response: WorkbenchResponse | null;
  batchResponse: BatchWorkbenchResponse | null;
  requestCount: number;
  isLoading: boolean;
  onSaveClick?: () => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  batchResponse,
  requestCount,
  isLoading,
  onSaveClick,
}) => {
  const toast = useToast();
  const [singleActiveTab, setSingleActiveTab] = useState<'body' | 'headers'>('body');
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
    toast.info('Response data copied to clipboard.');
    setTimeout(() => setCopied(false), 1500);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return '#10b981';
    if (code >= 300 && code < 400) return '#3b82f6';
    if (code >= 400 && code < 500) return '#f59e0b';
    return '#ef4444';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
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
    <div className="wb-resp-pane">
      {/* Top Header & Status Bar */}
      <div className="wb-resp-statusbar">
        {!isMultiRequest && response && !isLoading ? (
          <div className="wb-resp-meta-items">
            <div className="wb-resp-meta-pill status" style={{ borderColor: getStatusColor(response.statusCode) }}>
              <span className="wb-meta-lbl">STATUS:</span>
              <span className="wb-meta-val" style={{ color: getStatusColor(response.statusCode) }}>
                {response.statusCode} {response.statusText}
              </span>
            </div>

            <div className="wb-resp-meta-pill">
              <span className="wb-meta-lbl">TIME:</span>
              <span className="wb-meta-val">{response.elapsedMs} ms</span>
            </div>

            <div className="wb-resp-meta-pill">
              <span className="wb-meta-lbl">SIZE:</span>
              <span className="wb-meta-val">{formatSize(response.sizeBytes)}</span>
            </div>
          </div>
        ) : isMultiRequest && batchResponse && !isLoading ? (
          <div className="wb-resp-meta-items">
            <div className="wb-resp-meta-pill">
              <span className="wb-meta-lbl">RUNS:</span>
              <span className="wb-meta-val">{batchResponse.stats.totalRequests}</span>
            </div>
            <div className="wb-resp-meta-pill">
              <span className="wb-meta-lbl">SUCCESS:</span>
              <span className="wb-meta-val" style={{ color: '#10b981' }}>{batchResponse.stats.successRate}%</span>
            </div>
            <div className="wb-resp-meta-pill">
              <span className="wb-meta-lbl">AVG TIME:</span>
              <span className="wb-meta-val">{batchResponse.stats.avgLatencyMs} ms</span>
            </div>
          </div>
        ) : (
          <div className="wb-resp-placeholder-title">
            <span>Response</span>
          </div>
        )}

        {/* Right Tab Controls & Actions */}
        {!isLoading && response && !isMultiRequest && (
          <div className="wb-resp-actions-bar">
            <div className="wb-resp-subtabs">
              <button
                type="button"
                className={`wb-resp-tab-btn ${singleActiveTab === 'body' ? 'active' : ''}`}
                onClick={() => setSingleActiveTab('body')}
              >
                Body {response.isJson && <span className="badge-json">JSON</span>}
              </button>
              <button
                type="button"
                className={`wb-resp-tab-btn ${singleActiveTab === 'headers' ? 'active' : ''}`}
                onClick={() => setSingleActiveTab('headers')}
              >
                Headers ({Object.keys(response.headers).length})
              </button>
            </div>

            <button
              type="button"
              className="wb-resp-btn-action"
              onClick={handleCopy}
              title="Copy response body"
            >
              {copied ? (
                <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Copied</span>
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

            {onSaveClick && (
              <button
                type="button"
                className="wb-resp-btn-action"
                onClick={onSaveClick}
                title="Save API configuration"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Response Content Pane */}
      <div className="wb-resp-content-viewport">
        {isLoading ? (
          <div className="wb-resp-loading-wrap">
            <div className="wb-resp-spinner" />
            <span className="wb-resp-loading-text">
              {requestCount > 1
                ? `Executing benchmark across ${requestCount} parallel requests...`
                : 'Sending request and awaiting response...'}
            </span>
          </div>
        ) : !response && !batchResponse ? (
          <div className="wb-resp-empty-wrap">
            <div className="wb-resp-empty-prompt">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <div className="wb-empty-prompt-title">No response yet</div>
              <div className="wb-empty-prompt-sub">
                Enter an endpoint URL above and click <strong>Send</strong> (or press <strong>Ctrl+Enter</strong>).
              </div>
            </div>
          </div>
        ) : isMultiRequest && batchResponse ? (
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
          <div className="wb-resp-error-box">
            <div className="wb-resp-error-title">Request Failed</div>
            <div className="wb-resp-error-body">{response.error}</div>
          </div>
        ) : response ? (
          <div className="wb-resp-results-container">
            {singleActiveTab === 'body' && (
              <div className="wb-code-viewer-wrap">
                <pre className="wb-code-viewer-pre">
                  <code>
                    {typeof response.data === 'object'
                      ? JSON.stringify(response.data, null, 2)
                      : String(response.data || '')}
                  </code>
                </pre>
              </div>
            )}

            {singleActiveTab === 'headers' && (
              <div className="wb-resp-headers-table-wrap">
                <div className="wb-resp-headers-filter-row">
                  <input
                    type="text"
                    value={headerFilter}
                    onChange={(e) => setHeaderFilter(e.target.value)}
                    className="wb-headers-filter-input"
                  />
                  <span className="wb-headers-filter-count">
                    {headersList.length} header{headersList.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <table className="wb-resp-headers-grid">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Header</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headersList.map(([key, val]) => (
                      <tr key={key}>
                        <td className="wb-hdr-key">{key}</td>
                        <td className="wb-hdr-val">{String(val)}</td>
                      </tr>
                    ))}
                    {headersList.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                          No headers matching filter.
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
    </div>
  );
};
