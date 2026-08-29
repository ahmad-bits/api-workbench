import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { KeyValueEditor } from './components/KeyValueEditor';
import { BodyEditor } from './components/BodyEditor';
import { ResponseViewer } from './components/ResponseViewer';
import type {
  HttpMethod,
  BodyType,
  KeyValuePair,
  WorkbenchRequest,
  WorkbenchResponse,
  QuickPreset,
} from './types/workbench';

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
      { id: 'h2', key: 'X-API-Workbench', value: 'v0.1.0', enabled: true },
    ],
    bodyType: 'json',
    body: JSON.stringify(
      {
        message: 'Hello from API Workbench!',
        timestamp: new Date().toISOString(),
        developer: 'Internship Portfolio',
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

export function App() {
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

  // Execution & Response state
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<WorkbenchResponse | null>(null);

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
    if (preset.bodyType && preset.bodyType !== 'none') {
      setActiveTab('body');
    } else if (preset.params && preset.params.length > 0) {
      setActiveTab('params');
    } else {
      setActiveTab('headers');
    }
  };

  // Dispatch HTTP request
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
    };

    try {
      const resp = await api.dispatchHttpRequest(req);
      setResponse(resp);
    } catch (err: any) {
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
        <div className="brand-wrapper">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="brand-title">API Workbench</span>
          <span className="badge-tag">v0.1.0-alpha</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                FastAPI Proxy Ready {backendLatency !== null && `(${backendLatency}ms)`}
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
          {/* Method + URL + Send Input Row */}
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
              placeholder="https://api.example.com/v1/resource"
              className="url-input"
            />

            <button
              type="button"
              className="btn-send"
              onClick={handleSendRequest}
              disabled={isSending || !url.trim()}
            >
              {isSending ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Send</span>
                </>
              )}
            </button>
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
        <ResponseViewer response={response} isLoading={isSending} />
      </main>

      {/* Footer */}
      <footer className="footer">
        API Workbench &bull; Practical Full-Stack Developer Tooling (React + FastAPI)
      </footer>
    </div>
  );
}

export default App;
