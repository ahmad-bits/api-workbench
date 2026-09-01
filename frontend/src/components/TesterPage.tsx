import { useState, useRef, useEffect } from 'react';
import { useWorkbench } from '../context/WorkbenchContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyValueEditor } from './KeyValueEditor';
import { BodyEditor } from './BodyEditor';
import { ResponseViewer } from './ResponseViewer';
import { UserNav } from './auth/UserNav';
import { LandingFooter } from './landing/LandingFooter';

export function TesterPage() {
  const wb = useWorkbench();
  const navigate = useNavigate();
  const location = useLocation();

  const [runsDropdownOpen, setRunsDropdownOpen] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const runsDropdownRef = useRef<HTMLDivElement>(null);
  const methodDropdownRef = useRef<HTMLDivElement>(null);
  const responseSectionRef = useRef<HTMLElement>(null);

  // Sync activeTab and scroll state with URL route changes
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/headers')) {
      wb.setActiveTab('headers');
    } else if (path.endsWith('/body')) {
      wb.setActiveTab('body');
    } else if (path.endsWith('/auth')) {
      wb.setActiveTab('auth');
    } else if (path.endsWith('/params')) {
      wb.setActiveTab('params');
    } else if (path.endsWith('/response')) {
      setTimeout(() => {
        responseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (runsDropdownRef.current && !runsDropdownRef.current.contains(event.target as Node)) {
        setRunsDropdownOpen(false);
      }
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setMethodDropdownOpen(false);
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
    { value: 100, label: '100 (Benchmark)' },
  ];

  const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const handleTabClick = (tab: 'params' | 'headers' | 'body' | 'auth') => {
    wb.setActiveTab(tab);
    navigate(`/api-tester/${tab}`);
  };

  const handleSend = async () => {
    navigate('/api-tester/response');
    await wb.handleSendRequest();
  };

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

      {/* Natural Vertical Flow: Request Bar -> Config -> Response */}
      <div className="wb-tester-workspace">
        {/* 1. UNIFIED REQUEST BAR: Method ▾ | URL Input | Runs (1x) | Send ✈ */}
        <div className="wb-unified-request-bar">
          {/* Modern Custom Method Selector */}
          <div className="wb-method-custom-dropdown-wrap" ref={methodDropdownRef}>
            <button
              type="button"
              className={`wb-method-custom-trigger ${methodDropdownOpen ? 'open' : ''}`}
              onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
              title="Select HTTP Method"
            >
              <span className="wb-method-badge-text">{wb.method}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`wb-method-chevron ${methodDropdownOpen ? 'rotated' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {methodDropdownOpen && (
              <div className="wb-method-custom-menu">
                {methodOptions.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`wb-method-custom-option ${wb.method === method ? 'selected' : ''}`}
                    onClick={() => {
                      wb.setMethod(method as any);
                      setMethodDropdownOpen(false);
                    }}
                  >
                    <span className="wb-method-opt-tag">{method}</span>
                    {wb.method === method && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="wb-method-check-icon">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="wb-url-input-wrap">
            <input
              type="text"
              value={wb.url}
              onChange={(e) => wb.setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="https://api.example.com/data"
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
                <span>{runOptions.find((o) => o.value === wb.requestCount)?.label || `${wb.requestCount} (Benchmark)`}</span>
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

          {/* Send Action Button */}
          <button
            type="button"
            className={`wb-btn-send-req ${wb.requestCount > 1 ? 'bench' : ''}`}
            onClick={handleSend}
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

        {/* 2. REQUEST CONFIGURATION CARD (Expands naturally with content) */}
        <section className="wb-request-config-card">
          <div className="wb-config-tabs-bar">
            <button
              type="button"
              className={`wb-config-tab ${wb.activeTab === 'params' ? 'active' : ''}`}
              onClick={() => handleTabClick('params')}
            >
              <span>Params</span>
              {wb.enabledParamsCount > 0 && <span className="wb-tab-badge">{wb.enabledParamsCount}</span>}
            </button>

            <button
              type="button"
              className={`wb-config-tab ${wb.activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => handleTabClick('headers')}
            >
              <span>Headers</span>
              {wb.enabledHeadersCount > 0 && <span className="wb-tab-badge">{wb.enabledHeadersCount}</span>}
            </button>

            <button
              type="button"
              className={`wb-config-tab ${wb.activeTab === 'body' ? 'active' : ''}`}
              onClick={() => handleTabClick('body')}
            >
              <span>Body</span>
              <span className="wb-tab-badge">JSON</span>
            </button>

            <button
              type="button"
              className={`wb-config-tab ${wb.activeTab === 'auth' ? 'active' : ''}`}
              onClick={() => handleTabClick('auth')}
            >
              <span>Auth</span>
              {wb.enabledAuthCount > 0 && <span className="wb-tab-badge">{wb.enabledAuthCount}</span>}
            </button>
          </div>

          <div className="wb-config-card-body">
            {wb.activeTab === 'params' && (
              <KeyValueEditor
                items={wb.params}
                onChange={wb.setParams}
                keyLabel="Name"
                valueLabel="Value"
                keyPlaceholder="Parameter name (e.g. city)"
                valuePlaceholder="Parameter value (e.g. Lahore)"
                addLabel="Add Parameter"
                emptyMessage="No query parameters configured for this request."
              />
            )}

            {wb.activeTab === 'headers' && (
              <KeyValueEditor
                items={wb.headers}
                onChange={wb.setHeaders}
                keyLabel="Header"
                valueLabel="Value"
                keyPlaceholder="Header name (e.g. Accept)"
                valuePlaceholder="Header value (e.g. application/json)"
                addLabel="Add Header"
                emptyMessage="No request headers configured."
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
                items={wb.authHeaders}
                onChange={wb.setAuthHeaders}
                keyLabel="Key"
                valueLabel="Value"
                keyPlaceholder="Header name (e.g. Authorization, X-API-Key)"
                valuePlaceholder="Header / Token value"
                addLabel="Add Row"
                emptyMessage="No authentication entries configured."
              />
            )}
          </div>
        </section>

        {/* 3. RESPONSE SECTION CARD (Expands naturally downwards) */}
        <section className="wb-response-section-card" ref={responseSectionRef}>
          <ResponseViewer
            response={wb.response}
            batchResponse={wb.batchResponse}
            requestCount={wb.requestCount}
            isLoading={wb.isSending}
            onSaveClick={() => wb.setSaveApiModalOpen(true)}
          />
        </section>
      </div>

      {/* 4. Website Footer (Consistent with rest of website) */}
      <LandingFooter onNavigateSection={(sec) => navigate('/#' + sec)} />
    </>
  );
}
