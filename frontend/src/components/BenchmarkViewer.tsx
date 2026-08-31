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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return '#10b981';
    if (code >= 300 && code < 400) return '#3b82f6';
    if (code >= 400 && code < 500) return '#f59e0b';
    return '#ef4444';
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
    <div className="wb-bench-view">
      {/* Benchmark Summary Metrics Strip */}
      <div className="wb-bench-metrics-strip">
        <div className="wb-bench-metric-item">
          <span className="wb-bench-lbl">TOTAL RUNS</span>
          <span className="wb-bench-val">{stats.totalRequests}</span>
        </div>

        <div className="wb-bench-divider" />

        <div className="wb-bench-metric-item">
          <span className="wb-bench-lbl">SUCCESS RATE</span>
          <span
            className="wb-bench-val"
            style={{ color: stats.successRate === 100 ? '#10b981' : '#f59e0b' }}
          >
            {stats.successRate}%
          </span>
        </div>

        <div className="wb-bench-divider" />

        <div className="wb-bench-metric-item">
          <span className="wb-bench-lbl">AVG TIME</span>
          <span className="wb-bench-val">{stats.avgLatencyMs} ms</span>
        </div>

        <div className="wb-bench-divider" />

        <div className="wb-bench-metric-item">
          <span className="wb-bench-lbl">MIN / MAX</span>
          <span className="wb-bench-val">{stats.minLatencyMs} / {stats.maxLatencyMs} ms</span>
        </div>
      </div>

      {/* Benchmark Sub-Navigation Tabs */}
      <div className="wb-bench-subtabs-row">
        <div className="wb-bench-tabs-group">
          <button
            type="button"
            className={`wb-bench-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            Overview & Status Codes
          </button>
          <button
            type="button"
            className={`wb-bench-tab-btn ${activeTab === 'runs' ? 'active' : ''}`}
            onClick={() => onTabChange('runs')}
          >
            All Runs ({results.length})
          </button>
          <button
            type="button"
            className={`wb-bench-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => onTabChange('body')}
          >
            Sample Body
          </button>
          <button
            type="button"
            className={`wb-bench-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => onTabChange('headers')}
          >
            Sample Headers
          </button>
        </div>

        {activeTab === 'body' && (
          <button type="button" className="wb-btn-copy-resp" onClick={onCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* TAB 1: Overview & Status Code Distribution */}
      {activeTab === 'stats' && (
        <div className="wb-bench-overview-pane">
          <h5 className="wb-bench-section-title">Status Code Breakdown</h5>
          <div className="wb-bench-status-list">
            {stats.statusCodes.map((item: StatusCodeStat) => (
              <div key={item.statusCode} className="wb-bench-status-row">
                <span
                  className="wb-bench-status-badge"
                  style={{
                    backgroundColor: item.statusCode >= 200 && item.statusCode < 300 ? '#ecfdf5' : '#fef2f2',
                    color: getStatusColor(item.statusCode),
                    borderColor: item.statusCode >= 200 && item.statusCode < 300 ? '#bbf7d0' : '#fecaca',
                  }}
                >
                  {item.statusCode} {item.statusText}
                </span>

                <div className="wb-bench-progress-bar">
                  <div
                    className="wb-bench-progress-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getStatusColor(item.statusCode),
                    }}
                  />
                </div>

                <span className="wb-bench-status-count">
                  {item.count} reqs ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: All Runs Table */}
      {activeTab === 'runs' && (
        <div className="wb-bench-runs-pane">
          <table className="wb-bench-runs-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '140px' }}>Status</th>
                <th style={{ width: '100px' }}>Latency</th>
                <th style={{ width: '100px' }}>Size</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((run, idx) => (
                <tr key={idx}>
                  <td className="mono-num">#{idx + 1}</td>
                  <td>
                    <span
                      style={{
                        color: getStatusColor(run.statusCode),
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.8rem',
                      }}
                    >
                      ● {run.statusCode} {run.statusText}
                    </span>
                  </td>
                  <td className="mono-num">{run.elapsedMs} ms</td>
                  <td className="mono-num">{formatSize(run.sizeBytes)}</td>
                  <td>
                    {run.error ? (
                      <span className="text-danger">{run.error}</span>
                    ) : (
                      <span className="text-muted">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Sample Body */}
      {activeTab === 'body' && (
        <div className="wb-bench-code-pane">
          <pre className="wb-bench-json-code">
            <code>
              {typeof latestResponse.data === 'object'
                ? JSON.stringify(latestResponse.data, null, 2)
                : String(latestResponse.data || latestResponse.error || 'Empty body')}
            </code>
          </pre>
        </div>
      )}

      {/* TAB 4: Sample Headers */}
      {activeTab === 'headers' && (
        <div className="wb-bench-headers-pane">
          <div className="wb-bench-headers-search">
            <input
              type="text"
              placeholder="Filter headers..."
              value={headerFilter}
              onChange={(e) => onHeaderFilterChange(e.target.value)}
              className="wb-bench-search-input"
            />
          </div>
          <table className="wb-bench-headers-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Header Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {headersList.map(([key, val]) => (
                <tr key={key}>
                  <td className="wb-header-name">{key}</td>
                  <td className="wb-header-val">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
