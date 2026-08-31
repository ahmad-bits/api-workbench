import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkbench } from '../context/WorkbenchContext';
import { UserProfileModal } from './auth/UserProfileModal';
import { SaveApiModal } from './saved/SaveApiModal';

export function WorkbenchLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wb = useWorkbench();

  // Register the navigate-to-tester callback so context actions can navigate
  useEffect(() => {
    wb.setNavigateToTester(() => navigate('/tester'));
  }, [navigate, wb.setNavigateToTester]);

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
            onClick={wb.handleNewRequest}
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
            <NavLink
              to="/tester"
              className={({ isActive }) => `wb-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>API Tester</span>
            </NavLink>

            <NavLink
              to="/apis"
              className={({ isActive }) => `wb-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>My APIs</span>
              {wb.savedApiCount > 0 && <span className="wb-sidebar-count">{wb.savedApiCount}</span>}
            </NavLink>

            <NavLink
              to="/mocks"
              className={({ isActive }) => `wb-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Mock APIs</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `wb-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Account Settings</span>
            </NavLink>
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
            <span>Documentation</span>
          </a>

          <button
            type="button"
            className="wb-sidebar-footer-link"
            onClick={() => navigate('/')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Support</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Workspace */}
      <main className="wb-app-main">
        <Outlet />
      </main>

      {/* User Profile Modal (kept at layout level for global access) */}
      <UserProfileModal
        isOpen={false}
        onClose={() => {}}
      />

      {/* Save API Modal */}
      <SaveApiModal
        isOpen={wb.saveApiModalOpen}
        onClose={() => wb.setSaveApiModalOpen(false)}
        currentUrl={wb.url}
        detectedApiKey={wb.detectCurrentApiKey()}
        onSaved={(saved) => {
          wb.setSavedApiCount((prev) => prev + 1);
          wb.setSaveToast(`API "${saved.name}" was saved successfully to My APIs!`);
          setTimeout(() => wb.setSaveToast(null), 3500);
        }}
      />
    </div>
  );
}
