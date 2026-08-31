import { useWorkbench } from '../context/WorkbenchContext';
import { useNavigate } from 'react-router-dom';
import { KeyValueEditor } from './KeyValueEditor';
import { BodyEditor } from './BodyEditor';
import { ResponseViewer } from './ResponseViewer';
import { UserNav } from './auth/UserNav';

export function TesterPage() {
  const wb = useWorkbench();
  const navigate = useNavigate();

  return (
    <>
      {/* Top Header Bar */}
      <header className="wb-app-topbar">
        <div className="wb-topbar-title-block">
          <h1 className="wb-topbar-heading">API Tester</h1>
          <span className="wb-topbar-tagline">
            HTTP Request &amp; Benchmark Testing Environment
          </span>
        </div>

        <div className="wb-topbar-actions">
          {/* Live Backend Connection Indicator */}
          <div
            className={`wb-health-pill ${wb.backendStatus === 'error' ? 'error' : ''}`}
            onClick={wb.checkBackend}
            title="Click to check backend status"
          >
            <span className="wb-health-dot" />
            <span>
              {wb.backendStatus === 'healthy'
                ? `FastAPI Online ${wb.backendLatency !== null ? `(${wb.backendLatency}ms)` : ''}`
                : wb.backendStatus === 'loading'
                ? 'Connecting...'
                : 'FastAPI Offline'}
            </span>
          </div>

          {/* User Profile & Account Dropdown */}
          <UserNav onOpenProfileModal={() => navigate('/settings')} />
        </div>
      </header>

      {/* API Tester View (Unified Request Bar + Split Workspace) */}
      <div className="wb-tester-workspace">
        {wb.saveToast && (
          <div className="wb-toast-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{wb.saveToast}</span>
          </div>
        )}

        {/* UNIFIED REQUEST BAR: Method ▾ | URL Input | Runs (1x) | Save API | Send ✈ */}
        <div className="wb-unified-request-bar">
          {/* Method Dropdown */}
          <div className="wb-method-select-wrap">
            <select
              value={wb.method}
              onChange={(e) => wb.setMethod(e.target.value as any)}
              className={`wb-method-native-select ${wb.method.toLowerCase()}`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
          </div>

          {/* URL Input */}
          <div className="wb-url-input-wrap">
            <input
              type="text"
              value={wb.url}
              onChange={(e) => wb.setUrl(e.target.value)}
              onKeyDown={wb.handleKeyDownUrl}
              placeholder="https://api.example.com/v1/endpoint"
              className="wb-url-native-input"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {/* Runs Selector (1 to 100) */}
          <div className="wb-runs-control" title="Number of parallel request executions (1–100)">
            <span className="wb-runs-label">Runs:</span>
            <select
              value={wb.requestCount}
              onChange={(e) => wb.handleSetCount(parseInt(e.target.value, 10))}
              className="wb-runs-select"
              disabled={wb.isSending}
            >
              <option value={1}>1 (Single)</option>
              <option value={5}>5 (Benchmark)</option>
              <option value={10}>10 (Benchmark)</option>
              <option value={25}>25 (Benchmark)</option>
              <option value={50}>50 (Benchmark)</option>
              <option value={100}>100 (Benchmark)</option>
            </select>
          </div>

          {/* Save API Button */}
          <button
            type="button"
            className="wb-btn-save-req"
            onClick={() => wb.setSaveApiModalOpen(true)}
            disabled={!wb.url.trim()}
            title="Save this API configuration"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>Save</span>
          </button>

          {/* Send Button */}
          <button
            type="button"
            className={`wb-btn-send-req ${wb.requestCount > 1 ? 'bench' : ''}`}
            onClick={wb.handleSendRequest}
            disabled={wb.isSending || !wb.url.trim()}
          >
            {wb.isSending ? (
              <>
                <div className="wb-btn-spinner" />
                <span>{wb.requestCount > 1 ? `Executing ${wb.requestCount}x...` : 'Sending...'}</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{wb.requestCount > 1 ? `Run (${wb.requestCount}x)` : 'Send'}</span>
              </>
            )}
          </button>
        </div>

        {/* SPLIT WORKSPACE: Left Request Configuration + Right Response Inspector */}
        <div className="wb-workspace-split-panes">
          {/* Left Column: Request Configuration */}
          <div className="wb-request-config-pane">
            {/* Clean Subtabs Bar: Params | Headers | Body | Auth */}
            <div className="wb-config-tabs-bar">
              <button
                type="button"
                className={`wb-config-tab ${wb.activeTab === 'params' ? 'active' : ''}`}
                onClick={() => wb.setActiveTab('params')}
              >
                Params
                {wb.enabledParamsCount > 0 && <span className="wb-tab-badge">{wb.enabledParamsCount}</span>}
              </button>

              <button
                type="button"
                className={`wb-config-tab ${wb.activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => wb.setActiveTab('headers')}
              >
                Headers
                {wb.enabledHeadersCount > 0 && <span className="wb-tab-badge">{wb.enabledHeadersCount}</span>}
              </button>

              <button
                type="button"
                className={`wb-config-tab ${wb.activeTab === 'body' ? 'active' : ''}`}
                onClick={() => wb.setActiveTab('body')}
              >
                Body
                {wb.bodyType !== 'none' && <span className="wb-tab-badge">{wb.bodyType}</span>}
              </button>

              <button
                type="button"
                className={`wb-config-tab ${wb.activeTab === 'auth' ? 'active' : ''}`}
                onClick={() => wb.setActiveTab('auth')}
              >
                Auth
              </button>
            </div>

            {/* Subtab Contents */}
            <div className="wb-config-body-viewport">
              {wb.activeTab === 'params' && (
                <KeyValueEditor
                  items={wb.params}
                  onChange={wb.setParams}
                  keyPlaceholder="Parameter name"
                  valuePlaceholder="Value"
                  descPlaceholder="Description (Optional)"
                />
              )}

              {wb.activeTab === 'headers' && (
                <KeyValueEditor
                  items={wb.headers}
                  onChange={wb.setHeaders}
                  keyPlaceholder="Header name"
                  valuePlaceholder="Header value"
                  descPlaceholder="Description (Optional)"
                />
              )}

              {wb.activeTab === 'body' && (
                <BodyEditor
                  bodyType={wb.bodyType}
                  body={wb.body}
                  onBodyTypeChange={wb.setBodyType}
                  onBodyChange={wb.setBody}
                />
              )}

              {wb.activeTab === 'auth' && (
                <KeyValueEditor
                  items={wb.headers.filter(
                    (h) =>
                      h.key.toLowerCase().includes('auth') ||
                      h.key.toLowerCase().includes('key') ||
                      h.key.toLowerCase().includes('token')
                  )}
                  onChange={(authItems) => {
                    const nonAuth = wb.headers.filter(
                      (h) =>
                        !h.key.toLowerCase().includes('auth') &&
                        !h.key.toLowerCase().includes('key') &&
                        !h.key.toLowerCase().includes('token')
                    );
                    wb.setHeaders([...nonAuth, ...authItems]);
                  }}
                  keyPlaceholder="Authorization / X-API-Key"
                  valuePlaceholder="Bearer token or API Key"
                  descPlaceholder="Description"
                />
              )}
            </div>
          </div>

          {/* Right Column: Response Inspector */}
          <div className="wb-response-pane-wrap">
            <ResponseViewer
              response={wb.response}
              batchResponse={wb.batchResponse}
              requestCount={wb.requestCount}
              isLoading={wb.isSending}
              onSaveClick={() => wb.setSaveApiModalOpen(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
