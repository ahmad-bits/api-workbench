import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWorkbench } from '../context/WorkbenchContext';
import { useToast } from '../context/ToastContext';
import { SaveApiModal } from './saved/SaveApiModal';

export function WorkbenchLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const wb = useWorkbench();
  const { setNavigateToTester } = wb;
  const toast = useToast();

  // Register the navigate-to-tester callback so context actions can navigate
  useEffect(() => {
    setNavigateToTester(() => navigate('/tester'));
  }, [navigate, setNavigateToTester]);

  const isApisRouteActive =
    location.pathname.startsWith('/apis') ||
    location.pathname.startsWith('/my-apis');

  return (
    <div className="wb-app-shell">
      {/* 1. Left Professional Developer Sidebar */}
      <aside className="wb-app-sidebar">
        <div className="wb-sidebar-top-section">

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
              className={() => `wb-sidebar-item ${isApisRouteActive ? 'active' : ''}`}
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
      </aside>

      {/* 2. Main Content Workspace */}
      <main className="wb-app-main">
        <Outlet />
      </main>

      {/* Save API Modal */}
      <SaveApiModal
        isOpen={wb.saveApiModalOpen}
        onClose={() => wb.setSaveApiModalOpen(false)}
        currentUrl={wb.url}
        detectedApiKey={wb.detectCurrentApiKey()}
        onSaved={(saved) => {
          wb.setSavedApiCount((prev) => prev + 1);
          toast.success(`API "${saved.name}" was saved successfully to My APIs!`);
        }}
      />
    </div>
  );
}
