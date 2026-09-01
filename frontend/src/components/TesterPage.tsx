import { useState, useRef, useEffect } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { useNavigate } from 'react-router-dom';
import { KeyValueEditor } from './KeyValueEditor';
import { BodyEditor } from './BodyEditor';
import { ResponseViewer } from './ResponseViewer';
import { UserNav } from './auth/UserNav';

export function TesterPage() {
  const wb = useWorkbench();
  const navigate = useNavigate();

  const [runsDropdownOpen, setRunsDropdownOpen] = useState(false);
  const runsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (runsDropdownRef.current && !runsDropdownRef.current.contains(event.target as Node)) {
        setRunsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runOptions = [
    { value: 1, label: '1 (Single)' },
    { value: 5, label: '5 (Benchmark)' },
    { value: 10, label: '10 (Benchmark)' },
    { value: 25, label: '25 (Benchmark)' },
    { value: 50, label: '50 (Benchmark)' },
    { value: 100, label: '100 (Benchmark)' }
  ];

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


          {/* User Profile & Account Dropdown */}
          <UserNav onOpenProfileModal={() => navigate('/settings')} />
        </div>
      </header>

      {/* API Tester View (Unified Request Bar + Split Workspace) */}
      <div className="wb-tester-workspace">
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
              className="wb-url-native-input"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {/* Fully Custom Runs Dropdown */}
          <div className="wb-runs-custom-dropdown-wrap" ref={runsDropdownRef} title="Number of parallel request executions">
            <span className="wb-runs-dropdown-label">Runs:</span>
            <div className="wb-custom-select-container">
              <button
                type="button"
                className={`wb-custom-select-trigger ${runsDropdownOpen ? 'open' : ''}`}
                onClick={() => !wb.isSending && setRunsDropdownOpen(!runsDropdownOpen)}
                disabled={wb.isSending}
              >
                <span>{runOptions.find(o => o.value === wb.requestCount)?.label || `${wb.requestCount} (Benchmark)`}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              {runsDropdownOpen && (
                <div className="wb-custom-select-menu">
                  {runOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`wb-custom-select-option ${wb.requestCount === option.value ? 'selected' : ''}`}
                      onClick={() => {
                        wb.handleSetCount(option.value);
                        setRunsDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>



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
                />
              )}

              {wb.activeTab === 'headers' && (
                <KeyValueEditor
                  items={wb.headers}
                  onChange={wb.setHeaders}
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
