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
  const { isAuthenticated, user } = useAuth();
  const isScrollingRef = useRef(false);

  // Sidebar collapse state (desktop) & drawer state (mobile)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Extract initial section from URL hash or default to 'getting-started'
  const getSectionFromHash = (): DocSectionId => {
    const hash = location.hash.replace('#', '').toLowerCase();
    const found = DOC_SECTIONS.find((s) => s.id === hash);
    return found ? found.id : 'getting-started';
  };

  const [activeSection, setActiveSection] = useState<DocSectionId>(getSectionFromHash);

  // Scroll spy to update active section in sidebar as user scrolls through documents
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

  // Initial scroll to hash if present on mount
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Top Main Header */}
      <LandingHeader
        onLoginClick={() => navigate('/login')}
        onSignUpClick={() => navigate('/register')}
        onWorkbenchClick={() => navigate('/api-tester')}
        onNavigateSection={(sec) => navigate('/#' + sec)}
        isAuthenticated={isAuthenticated}
        userName={user?.name || user?.username}
      />

      {/* Main Documentation Layout */}
      <div className={`wb-docs-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Left Sticky Sidebar (Pinned in place, contains its own toggle & title) */}
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

        {/* Right Main Column */}
        <div className="wb-docs-main-col">
          {/* Breadcrumb Top Bar */}
          <div className="wb-docs-top-bar">
            <div className="wb-docs-top-bar-left">
              {/* Show toggle button when sidebar is collapsed or on mobile */}
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

            {/* Mobile section switcher */}
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

          {/* Continuous Documentation Content */}
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

      {/* Mobile Drawer Overlay */}
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

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

/* ==========================================================================
   Document Content Components (Reflecting Actual Application Implementation)
   ========================================================================== */

const GettingStartedDoc: React.FC = () => (
  <div>
    <h1>Getting Started</h1>
    <p>
      API Workbench is a developer tool for testing, benchmarking, and mocking HTTP APIs directly in your browser.
    </p>

    <h2>Core Tools</h2>
    <ul>
      <li>
        <strong>API Tester:</strong> Send single HTTP requests or run automated benchmarks with latency and status metrics.
      </li>
      <li>
        <strong>Mock APIs:</strong> Create simulated HTTP endpoints with custom status codes, headers, and JSON responses.
      </li>
      <li>
        <strong>My APIs:</strong> Save requests and organize them into workspaces for quick access.
      </li>
      <li>
        <strong>Settings:</strong> Manage profile details, change passwords, and manage your account.
      </li>
    </ul>

    <h2>Quick Start</h2>
    <ol>
      <li>
        <strong>Sign Up:</strong> Create an account with your name, username, email, and password, then enter the 6-digit email verification code.
      </li>
      <li>
        <strong>Send a Request:</strong> Open the <strong>API Tester</strong>, choose an HTTP method, enter a URL, and click <strong>Send</strong>. Inspect the response in <strong>Pretty</strong>, <strong>Raw</strong>, or <strong>Headers</strong> view.
      </li>
      <li>
        <strong>Save an API:</strong> In the response panel, click <strong>Save API</strong>, choose a workspace, and save the request.
      </li>
      <li>
        <strong>Create a Mock:</strong> In <strong>Mock APIs</strong>, click <strong>+ New Mock</strong>, set the method, path, status code, and JSON body, then click <strong>Save Mock</strong>. Click <strong>Test</strong> to run it in the tester.
      </li>
    </ol>
  </div>
);

const ApiTesterDoc: React.FC = () => (
  <div>
    <h1>API Tester</h1>
    <p>
      The API Tester allows you to configure, execute, and benchmark HTTP requests.
    </p>

    <h2>Request Configuration</h2>
    <ul>
      <li>
        <strong>Method:</strong> Select from <code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, <code>DELETE</code>, <code>HEAD</code>, or <code>OPTIONS</code>.
      </li>
      <li>
        <strong>URL &amp; Params:</strong> Enter the endpoint URL. Query parameters sync automatically with the <strong>Params</strong> tab, where you can edit values or toggle them on and off with checkboxes.
      </li>
      <li>
        <strong>Headers:</strong> Add custom headers using key-value rows with enable/disable checkboxes.
      </li>
      <li>
        <strong>Body:</strong> Supports <strong>JSON only</strong>. Enter your JSON payload directly into the editor.
      </li>
      <li>
        <strong>Auth:</strong> Add authentication headers as key-value pairs (e.g., <code>Authorization</code> or <code>X-API-Key</code>).
      </li>
    </ul>

    <h2>Sending &amp; Benchmarking</h2>
    <ul>
      <li>
        <strong>Single Request:</strong> Set <strong>Runs</strong> to <code>1 (Single)</code> and click <strong>Send</strong>.
      </li>
      <li>
        <strong>Benchmark Mode:</strong> Set <strong>Runs</strong> to <code>5</code>, <code>10</code>, <code>25</code>, <code>50</code>, or <code>100</code> and click <strong>Run (&lt;N&gt;x)</strong> to execute sequential requests and generate performance metrics.
      </li>
    </ul>

    <h2>Inspecting Responses</h2>

    <h3>Single Request</h3>
    <ul>
      <li>
        <strong>Status &amp; Latency:</strong> Displays the HTTP status code, round-trip time in milliseconds, and payload size.
      </li>
      <li>
        <strong>Views:</strong>
        <ul>
          <li><strong>Pretty:</strong> Formatted JSON.</li>
          <li><strong>Raw:</strong> Unformatted response body.</li>
          <li><strong>Headers:</strong> Searchable response headers table.</li>
        </ul>
      </li>
      <li>
        <strong>Actions:</strong> Click <strong>Copy</strong> to copy the payload, <strong>Download</strong> to save it to a file, or <strong>Save API</strong> to store the endpoint in a workspace.
      </li>
    </ul>

    <h3>Benchmark Results</h3>
    <ul>
      <li>
        <strong>Summary Metrics:</strong> Shows Total Runs, Success Rate (%), Average Speed (ms), and Min/Max latency.
      </li>
      <li>
        <strong>Status Distribution:</strong> Badge breakdown of returned status codes.
      </li>
      <li>
        <strong>Tabs:</strong> View overall <strong>Stats</strong>, latest <strong>Body</strong>, latest <strong>Headers</strong>, or the run-by-run <strong>Runs</strong> table.
      </li>
    </ul>
  </div>
);

const MockApiDoc: React.FC = () => (
  <div>
    <h1>Mock API Engine</h1>
    <p>
      The Mock API Engine allows you to create and host simulated HTTP endpoints that can be called publicly.
    </p>

    <h2>Creating a Mock</h2>
    <ol>
      <li>In <strong>Mock APIs</strong>, click <strong>+ New Mock</strong>.</li>
      <li>
        Configure the endpoint:
        <ul>
          <li><strong>Method:</strong> Select the HTTP method (<code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, <code>DELETE</code>, <code>HEAD</code>, or <code>OPTIONS</code>).</li>
          <li><strong>Path:</strong> Set the route subpath (e.g., <code>/api/v1/users</code>).</li>
          <li><strong>Status Code:</strong> Select the returned HTTP status code (e.g., <code>200</code>, <code>201</code>, <code>400</code>, <code>404</code>).</li>
          <li><strong>Response Headers:</strong> Add custom headers (e.g., <code>Content-Type: application/json</code>).</li>
          <li><strong>Response Body:</strong> Enter the JSON response payload.</li>
        </ul>
      </li>
      <li>Click <strong>Save Mock</strong> to deploy the endpoint.</li>
    </ol>

    <h2>Public Mock Endpoints</h2>
    <p>
      Each mock generates a public URL that you can call from any application without authentication headers.
    </p>
    <ul>
      <li><strong>Call Counter:</strong> Tracks the total number of requests received on each mock card.</li>
      <li><strong>Copy URL:</strong> Click <strong>Copy</strong> on any mock card to copy its live public URL.</li>
    </ul>

    <h2>Managing Mocks</h2>
    <ul>
      <li><strong>Search:</strong> Filter mocks by name, path, or method.</li>
      <li><strong>Edit:</strong> Update the route, status code, headers, or response body.</li>
      <li><strong>Test:</strong> Click <strong>Test</strong> on a mock card to load its URL and method into the API Tester.</li>
      <li><strong>Delete:</strong> Permanently remove the mock endpoint.</li>
    </ul>
  </div>
);

const MyApisDoc: React.FC = () => (
  <div>
    <h1>My APIs &amp; Workspaces</h1>
    <p>
      The <strong>My APIs</strong> section allows you to organize and save frequently used API requests into workspaces.
    </p>

    <h2>Workspaces</h2>
    <ul>
      <li><strong>Create Workspace:</strong> Click <strong>+ New Workspace</strong>, enter a name, and an optional description.</li>
      <li><strong>Views:</strong> Browse workspace cards, click a card to see only its endpoints, or toggle to <strong>All</strong> to list all saved APIs.</li>
      <li><strong>Delete Workspace:</strong> Inside a workspace view, click <strong>Delete Workspace</strong> to remove the workspace and all its saved APIs.</li>
    </ul>

    <h2>Saving &amp; Managing APIs</h2>

    <h3>Saving Endpoints</h3>
    <p>
      Save an endpoint from the <strong>API Tester</strong> (using <strong>Save API</strong> in the response panel) or by clicking <strong>+ Add API</strong> in <strong>My APIs</strong>.
    </p>
    <ul>
      <li><strong>API Name:</strong> Name for the endpoint.</li>
      <li><strong>Endpoint URL:</strong> Target URL.</li>
      <li><strong>Workspace:</strong> Select a workspace for the request.</li>
      <li><strong>API Key (Optional):</strong> If provided, credentials are kept hidden and masked (<code>••••••••</code>) in the interface.</li>
    </ul>

    <h3>Actions</h3>
    <ul>
      <li><strong>Open in Tester:</strong> Loads the URL and saved API key directly into the API Tester.</li>
      <li><strong>Edit:</strong> Update the endpoint name, URL, workspace, or API key.</li>
      <li><strong>Delete:</strong> Remove a saved API from your collection.</li>
    </ul>
  </div>
);

const AuthenticationDoc: React.FC = () => (
  <div>
    <h1>Authentication</h1>
    <p>
      API Workbench uses an account system with email verification (OTP), flexible sign-in, and password recovery.
    </p>

    <h2>Sign Up &amp; Email Verification</h2>
    <ol>
      <li>Click <strong>Sign Up</strong> from the navigation.</li>
      <li>Enter your Name, Username, Email, and Password.</li>
      <li>Click <strong>Continue</strong> to receive a 6-digit verification code via email.</li>
      <li>Enter the code to activate your account and log in.</li>
    </ol>

    <h2>Login</h2>
    <ol>
      <li>Click <strong>Login</strong> from the navigation.</li>
      <li>Enter your <strong>Username or Email</strong> and your <strong>Password</strong>.</li>
      <li>Click <strong>Sign In</strong>.</li>
    </ol>

    <h2>Password Reset</h2>
    <ol>
      <li>Click <strong>Forgot password?</strong> on the login screen.</li>
      <li>Enter your registered email or username and click <strong>Send Reset Code</strong>.</li>
      <li>Enter the 6-digit verification code sent to your email and click <strong>Verify Code</strong>.</li>
      <li>Enter and confirm your new password, then click <strong>Reset Password</strong>.</li>
    </ol>
  </div>
);

const SettingsDoc: React.FC = () => (
  <div>
    <h1>Account Settings</h1>
    <p>
      The <strong>Settings</strong> page allows you to manage profile information, update your password, or permanently delete your account.
    </p>

    <h2>Profile Information</h2>
    <ul>
      <li><strong>Full Name:</strong> Update your display name.</li>
      <li><strong>Username:</strong> Update your unique username handle (which updates the URL for your mock endpoints).</li>
      <li><strong>Email Address:</strong> Read-only field verified during registration.</li>
    </ul>
    <p>Click <strong>Save Changes</strong> to apply profile updates.</p>

    <h2>Changing Password</h2>
    <ol>
      <li>Enter your <strong>Current Password</strong>.</li>
      <li>Enter your <strong>New Password</strong> (minimum 6 characters).</li>
      <li>Re-enter the new password in the <strong>Confirm New Password</strong> field.</li>
      <li>Click <strong>Update Password</strong>.</li>
    </ol>

    <h2>Account Deletion</h2>
    <p>In the <strong>Danger Zone</strong>, click <strong>Delete Account</strong> to permanently remove your account:</p>
    <ul>
      <li>Erases your user profile and login credentials.</li>
      <li>Deletes all saved APIs, workspaces, and mock endpoints.</li>
      <li>External calls to your mock URLs will return <code>404 Not Found</code>.</li>
    </ul>
  </div>
);

export default DocsPage;
