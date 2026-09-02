import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LandingHeader } from '../landing/LandingHeader';
import { LandingFooter } from '../landing/LandingFooter';
import '../landing/landing.css';
import './docs.css';

type DocSectionId =
  | 'getting-started'
  | 'api-tester'
  | 'mock-api'
  | 'my-apis'
  | 'authentication'
  | 'settings';

interface DocSectionMeta {
  id: DocSectionId;
  title: string;
  category: string;
}

const DOC_SECTIONS: DocSectionMeta[] = [
  { id: 'getting-started', title: 'Getting Started', category: 'Overview' },
  { id: 'api-tester', title: 'API Tester', category: 'Core Tools' },
  { id: 'mock-api', title: 'Mock API Engine', category: 'Core Tools' },
  { id: 'my-apis', title: 'My APIs & Workspaces', category: 'Core Tools' },
  { id: 'authentication', title: 'Authentication', category: 'Account & Security' },
  { id: 'settings', title: 'Account Settings', category: 'Account & Security' },
];

export const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isScrollingRef = useRef(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const getSectionFromHash = (): DocSectionId => {
    const hash = location.hash.replace('#', '').toLowerCase();
    const found = DOC_SECTIONS.find((s) => s.id === hash);
    return found ? found.id : 'getting-started';
  };

  const [activeSection, setActiveSection] = useState<DocSectionId>(getSectionFromHash);

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      if (isScrollingRef.current) return;

      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        const topEntry = visibleEntries[0];
        const sectionId = topEntry.target.id as DocSectionId;
        if (sectionId) {
          setActiveSection(sectionId);
          const meta = DOC_SECTIONS.find((s) => s.id === sectionId);
          document.title = `${meta?.title || 'Documentation'} — API Workbench`;
          window.history.replaceState(null, '', `#${sectionId}`);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-10% 0px -65% 0px',
      threshold: 0,
    });

    DOC_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const initialId = location.hash.replace('#', '');
    if (initialId) {
      const el = document.getElementById(initialId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, []);

  const handleSelectSection = (id: DocSectionId) => {
    setActiveSection(id);
    setMobileDrawerOpen(false);
    const meta = DOC_SECTIONS.find((s) => s.id === id);
    document.title = `${meta?.title || 'Documentation'} — API Workbench`;
    window.history.replaceState(null, '', `#${id}`);

    const el = document.getElementById(id);
    if (el) {
      isScrollingRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);
    }
  };

  const handleNavToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const currentMeta = DOC_SECTIONS.find((s) => s.id === activeSection) || DOC_SECTIONS[0];

  const renderNavGroup = () => (
    <>
      <div className="wb-docs-nav-group">
        <div className="wb-docs-nav-heading">Overview</div>
        <ul className="wb-docs-nav-list">
          <li className="wb-docs-nav-item">
            <button
              type="button"
              className={`wb-docs-nav-button ${activeSection === 'getting-started' ? 'active' : ''}`}
              onClick={() => handleSelectSection('getting-started')}
            >
              <span>Getting Started</span>
            </button>
          </li>
        </ul>
      </div>

      <div className="wb-docs-nav-group">
        <div className="wb-docs-nav-heading">Core Tools</div>
        <ul className="wb-docs-nav-list">
          <li className="wb-docs-nav-item">
            <button
              type="button"
              className={`wb-docs-nav-button ${activeSection === 'api-tester' ? 'active' : ''}`}
              onClick={() => handleSelectSection('api-tester')}
            >
              <span>API Tester</span>
            </button>
          </li>
          <li className="wb-docs-nav-item">
            <button
              type="button"
              className={`wb-docs-nav-button ${activeSection === 'mock-api' ? 'active' : ''}`}
              onClick={() => handleSelectSection('mock-api')}
            >
              <span>Mock API Engine</span>
            </button>
          </li>
          <li className="wb-docs-nav-item">
            <button
              type="button"
              className={`wb-docs-nav-button ${activeSection === 'my-apis' ? 'active' : ''}`}
              onClick={() => handleSelectSection('my-apis')}
            >
              <span>My APIs &amp; Workspaces</span>
            </button>
          </li>
        </ul>
      </div>

      <div className="wb-docs-nav-group">
        <div className="wb-docs-nav-heading">Account &amp; Security</div>
        <ul className="wb-docs-nav-list">
          <li className="wb-docs-nav-item">
            <button
              type="button"
              className={`wb-docs-nav-button ${activeSection === 'authentication' ? 'active' : ''}`}
              onClick={() => handleSelectSection('authentication')}
            >
              <span>Authentication</span>
            </button>
          </li>
          <li className="wb-docs-nav-item">
            <button
              type="button"
              className={`wb-docs-nav-button ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => handleSelectSection('settings')}
            >
              <span>Account Settings</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <div className="wb-landing-root wb-docs-root">
      <LandingHeader
        onLoginClick={() => navigate('/login')}
        onSignUpClick={() => navigate('/register')}
        onWorkbenchClick={() => navigate('/api-tester')}
        onNavigateSection={(sec) => navigate('/#' + sec)}
        isAuthenticated={isAuthenticated}
      />

      <div className={`wb-docs-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className="wb-docs-sidebar" aria-label="Documentation Navigation">
          <div className="wb-docs-sidebar-header">
            <button
              type="button"
              className="wb-docs-nav-toggle-btn"
              onClick={handleNavToggle}
              title="Collapse sidebar"
              aria-label="Collapse documentation sidebar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="wb-hamburger-svg"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="wb-docs-sidebar-title">Documentation</span>
          </div>
          {renderNavGroup()}
        </aside>

        <div className="wb-docs-main-col">
          <div className="wb-docs-top-bar">
            <div className="wb-docs-top-bar-left">
              {(isSidebarCollapsed || typeof window !== 'undefined' && window.innerWidth <= 768) && (
                <button
                  type="button"
                  className="wb-docs-nav-toggle-btn"
                  onClick={handleNavToggle}
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Open menu'}
                  aria-label="Toggle documentation navigation"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="wb-hamburger-svg"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}

              <nav className="wb-docs-breadcrumb" aria-label="Breadcrumb">
                <button
                  type="button"
                  className="wb-docs-crumb-link"
                  onClick={() => navigate('/')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span>Home</span>
                </button>
                <span className="wb-docs-crumb-sep">/</span>
                <span>Documentation</span>
                <span className="wb-docs-crumb-sep">/</span>
                <span className="wb-docs-crumb-current">{currentMeta.title}</span>
              </nav>
            </div>

            <div className="wb-docs-mobile-select-wrap">
              <select
                className="wb-docs-mobile-select"
                value={activeSection}
                onChange={(e) => handleSelectSection(e.target.value as DocSectionId)}
                aria-label="Select documentation section"
              >
                {DOC_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <main className="wb-docs-content-pane">
            <article className="wb-docs-article">
              <section id="getting-started" className="wb-docs-section-block">
                <GettingStartedDoc />
              </section>

              <section id="api-tester" className="wb-docs-section-block">
                <ApiTesterDoc />
              </section>

              <section id="mock-api" className="wb-docs-section-block">
                <MockApiDoc />
              </section>

              <section id="my-apis" className="wb-docs-section-block">
                <MyApisDoc />
              </section>

              <section id="authentication" className="wb-docs-section-block">
                <AuthenticationDoc />
              </section>

              <section id="settings" className="wb-docs-section-block">
                <SettingsDoc />
              </section>
            </article>
          </main>
        </div>
      </div>

      {mobileDrawerOpen && (
        <div className="wb-docs-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div className="wb-docs-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="wb-docs-drawer-header">
              <span className="wb-docs-drawer-title">Documentation</span>
              <button
                type="button"
                className="wb-docs-drawer-close"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {renderNavGroup()}
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  );
};

const GettingStartedDoc: React.FC = () => (
  <div>
    <h1>Getting Started</h1>
    <p>
      API Workbench is a browser tool for testing, benchmarking, and mocking HTTP APIs.
    </p>

    <h2>Core Features</h2>
    <ul>
      <li><strong>API Tester:</strong> Send requests and benchmark performance with latency stats.</li>
      <li><strong>Mock APIs:</strong> Create public mock endpoints with custom responses, auth, and delay.</li>
      <li><strong>My APIs:</strong> Organize saved requests into workspaces.</li>
      <li><strong>Settings:</strong> Manage profile details, update password, or delete your account.</li>
    </ul>

    <h2>Quick Walkthrough</h2>
    <ol>
      <li><strong>Sign Up:</strong> Register with your name, username, email, and password, then verify the 6-digit email code.</li>
      <li><strong>Send a Request:</strong> In <strong>API Tester</strong>, select a method, enter a URL, and click <strong>Send</strong>.</li>
      <li><strong>Save an API:</strong> Click <strong>Save API</strong> in the response panel to store the request in a workspace.</li>
      <li><strong>Create a Mock:</strong> In <strong>Mock APIs</strong>, click <strong>+ New Mock</strong>, set the route, status, and JSON body, then save.</li>
    </ol>
  </div>
);

const ApiTesterDoc: React.FC = () => (
  <div>
    <h1>API Tester</h1>
    <p>
      Execute and benchmark HTTP requests.
    </p>

    <h2>Request Setup</h2>
    <ul>
      <li><strong>Method:</strong> GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.</li>
      <li><strong>URL &amp; Params:</strong> Enter the endpoint URL. Query parameters sync with the <strong>Params</strong> tab where they can be edited or toggled.</li>
      <li><strong>Headers:</strong> Add key-value headers with checkboxes to enable or disable them.</li>
      <li><strong>Body:</strong> JSON only. Enter the payload directly in the editor.</li>
      <li><strong>Auth:</strong> Add authentication headers as key-value pairs (such as <code>Authorization</code> or <code>X-API-Key</code>).</li>
    </ul>

    <h2>Sending &amp; Benchmarking</h2>
    <ul>
      <li><strong>Single Request:</strong> Set <strong>Runs</strong> to <code>1 (Single)</code> and click <strong>Send</strong>.</li>
      <li><strong>Benchmark:</strong> Select <code>5</code>, <code>10</code>, <code>25</code>, <code>50</code>, or <code>100</code> runs and click <strong>Run (&lt;N&gt;x)</strong> to measure performance over multiple requests.</li>
    </ul>

    <h2>Inspecting Responses</h2>
    <ul>
      <li><strong>Single Run:</strong> View status code, latency (ms), response size, formatted JSON (Pretty), raw body, and response headers. Use <strong>Copy</strong>, <strong>Download</strong>, or <strong>Save API</strong> as needed.</li>
      <li><strong>Benchmark Results:</strong> View overall stats (total runs, success rate, average latency, min/max time), status breakdown, and the detailed <strong>Runs</strong> table.</li>
    </ul>
  </div>
);

const MockApiDoc: React.FC = () => (
  <div>
    <h1>Mock API Engine</h1>
    <p>
      Create and host simulated HTTP endpoints that can be called publicly.
    </p>

    <h2>Creating a Mock</h2>
    <ol>
      <li>In <strong>Mock APIs</strong>, click <strong>+ New Mock</strong>.</li>
      <li>
        Fill in the endpoint fields:
        <ul>
          <li><strong>Method:</strong> GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.</li>
          <li><strong>Path:</strong> Route path (e.g. <code>/api/v1/users</code>).</li>
          <li><strong>Status Code:</strong> Response status code (e.g. 200, 201, 400, 404).</li>
          <li><strong>Response Delay:</strong> Millisecond delay before responding (default is 0 ms).</li>
          <li>
            <strong>Authentication:</strong> Choose <code>None</code>, <code>API Key</code>, or <code>Bearer Token</code>.
            <ul>
              <li>API Key checks the specified header and value.</li>
              <li>Bearer Token expects <code>Authorization: Bearer &lt;token&gt;</code>.</li>
              <li>Missing or incorrect credentials return <code>401 Unauthorized</code>.</li>
            </ul>
          </li>
          <li><strong>Response Headers:</strong> Custom headers to return.</li>
          <li><strong>Response Body:</strong> JSON payload returned by the mock.</li>
        </ul>
      </li>
      <li>Click <strong>Create Endpoint</strong> to save.</li>
    </ol>

    <h2>Using &amp; Managing Mocks</h2>
    <ul>
      <li><strong>Public URL:</strong> Each mock gets a public URL you can copy and call from any client.</li>
      <li><strong>Call Counter:</strong> Tracks total requests received.</li>
      <li><strong>Test:</strong> Click <strong>Test</strong> to load the endpoint and auth into the API Tester.</li>
      <li><strong>Edit / Delete:</strong> Update mock settings or remove the endpoint.</li>
    </ul>
  </div>
);

const MyApisDoc: React.FC = () => (
  <div>
    <h1>My APIs &amp; Workspaces</h1>
    <p>
      Organize and save frequently used API requests into workspaces.
    </p>

    <h2>Workspaces</h2>
    <ul>
      <li><strong>Create Workspace:</strong> Click <strong>+ New Workspace</strong> and enter a name.</li>
      <li><strong>Workspace View:</strong> Select a workspace card to view its saved APIs, or switch to <strong>All</strong> to see all requests.</li>
      <li><strong>Delete Workspace:</strong> Removes the workspace and its contained APIs.</li>
    </ul>

    <h2>Saving &amp; Managing APIs</h2>
    <ul>
      <li><strong>Save Endpoint:</strong> Click <strong>Save API</strong> from the API Tester response panel, or click <strong>+ Add API</strong> in My APIs.</li>
      <li><strong>Fields:</strong> Set API Name, Endpoint URL, Workspace, and optional API Key (masked in UI).</li>
      <li><strong>Actions:</strong> Click <strong>Open in Tester</strong> to load the request, or use <strong>Edit</strong> / <strong>Delete</strong> to manage entries.</li>
    </ul>
  </div>
);

const AuthenticationDoc: React.FC = () => (
  <div>
    <h1>Authentication</h1>
    <p>
      Account management, email verification, and password recovery.
    </p>

    <h2>Sign Up &amp; Email Verification</h2>
    <ol>
      <li>Click <strong>Sign Up</strong>.</li>
      <li>Enter your Name, Username, Email, and Password.</li>
      <li>Submit and enter the 6-digit verification code sent to your email.</li>
    </ol>

    <h2>Login</h2>
    <ol>
      <li>Click <strong>Login</strong>.</li>
      <li>Enter your Username or Email along with your Password.</li>
      <li>Click <strong>Sign In</strong>.</li>
    </ol>

    <h2>Password Reset</h2>
    <ol>
      <li>Click <strong>Forgot password?</strong> on the login screen.</li>
      <li>Enter your email or username to request a reset code.</li>
      <li>Enter the 6-digit email code and set your new password.</li>
    </ol>
  </div>
);

const SettingsDoc: React.FC = () => (
  <div>
    <h1>Account Settings</h1>
    <p>
      Manage profile details, update your password, or delete your account.
    </p>

    <h2>Profile Information</h2>
    <ul>
      <li><strong>Full Name:</strong> Update your display name.</li>
      <li><strong>Username:</strong> Change your handle (this updates the prefix for your mock endpoint URLs).</li>
      <li><strong>Email Address:</strong> Read-only verified email.</li>
    </ul>
    <p>Click <strong>Save Changes</strong> to apply updates.</p>

    <h2>Changing Password</h2>
    <ol>
      <li>Enter your <strong>Current Password</strong>.</li>
      <li>Enter your <strong>New Password</strong> (minimum 6 characters) and confirm it.</li>
      <li>Click <strong>Update Password</strong>.</li>
    </ol>

    <h2>Account Deletion</h2>
    <p>Click <strong>Delete Account</strong> to permanently erase your account:</p>
    <ul>
      <li>Erases your profile and login credentials.</li>
      <li>Deletes all workspaces, saved APIs, and mock endpoints.</li>
      <li>Existing mock URLs will return <code>404 Not Found</code>.</li>
    </ul>
  </div>
);

export default DocsPage;
