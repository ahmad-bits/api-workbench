import React, { useState, useMemo } from 'react';
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

function highlightJsonLine(line: string): string {
  const escaped = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'wb-jnum';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'wb-jkey';
        } else {
          cls = 'wb-jstr';
        }
      } else if (/true|false/.test(match)) {
        cls = 'wb-jbool';
      } else if (/null/.test(match)) {
        cls = 'wb-jnull';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  batchResponse,
  requestCount,
  isLoading,
  onSaveClick,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'pretty' | 'raw' | 'headers'>('pretty');
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
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = () => {
    const target = isMultiRequest ? batchResponse?.latestResponse : response;
    if (!target) return;
    const content =
      typeof target.data === 'object'
        ? JSON.stringify(target.data, null, 2)
        : String(target.data || '');
    const isJson = target.isJson;
    const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${Date.now()}.${isJson ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Response downloaded.');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusBadgeClass = (code: number) => {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  };

  const headersList = useMemo(() => {
    if (!response || !response.headers) return [];
    return Object.entries(response.headers).filter(([key, val]) => {
      if (!headerFilter) return true;
      return (
        key.toLowerCase().includes(headerFilter.toLowerCase()) ||
        String(val).toLowerCase().includes(headerFilter.toLowerCase())
      );
    });
  }, [response, headerFilter]);

  const formattedLines = useMemo(() => {
    if (!response) return [];
    const text =
      typeof response.data === 'object'
        ? JSON.stringify(response.data, null, 2)
        : String(response.data || '');
    return text.split('\n');
  }, [response]);

  const rawText = useMemo(() => {
    if (!response) return '';
    return typeof response.data === 'object'
      ? JSON.stringify(response.data, null, 2)
      : String(response.data || '');
  }, [response]);

  return (
    <div className="wb-resp-section-root">
      <div className="wb-resp-header-bar">
        <div className="wb-resp-header-left">
          <div className="wb-resp-main-title">
            <span className="wb-resp-heading-text">Response</span>
          </div>

          {!isLoading && response && !isMultiRequest && (
            <div className="wb-resp-meta-pills-row">
              <div className={`wb-resp-meta-chip status ${getStatusBadgeClass(response.statusCode)}`}>
                <span className="wb-chip-dot" />
                <span className="wb-chip-label">Status</span>
                <span className="wb-chip-value">{response.statusCode} {response.statusText || 'OK'}</span>
              </div>

              <div className="wb-resp-meta-chip" title="Round-trip request time">
                <span className="wb-chip-label">Speed</span>
                <span className="wb-chip-value">{response.elapsedMs} ms</span>
              </div>

              <div className="wb-resp-meta-chip" title="Response payload size">
                <span className="wb-chip-label">Size</span>
                <span className="wb-chip-value">{formatSize(response.sizeBytes)}</span>
              </div>

              <div className="wb-resp-meta-chip" title="Response format">
                <span className="wb-chip-label">Format</span>
                <span className="wb-chip-value">{response.isJson ? 'JSON' : 'TEXT'}</span>
              </div>
            </div>
          )}
        </div>

        {!isLoading && response && !isMultiRequest && (
          <div className="wb-resp-header-right">
            <div className="wb-resp-nav-tabs">
              <button
                type="button"
                className={`wb-resp-nav-tab ${activeTab === 'pretty' ? 'active' : ''}`}
                onClick={() => setActiveTab('pretty')}
              >
                Body
              </button>
              <button
                type="button"
                className={`wb-resp-nav-tab ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                Raw
              </button>
              <button
                type="button"
                className={`wb-resp-nav-tab ${activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveTab('headers')}
              >
                Headers ({Object.keys(response.headers || {}).length})
              </button>
            </div>

            <div className="wb-resp-actions-group">
              <button
                type="button"
                className="wb-resp-action-btn"
                onClick={handleCopy}
                title="Copy response body to clipboard"
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: '#2563eb' }}>Copied</span>
                  </>
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

              <button
                type="button"
                className="wb-resp-action-btn"
                onClick={handleDownload}
                title="Download response file"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download</span>
              </button>

              {onSaveClick && (
                <button
                  type="button"
                  className="wb-resp-action-btn primary"
                  onClick={onSaveClick}
                  title="Save API to My APIs"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save API</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="wb-resp-body-viewport">
        {isLoading && (
          <div className="wb-resp-state-box loading">
            <div className="wb-resp-loading-spinner" />
            <div className="wb-resp-loading-title">
              {requestCount > 1
                ? `Running Benchmark (${requestCount} parallel requests)...`
                : 'Executing API Request...'}
            </div>
            <div className="wb-resp-loading-subtitle">
              Sending HTTP request and awaiting response...
            </div>
          </div>
        )}

        {!isLoading && !response && !batchResponse && (
          <div className="wb-resp-state-box empty">
            <div className="wb-resp-empty-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <div className="wb-resp-empty-title">Ready to Test</div>
            <div className="wb-resp-empty-text">
              Enter your target API URL above and click <strong>Send</strong> or press <strong>Ctrl + Enter</strong> to inspect the response.
            </div>
          </div>
        )}

        {!isLoading && isMultiRequest && batchResponse && (
          <BenchmarkViewer
            batchResponse={batchResponse}
            activeTab={benchmarkTab}
            onTabChange={setBenchmarkTab}
            onCopy={handleCopy}
            copied={copied}
          />
        )}

        {!isLoading && response?.error && (
          <div className="wb-resp-error-card">
            <div className="wb-resp-error-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Request Execution Failed</span>
            </div>
            <div className="wb-resp-error-message">{response.error}</div>
          </div>
        )}

        {!isLoading && response && !response.error && !isMultiRequest && (
          <div className="wb-resp-content-card">
            {activeTab === 'pretty' && (
              <div className="wb-resp-code-canvas">
                <div className="wb-resp-code-lines">
                  {formattedLines.map((line, idx) => (
                    <div key={idx} className="wb-resp-code-row">
                      <span className="wb-resp-line-number" aria-hidden="true">
                        {idx + 1}
                      </span>
                      <span
                        className="wb-resp-line-text"
                        dangerouslySetInnerHTML={{ __html: highlightJsonLine(line) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="wb-resp-raw-canvas">
                <pre className="wb-resp-raw-pre">{rawText}</pre>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="wb-resp-headers-section">
                <div className="wb-resp-headers-toolbar">
                  <div className="wb-headers-search-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Filter response headers..."
                      value={headerFilter}
                      onChange={(e) => setHeaderFilter(e.target.value)}
                      className="wb-headers-search-input"
                    />
                  </div>
                  <span className="wb-headers-count-badge">
                    {headersList.length} header{headersList.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="wb-resp-headers-table-box">
                  <table className="wb-resp-headers-table">
                    <thead>
                      <tr>
                        <th style={{ width: '38%' }}>Header</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headersList.length > 0 ? (
                        headersList.map(([key, val]) => (
                          <tr key={key}>
                            <td className="wb-hdr-name-col">
                              <code>{key}</code>
                            </td>
                            <td className="wb-hdr-val-col">
                              <code>{String(val)}</code>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="wb-hdr-empty-col">
                            No response headers match the filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
