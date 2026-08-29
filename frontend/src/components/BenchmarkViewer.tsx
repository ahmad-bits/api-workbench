import React from 'react';
import type { BatchWorkbenchResponse, StatusCodeStat } from '../types/workbench';

interface BenchmarkViewerProps {
  batchResponse: BatchWorkbenchResponse;
  activeTab: 'stats' | 'body' | 'headers' | 'runs';
  onTabChange: (tab: 'stats' | 'body' | 'headers' | 'runs') => void;
  headerFilter: string;
  onHeaderFilterChange: (filter: string) => void;
  onCopy: () => void;
  copied: boolean;
}

export const BenchmarkViewer: React.FC<BenchmarkViewerProps> = ({
  batchResponse,
  activeTab,
  onTabChange,
  headerFilter,
  onHeaderFilterChange,
  onCopy,
  copied,
}) => {
  const { stats, results, latestResponse } = batchResponse;

  const getStatusClass = (code: number) => {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    if (code >= 500) return 'status-5xx';
    return 'status-other';
  };

  const getProgressBarClass = (code: number) => {
    if (code >= 200 && code < 300) return 'bar-2xx';
    if (code >= 300 && code < 400) return 'bar-3xx';
    if (code >= 400 && code < 500) return 'bar-4xx';
    if (code >= 500) return 'bar-5xx';
    return 'bar-other';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const headersList = latestResponse
    ? Object.entries(latestResponse.headers).filter(([key, val]) => {
        if (!headerFilter) return true;
        return (
          key.toLowerCase().includes(headerFilter.toLowerCase()) ||
          String(val).toLowerCase().includes(headerFilter.toLowerCase())
        );
      })
    : [];

  return (
    <div className="benchmark-viewer-container">
      {/* Benchmark Navigation & Sub-Tabs */}
      <div className="benchmark-subnav">
        <div className="tab-buttons">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Aggregate Analysis
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => onTabChange('body')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Latest Body {latestResponse.isJson && <span className="pill-subtle">JSON</span>}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => onTabChange('headers')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Headers ({Object.keys(latestResponse.headers).length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'runs' ? 'active' : ''}`}
            onClick={() => onTabChange('runs')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            All Runs ({results.length})
          </button>
        </div>

        {activeTab === 'body' && (
          <button type="button" className="btn-copy" onClick={onCopy} title="Copy response body">
            {copied ? '✓ Copied' : 'Copy Body'}
          </button>
        )}
      </div>

      {/* TAB 1: Aggregate Analysis */}
      {activeTab === 'stats' && (
        <div className="benchmark-analytics-content">
          {/* Key Metrics Cards Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Total Requests</span>
                <span className="stat-icon">🔄</span>
              </div>
              <div className="stat-value">{stats.totalRequests}</div>
              <div className="stat-subtitle">Configured executions</div>
            </div>

            <div className="stat-card success-accent">
              <div className="stat-card-header">
                <span className="stat-label">Successful Requests</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value text-success">{stats.successfulRequests}</div>
              <div className="stat-subtitle">
                <span className="rate-badge success">{stats.successRate}% Success</span>
              </div>
            </div>

            <div className="stat-card failed-accent">
              <div className="stat-card-header">
                <span className="stat-label">Failed Requests</span>
                <span className="stat-icon">❌</span>
              </div>
              <div className="stat-value text-danger">{stats.failedRequests}</div>
              <div className="stat-subtitle">
                {stats.failedRequests > 0 ? (
                  <span className="rate-badge danger">
                    {roundPercentage(100 - stats.successRate)}% Errors
                  </span>
                ) : (
                  <span className="rate-badge neutral">0 Errors</span>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Average Latency</span>
                <span className="stat-icon">⚡</span>
              </div>
              <div className="stat-value">{stats.avgLatencyMs} <span className="stat-unit">ms</span></div>
              <div className="stat-subtitle">Mean round-trip time</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Minimum Latency</span>
                <span className="stat-icon">🚀</span>
              </div>
              <div className="stat-value text-emerald">{stats.minLatencyMs} <span className="stat-unit">ms</span></div>
              <div className="stat-subtitle">Fastest execution</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Maximum Latency</span>
                <span className="stat-icon">🐢</span>
              </div>
              <div className="stat-value text-amber">{stats.maxLatencyMs} <span className="stat-unit">ms</span></div>
              <div className="stat-subtitle">Peak round-trip time</div>
            </div>
          </div>

          {/* Status Code Distribution Section */}
          <div className="distribution-card">
            <div className="distribution-header">
              <div className="distribution-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
                Status Code Distribution
              </div>
              <span className="distribution-total-badge">
                {stats.totalRequests} Total Responses
              </span>
            </div>

            <div className="distribution-list">
              {stats.statusCodes.length > 0 ? (
                stats.statusCodes.map((item: StatusCodeStat) => (
                  <div key={item.statusCode} className="distribution-row">
                    <div className="dist-code-group">
                      <span className={`status-tag ${getStatusClass(item.statusCode)}`}>
                        {item.statusCode}
                      </span>
                      <span className="dist-status-text">{item.statusText}</span>
                    </div>

                    <div className="dist-bar-wrapper">
                      <div className="dist-bar-track">
                        <div
                          className={`dist-bar-fill ${getProgressBarClass(item.statusCode)}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="dist-counts">
                      <span className="dist-count-pill">{item.count} req{item.count !== 1 ? 's' : ''}</span>
                      <span className="dist-percentage">{item.percentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dist-empty">No status codes recorded</div>
              )}
            </div>
          </div>

          {/* Latency Range Breakdown */}
          <div className="latency-spread-card">
            <div className="spread-title">Latency Spread Breakdown</div>
            <div className="spread-meter-container">
              <div className="spread-label-min">
                <span className="spread-label-tag">Min</span>
                <strong>{stats.minLatencyMs} ms</strong>
              </div>
              <div className="spread-track">
                <div className="spread-avg-marker" style={{ left: calculateSpreadPosition(stats.minLatencyMs, stats.maxLatencyMs, stats.avgLatencyMs) }}>
                  <div className="marker-pin"></div>
                  <div className="marker-label">Avg {stats.avgLatencyMs} ms</div>
                </div>
              </div>
              <div className="spread-label-max">
                <span className="spread-label-tag">Max</span>
                <strong>{stats.maxLatencyMs} ms</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Latest Response Body */}
      {activeTab === 'body' && (
        <div className="response-body-area">
          <div className="code-viewer-container">
            <div className="latest-body-banner">
              <span>Showing sample response payload from execution #{results.length}</span>
              <span className={`status-tag ${getStatusClass(latestResponse.statusCode)}`}>
                {latestResponse.statusCode} {latestResponse.statusText}
              </span>
            </div>
            <pre className="code-content">
              {typeof latestResponse.data === 'object'
                ? JSON.stringify(latestResponse.data, null, 2)
                : String(latestResponse.data || latestResponse.error || 'Empty body')}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: Latest Headers */}
      {activeTab === 'headers' && (
        <div className="response-body-area">
          <div className="headers-table-wrapper">
            <div className="headers-search-bar">
              <input
                type="text"
                placeholder="Filter response headers..."
                value={headerFilter}
                onChange={(e) => onHeaderFilterChange(e.target.value)}
                className="kv-input"
                style={{ maxWidth: '300px' }}
              />
              <span className="headers-count-badge">
                {headersList.length} header{headersList.length !== 1 ? 's' : ''} (from sample response)
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
        </div>
      )}

      {/* TAB 4: All Runs Table */}
      {activeTab === 'runs' && (
        <div className="response-body-area">
          <div className="kv-table-container runs-table-container">
            <table className="kv-table runs-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}># Run</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th style={{ width: '120px' }}>Latency</th>
                  <th style={{ width: '110px' }}>Size</th>
                  <th>Details / Error</th>
                </tr>
              </thead>
              <tbody>
                {results.map((run, idx) => (
                  <tr key={idx}>
                    <td className="run-idx-cell">#{idx + 1}</td>
                    <td>
                      <span className={`status-tag ${getStatusClass(run.statusCode)}`}>
                        {run.statusCode} {run.statusText}
                      </span>
                    </td>
                    <td className="run-latency-cell">
                      <span className="mono-num">{run.elapsedMs} ms</span>
                    </td>
                    <td className="run-size-cell">
                      <span className="mono-num">{formatSize(run.sizeBytes)}</span>
                    </td>
                    <td className="run-details-cell">
                      {run.error ? (
                        <span className="run-error-tag">{run.error}</span>
                      ) : (
                        <span className="run-success-tag">OK {run.isJson ? '(JSON)' : ''}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function roundPercentage(num: number): number {
  return Math.round(num * 10) / 10;
}

function calculateSpreadPosition(min: number, max: number, avg: number): string {
  if (max === min) return '50%';
  const pct = Math.min(100, Math.max(0, ((avg - min) / (max - min)) * 100));
  return `${pct}%`;
}
