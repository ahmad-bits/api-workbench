import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { UserNav } from './components/auth/UserNav';
import { KeyValueEditor } from './components/KeyValueEditor';
import { BodyEditor } from './components/BodyEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { MockManager } from './components/mock/MockManager';
import type {
  HttpMethod,
  BodyType,
  KeyValuePair,
  WorkbenchRequest,
  WorkbenchResponse,
  BatchWorkbenchResponse,
  QuickPreset,
} from './types/workbench';
import type { MockEndpoint } from './types/mock';

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'jp-post-1',
    name: 'JSONPlaceholder Post #1',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    params: [],
    headers: [],
    bodyType: 'none',
    body: '',
  },
  {
    id: 'jp-users',
    name: 'JSONPlaceholder Users',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    params: [],
    headers: [],
    bodyType: 'none',
    body: '',
  },
  {
    id: 'httpbin-post',
    name: 'HttpBin Echo (POST JSON)',
    method: 'POST',
    url: 'https://httpbin.org/post',
    params: [],
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: 'h2', key: 'X-API-Workbench', value: 'v1.0.0', enabled: true },
    ],
    bodyType: 'json',
    body: JSON.stringify(
      {
        message: 'Hello from API Workbench!',
        timestamp: new Date().toISOString(),
        developer: 'Full-Stack Workbench User',
      },
      null,
      2
    ),
  },
  {
    id: 'local-health',
    name: 'Local FastAPI Health Check',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/health',
    params: [],
    headers: [],
    bodyType: 'none',
    body: '',
  },
];

const QUICK_COUNT_OPTIONS = [1, 5, 10, 25, 50, 100];

function WorkbenchDashboard() {
  const { user } = useAuth();

  // Navigation View: 'workbench' | 'mock-server'
  const [currentView, setCurrentView] = useState<'workbench' | 'mock-server'>('workbench');

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Backend health state
  const [backendStatus, setBackendStatus] = useState<'loading' | 'healthy' | 'error'>('loading');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  // Request Builder state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/posts/1');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: 'h_default', key: 'Accept', value: 'application/json', enabled: true },
  ]);
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [body, setBody] = useState<string>('');
  const [timeoutSeconds] = useState<number>(30);
  const [requestCount, setRequestCount] = useState<number>(1);

  // Execution & Response state
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<WorkbenchResponse | null>(null);
  const [batchResponse, setBatchResponse] = useState<BatchWorkbenchResponse | null>(null);

  // Check backend health on mount
  const checkBackend = useCallback(async () => {
    try {
      const { latencyMs } = await api.checkHealth();
      setBackendLatency(latencyMs);
      setBackendStatus('healthy');
    } catch {
      setBackendStatus('error');
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  // Load a quick preset
  const handleLoadPreset = (preset: QuickPreset) => {
    setMethod(preset.method);
    setUrl(preset.url);
    setParams(preset.params ? [...preset.params] : []);
    setHeaders(
      preset.headers && preset.headers.length > 0
        ? [...preset.headers]
        : [{ id: `h_${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }]
    );
    setBodyType(preset.bodyType || 'none');
    setBody(preset.body || '');
    if (preset.requestCount !== undefined) {
      setRequestCount(preset.requestCount);
    }
    if (preset.bodyType && preset.bodyType !== 'none') {
      setActiveTab('body');
    } else if (preset.params && preset.params.length > 0) {
      setActiveTab('params');
    } else {
      setActiveTab('headers');
    }
  };

  const handleSetCount = (val: number) => {
    if (isNaN(val)) {
      setRequestCount(1);
      return;
    }
    const clamped = Math.max(1, Math.min(100, Math.floor(val)));
    setRequestCount(clamped);
  };

  // Test mock endpoint inside Workbench
  const handleTestInWorkbench = (mock: MockEndpoint) => {
    const fullMockUrl = mock.fullUrl || `http://127.0.0.1:8000${mock.mockUrl}`;
    setMethod(mock.method);
    setUrl(fullMockUrl);
    setRequestCount(1);
    setParams([]);
    setHeaders([
      { id: 'h_accept', key: 'Accept', value: 'application/json', enabled: true },
    ]);
    if (mock.method !== 'GET' && mock.method !== 'HEAD') {
      setBodyType('none');
      setBody('');
    }
    setResponse(null);
    setBatchResponse(null);
    setCurrentView('workbench');
  };

  // Dispatch HTTP request (single or multi-run benchmark)
  const handleSendRequest = async () => {
    if (!url.trim()) return;

    setIsSending(true);
    const req: WorkbenchRequest = {
      method,
      url: url.trim(),
      params,
      headers,
      bodyType,
      body,
      timeoutSeconds,
      requestCount,
    };

    try {
      if (requestCount > 1) {
        // Multi-request Benchmark mode
        setResponse(null);
        const batch = await api.dispatchBenchmarkRequest(req);
        setBatchResponse(batch);
      } else {
        // Single-request normal mode
        setBatchResponse(null);
        const resp = await api.dispatchHttpRequest(req);
        setResponse(resp);
      }
    } catch (err: any) {
      if (requestCount > 1) {
        setBatchResponse(null);
      }
      setResponse({
        statusCode: 0,
        statusText: 'Client Error',
        headers: {},
        data: null,
        isJson: false,
        sizeBytes: 0,
        elapsedMs: 0,
        error: err.message || 'Failed to dispatch request',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDownUrl = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendRequest();
    }
  };

  const enabledParamsCount = params.filter((p) => p.enabled && p.key.trim()).length;
  const enabledHeadersCount = headers.filter((h) => h.enabled && h.key.trim()).length;

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand-nav-group">
          <div className="brand-wrapper" onClick={() => setCurrentView('workbench')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="brand-title">API Workbench</span>
            <span className="badge-tag">@{user?.username}</span>
          </div>

          {/* App Navigation Switcher */}
          <nav className="nav-view-switcher">
            <button
              type="button"
              className={`nav-view-btn ${currentView === 'workbench' ? 'active' : ''}`}
              onClick={() => setCurrentView('workbench')}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>API Tester</span>
            </button>

            <button
              type="button"
              className={`nav-view-btn ${currentView === 'mock-server' ? 'active' : ''}`}
              onClick={() => setCurrentView('mock-server')}
            >
              <span style={{ fontSize: '1rem' }}>🎭</span>
              <span>Mock API Server</span>
            </button>
          </nav>
        </div>

        <div className="navbar-right-group">
          <UserNav onOpenProfileModal={() => setProfileModalOpen(true)} />

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Swagger Docs ↗
          </a>

          <div className="status-indicator">
            {backendStatus === 'loading' && (
              <div className="status-pill loading">
                <span className="pulse-dot"></span>
                FastAPI Connecting...
              </div>
            )}
            {backendStatus === 'healthy' && (
              <div className="status-pill healthy" onClick={checkBackend} style={{ cursor: 'pointer' }} title="Click to re-ping">
                <span className="pulse-dot"></span>
                FastAPI Ready {backendLatency !== null && `(${backendLatency}ms)`}
              </div>
            )}
            {backendStatus === 'error' && (
              <div className="status-pill error" onClick={checkBackend} style={{ cursor: 'pointer' }} title="Click to retry">
                <span className="pulse-dot"></span>
                FastAPI Offline
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* VIEW 1: Mock API Server */}
        {currentView === 'mock-server' && (
          <MockManager onTestInWorkbench={handleTestInWorkbench} />
        )}

        {/* VIEW 2: API Workbench (Request Builder + Response Viewer) */}
        {currentView === 'workbench' && (
          <>
            {/* Quick Presets Bar */}
            <div className="presets-container">
              <span className="presets-label">Quick Presets:</span>
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="preset-pill"
                  onClick={() => handleLoadPreset(preset)}
                >
                  <span
                    className="preset-method-tag"
                    style={{
                      color:
                        preset.method === 'GET'
                          ? 'var(--method-get)'
                          : preset.method === 'POST'
                          ? 'var(--method-post)'
                          : 'var(--method-put)',
                      background:
                        preset.method === 'GET'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : preset.method === 'POST'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    {preset.method}
                  </span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Request Builder Card */}
            <div className="glass-card request-bar-card">
              {/* Method + URL + Count + Send Input Row */}
              <div className="request-input-row">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className={`method-select ${method.toLowerCase()}`}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>

                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDownUrl}
                  placeholder="https://api.example.com/v1/resource or http://127.0.0.1:8000/mock/..."
                  className="url-input"
                />

                {/* Request Count Control */}
                <div className="request-count-wrapper" title="Configure number of requests to execute (1-100)">
                  <span className="count-label">Runs:</span>
                  <div className="count-stepper">
                    <button
                      type="button"
                      className="count-step-btn"
                      onClick={() => handleSetCount(requestCount - 1)}
                      disabled={requestCount <= 1 || isSending}
                      title="Decrease requests"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={requestCount}
                      onChange={(e) => handleSetCount(parseInt(e.target.value, 10))}
                      className="count-number-input"
                      disabled={isSending}
                    />
                    <button
                      type="button"
                      className="count-step-btn"
                      onClick={() => handleSetCount(requestCount + 1)}
                      disabled={requestCount >= 100 || isSending}
                      title="Increase requests"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  className={`btn-send ${requestCount > 1 ? 'benchmark-mode' : ''}`}
                  onClick={handleSendRequest}
                  disabled={isSending || !url.trim()}
                >
                  {isSending ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      <span>{requestCount > 1 ? `Executing ${requestCount}x...` : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>{requestCount > 1 ? `Run (${requestCount}x)` : 'Send'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Count Selector Row & Benchmark Notice */}
              <div className="count-toolbar">
                <div className="count-chips-group">
                  <span className="count-toolbar-label">Request Count:</span>
                  {QUICK_COUNT_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`count-chip ${requestCount === num ? 'active' : ''}`}
                      onClick={() => handleSetCount(num)}
                      disabled={isSending}
                    >
                      {num === 1 ? '1 (Single)' : `${num} requests`}
                    </button>
                  ))}
                </div>

                {requestCount > 1 && (
                  <div className="benchmark-badge-indicator">
                    <span className="benchmark-dot"></span>
                    <span>Benchmark Mode ({requestCount} runs)</span>
                  </div>
                )}
              </div>

              {/* Workbench Tabs (Params, Headers, Body) */}
              <div>
                <div className="workbench-tabs">
                  <button
                    type="button"
                    className={`tab-nav-item ${activeTab === 'params' ? 'active' : ''}`}
                    onClick={() => setActiveTab('params')}
                  >
                    Params {enabledParamsCount > 0 && <span className="tab-counter">{enabledParamsCount}</span>}
                  </button>
                  <button
                    type="button"
                    className={`tab-nav-item ${activeTab === 'headers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('headers')}
                  >
                    Headers {enabledHeadersCount > 0 && <span className="tab-counter">{enabledHeadersCount}</span>}
                  </button>
                  <button
                    type="button"
                    className={`tab-nav-item ${activeTab === 'body' ? 'active' : ''}`}
                    onClick={() => setActiveTab('body')}
                  >
                    Body {bodyType !== 'none' && <span className="tab-counter">{bodyType}</span>}
                  </button>
                </div>

                {/* Tab Contents */}
                <div style={{ paddingTop: '0.25rem' }}>
                  {activeTab === 'params' && (
                    <KeyValueEditor
                      items={params}
                      onChange={setParams}
                      keyPlaceholder="parameter_name"
                      valuePlaceholder="value"
                      title="Query Parameters"
                    />
                  )}

                  {activeTab === 'headers' && (
                    <KeyValueEditor
                      items={headers}
                      onChange={setHeaders}
                      keyPlaceholder="Header-Name"
                      valuePlaceholder="value"
                      title="Request Headers"
                    />
                  )}

                  {activeTab === 'body' && (
                    <BodyEditor
                      bodyType={bodyType}
                      body={body}
                      onBodyTypeChange={setBodyType}
                      onBodyChange={setBody}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Response Viewer Section */}
            <ResponseViewer
              response={response}
              batchResponse={batchResponse}
              requestCount={requestCount}
              isLoading={isSending}
            />
          </>
        )}
      </main>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Footer */}
      <footer className="footer">
        API Workbench &bull; Practical Full-Stack Developer Tooling (React + FastAPI)
      </footer>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
        <p className="auth-loading-text">Loading API Workbench...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <WorkbenchDashboard />;
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
