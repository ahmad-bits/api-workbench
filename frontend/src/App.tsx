import { useState, useEffect, useCallback } from 'react';
import './components/workbench.css';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { UserNav } from './components/auth/UserNav';
import { KeyValueEditor } from './components/KeyValueEditor';
import { BodyEditor } from './components/BodyEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { MockManager } from './components/mock/MockManager';
import { SavedApiManager } from './components/saved/SavedApiManager';
import { SaveApiModal } from './components/saved/SaveApiModal';
import { LandingPage } from './components/landing/LandingPage';
import type {
  HttpMethod,
  BodyType,
  KeyValuePair,
  WorkbenchRequest,
  WorkbenchResponse,
  BatchWorkbenchResponse,
} from './types/workbench';
import type { MockEndpoint } from './types/mock';

function WorkbenchDashboard({ onGoToLanding }: { onGoToLanding?: () => void }) {
  const { user } = useAuth();

  // Navigation View: 'workbench' | 'saved-apis' | 'mock-server'
  const [currentView, setCurrentView] = useState<'workbench' | 'saved-apis' | 'mock-server'>('workbench');

  // Saved APIs & Save Modal State
  const [saveApiModalOpen, setSaveApiModalOpen] = useState<boolean>(false);
  const [savedApiCount, setSavedApiCount] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Backend health state
  const [backendStatus, setBackendStatus] = useState<'loading' | 'healthy' | 'error'>('loading');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  // Request Builder state (Clean default GET endpoint)
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/posts/1');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: 'h_default', key: 'Accept', value: 'application/json', description: '', enabled: true },
  ]);
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [body, setBody] = useState<string>('');
  const [timeoutSeconds] = useState<number>(30);
  const [requestCount, setRequestCount] = useState<number>(1);

  // Execution & Response state
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<WorkbenchResponse | null>(null);
  const [batchResponse, setBatchResponse] = useState<BatchWorkbenchResponse | null>(null);

  // Reset to a new clean request
  const handleNewRequest = () => {
    setUrl('');
    setMethod('GET');
    setParams([]);
    setHeaders([{ id: `h_${Date.now()}`, key: 'Accept', value: 'application/json', description: '', enabled: true }]);
    setBodyType('none');
    setBody('');
    setRequestCount(1);
    setResponse(null);
    setBatchResponse(null);
    setActiveTab('params');
    setCurrentView('workbench');
  };

  // Helper to extract an API Key from current headers or query params
  const detectCurrentApiKey = (): string | null => {
    for (const h of headers) {
      if (h.enabled && h.key.trim() && h.value.trim()) {
        const k = h.key.trim().toLowerCase();
        if (
          k === 'x-api-key' ||
          k === 'api-key' ||
          k === 'apikey' ||
          k === 'x-api-token' ||
          k === 'api_key' ||
          k === 'x-auth-token'
        ) {
          return h.value.trim();
        }
        if (k === 'authorization') {
          const val = h.value.trim();
          if (val.toLowerCase().startsWith('bearer ')) {
            return val.slice(7).trim();
          }
          return val;
        }
      }
    }
    for (const p of params) {
      if (p.enabled && p.key.trim() && p.value.trim()) {
        const k = p.key.trim().toLowerCase();
        if (k === 'api_key' || k === 'apikey' || k === 'key' || k === 'token' || k === 'auth') {
          return p.value.trim();
        }
      }
    }
    return null;
  };

  // Open a saved API inside Workbench Tester
  const handleOpenSavedApi = async (apiId: string) => {
    try {
      const openData = await api.getSavedApiToOpen(apiId);
      setUrl(openData.url);
      setMethod('GET');
      setRequestCount(1);
      setResponse(null);
      setBatchResponse(null);

      if (openData.has_api_key && openData.api_key) {
        const existingKeyIndex = headers.findIndex((h) => {
          const k = h.key.trim().toLowerCase();
          return k === 'x-api-key' || k === 'api-key' || k === 'apikey';
        });

        if (existingKeyIndex >= 0) {
          const updated = [...headers];
          updated[existingKeyIndex] = {
            ...updated[existingKeyIndex],
            value: openData.api_key,
            enabled: true,
          };
          setHeaders(updated);
        } else {
          setHeaders([
            ...headers,
            {
              id: `h_key_${Date.now()}`,
              key: 'X-API-Key',
              value: openData.api_key,
              enabled: true,
            },
          ]);
        }
        setActiveTab('headers');
      }

      setCurrentView('workbench');
      setSaveToast(`Loaded "${openData.name}" into API Tester.`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to open saved API');
    }
  };

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
    const fullMockUrl = `http://127.0.0.1:8000/mock/${mock.path.startsWith('/') ? mock.path.slice(1) : mock.path}`;
    setUrl(fullMockUrl);
    setMethod(mock.method);
    setParams([]);
    setHeaders([{ id: 'h_default', key: 'Accept', value: 'application/json', enabled: true }]);
    setBodyType('none');
    setBody('');
    setRequestCount(1);
    setResponse(null);
    setBatchResponse(null);
    setCurrentView('workbench');
    setActiveTab('params');
    setSaveToast(`Configured Mock Endpoint "${mock.name}" in API Tester.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Execute request
  const handleSendRequest = async () => {
    if (!url.trim() || isSending) return;

    setIsSending(true);
    setResponse(null);
    setBatchResponse(null);

    const payload: WorkbenchRequest = {
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
      if (requestCount === 1) {
        const res = await api.dispatchHttpRequest(payload);
        setResponse(res);
      } else {
        const batchRes = await api.dispatchBenchmarkRequest(payload);
        setBatchResponse(batchRes);
      }
    } catch (err: any) {
      setResponse({
        statusCode: 0,
        statusText: 'Connection Error',
        headers: {},
        data: null,
        isJson: false,
        sizeBytes: 0,
        elapsedMs: 0,
        error: err.message || 'Network request failed. Ensure target endpoint is reachable.',
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

  // Keyboard shortcut: Ctrl+Enter (or Cmd+Enter) anywhere in workspace to Send
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendRequest();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  const enabledParamsCount = params.filter((p) => p.enabled && p.key.trim()).length;
  const enabledHeadersCount = headers.filter((h) => h.enabled && h.key.trim()).length;

  return (
    <div className="wb-app-shell">
      {/* 1. Left Professional Developer Sidebar */}
      <aside className="wb-app-sidebar">
        <div className="wb-sidebar-top-section">
          {/* Workspace Title & Brand */}
          <div className="wb-workspace-header">
            <div className="wb-workspace-logo-dot">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#1860ec" />
                <path d="M12 5L13.5 10.5L19 12L13.5 13.5L12 19L10.5 13.5L5 12L10.5 10.5L12 5Z" fill="white" />
              </svg>
            </div>
            <div className="wb-workspace-meta">
              <span className="wb-workspace-title">
                {user?.name ? `${user.name} Workspace` : 'API Workbench'}
              </span>
              <span className="wb-workspace-badge-plan">Active Workspace</span>
            </div>
          </div>

          {/* New Request Button */}
          <button
            type="button"
            className="wb-sidebar-btn-new"
            onClick={handleNewRequest}
            title="Start a new clean API request"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Request</span>
          </button>

          {/* Sidebar Nav Items */}
          <nav className="wb-sidebar-nav">
            <button
              type="button"
              className={`wb-sidebar-item ${currentView === 'workbench' ? 'active' : ''}`}
              onClick={() => setCurrentView('workbench')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>API Tester</span>
            </button>

            <button
              type="button"
              className={`wb-sidebar-item ${currentView === 'saved-apis' ? 'active' : ''}`}
              onClick={() => setCurrentView('saved-apis')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>My APIs</span>
              {savedApiCount > 0 && <span className="wb-sidebar-count">{savedApiCount}</span>}
            </button>

            <button
              type="button"
              className={`wb-sidebar-item ${currentView === 'mock-server' ? 'active' : ''}`}
              onClick={() => setCurrentView('mock-server')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Mock Server</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Section */}
        <div className="wb-sidebar-bottom-section">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="wb-sidebar-footer-link"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Swagger API Docs</span>
          </a>

          <button
            type="button"
            className="wb-sidebar-footer-link"
            onClick={() => setProfileModalOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Account Settings</span>
          </button>

          {onGoToLanding && (
            <button
              type="button"
              className="wb-sidebar-footer-link"
              onClick={onGoToLanding}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Landing Page</span>
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Workspace */}
      <main className="wb-app-main">
        {/* Top Header Bar */}
        <header className="wb-app-topbar">
          <div className="wb-topbar-title-block">
            <h1 className="wb-topbar-heading">
              {currentView === 'workbench'
                ? 'API Tester'
                : currentView === 'saved-apis'
                ? 'My APIs'
                : 'Mock Server'}
            </h1>
            <span className="wb-topbar-tagline">
              {currentView === 'workbench'
                ? 'HTTP Request & Benchmark Testing Environment'
                : currentView === 'saved-apis'
                ? 'Manage and load saved endpoints'
                : 'Simulate custom mock APIs with dynamic delays'}
            </span>
          </div>

          <div className="wb-topbar-actions">
            {/* Live Backend Connection Indicator */}
            <div
              className={`wb-health-pill ${backendStatus === 'error' ? 'error' : ''}`}
              onClick={checkBackend}
              title="Click to check backend status"
            >
              <span className="wb-health-dot" />
              <span>
                {backendStatus === 'healthy'
                  ? `FastAPI Online ${backendLatency !== null ? `(${backendLatency}ms)` : ''}`
                  : backendStatus === 'loading'
                  ? 'Connecting...'
                  : 'FastAPI Offline'}
              </span>
            </div>

            {/* User Profile & Account Dropdown */}
            <UserNav onOpenProfileModal={() => setProfileModalOpen(true)} />
          </div>
        </header>

        {/* Saved APIs View */}
        {currentView === 'saved-apis' && (
          <div className="wb-view-container">
            <SavedApiManager
              onOpenInTester={handleOpenSavedApi}
              onCountChange={setSavedApiCount}
            />
          </div>
        )}

        {/* Mock Server View */}
        {currentView === 'mock-server' && (
          <div className="wb-view-container">
            <MockManager onTestInWorkbench={handleTestInWorkbench} />
          </div>
        )}

        {/* API Tester View (Unified Request Bar + Split Workspace) */}
        {currentView === 'workbench' && (
          <div className="wb-tester-workspace">
            {saveToast && (
              <div className="wb-toast-banner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{saveToast}</span>
              </div>
            )}

            {/* UNIFIED REQUEST BAR: Method ▾ | URL Input | Runs (1x) | Save API | Send ✈ */}
            <div className="wb-unified-request-bar">
              {/* Method Dropdown */}
              <div className="wb-method-select-wrap">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className={`wb-method-native-select ${method.toLowerCase()}`}
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
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDownUrl}
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
                  value={requestCount}
                  onChange={(e) => handleSetCount(parseInt(e.target.value, 10))}
                  className="wb-runs-select"
                  disabled={isSending}
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
                onClick={() => setSaveApiModalOpen(true)}
                disabled={!url.trim()}
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
                className={`wb-btn-send-req ${requestCount > 1 ? 'bench' : ''}`}
                onClick={handleSendRequest}
                disabled={isSending || !url.trim()}
              >
                {isSending ? (
                  <>
                    <div className="wb-btn-spinner" />
                    <span>{requestCount > 1 ? `Executing ${requestCount}x...` : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>{requestCount > 1 ? `Run (${requestCount}x)` : 'Send'}</span>
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
                    className={`wb-config-tab ${activeTab === 'params' ? 'active' : ''}`}
                    onClick={() => setActiveTab('params')}
                  >
                    Params
                    {enabledParamsCount > 0 && <span className="wb-tab-badge">{enabledParamsCount}</span>}
                  </button>

                  <button
                    type="button"
                    className={`wb-config-tab ${activeTab === 'headers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('headers')}
                  >
                    Headers
                    {enabledHeadersCount > 0 && <span className="wb-tab-badge">{enabledHeadersCount}</span>}
                  </button>

                  <button
                    type="button"
                    className={`wb-config-tab ${activeTab === 'body' ? 'active' : ''}`}
                    onClick={() => setActiveTab('body')}
                  >
                    Body
                    {bodyType !== 'none' && <span className="wb-tab-badge">{bodyType}</span>}
                  </button>

                  <button
                    type="button"
                    className={`wb-config-tab ${activeTab === 'auth' ? 'active' : ''}`}
                    onClick={() => setActiveTab('auth')}
                  >
                    Auth
                  </button>
                </div>

                {/* Subtab Contents */}
                <div className="wb-config-body-viewport">
                  {activeTab === 'params' && (
                    <KeyValueEditor
                      items={params}
                      onChange={setParams}
                      keyPlaceholder="Parameter name"
                      valuePlaceholder="Value"
                      descPlaceholder="Description (Optional)"
                    />
                  )}

                  {activeTab === 'headers' && (
                    <KeyValueEditor
                      items={headers}
                      onChange={setHeaders}
                      keyPlaceholder="Header name"
                      valuePlaceholder="Header value"
                      descPlaceholder="Description (Optional)"
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

                  {activeTab === 'auth' && (
                    <KeyValueEditor
                      items={headers.filter(
                        (h) =>
                          h.key.toLowerCase().includes('auth') ||
                          h.key.toLowerCase().includes('key') ||
                          h.key.toLowerCase().includes('token')
                      )}
                      onChange={(authItems) => {
                        const nonAuth = headers.filter(
                          (h) =>
                            !h.key.toLowerCase().includes('auth') &&
                            !h.key.toLowerCase().includes('key') &&
                            !h.key.toLowerCase().includes('token')
                        );
                        setHeaders([...nonAuth, ...authItems]);
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
                  response={response}
                  batchResponse={batchResponse}
                  requestCount={requestCount}
                  isLoading={isSending}
                  onSaveClick={() => setSaveApiModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Save API Modal */}
      <SaveApiModal
        isOpen={saveApiModalOpen}
        onClose={() => setSaveApiModalOpen(false)}
        currentUrl={url}
        detectedApiKey={detectCurrentApiKey()}
        onSaved={(saved) => {
          setSavedApiCount((prev) => prev + 1);
          setSaveToast(`API "${saved.name}" was saved successfully to My APIs!`);
          setTimeout(() => setSaveToast(null), 3500);
        }}
      />
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [appView, setAppView] = useState<'landing' | 'login' | 'register' | 'workbench'>('landing');

  // When user successfully logs in, take them to workbench
  useEffect(() => {
    if (isAuthenticated) {
      setAppView('workbench');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
        <p className="auth-loading-text">Loading API Workbench...</p>
      </div>
    );
  }

  // Unauthenticated visitor routing
  if (!isAuthenticated) {
    if (appView === 'login' || appView === 'register') {
      return (
        <AuthPage
          initialMode={appView}
          onBackToHome={() => setAppView('landing')}
        />
      );
    }

    return (
      <LandingPage
        onLoginClick={() => setAppView('login')}
        onSignUpClick={() => setAppView('register')}
        onWorkbenchClick={() => setAppView('login')}
        isAuthenticated={false}
      />
    );
  }

  // Authenticated user routing
  if (appView === 'landing') {
    return (
      <LandingPage
        onLoginClick={() => setAppView('workbench')}
        onSignUpClick={() => setAppView('workbench')}
        onWorkbenchClick={() => setAppView('workbench')}
        isAuthenticated={true}
        userName={user?.name || user?.username}
      />
    );
  }

  return <WorkbenchDashboard onGoToLanding={() => setAppView('landing')} />;
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
