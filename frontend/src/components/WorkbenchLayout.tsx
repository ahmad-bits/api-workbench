import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWorkbench } from '../context/WorkbenchContext';
import { useToast } from '../context/ToastContext';
import { SaveApiModal } from './saved/SaveApiModal';
import { NavToggle } from './common/NavToggle';

export function WorkbenchLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const wb = useWorkbench();
  const { setNavigateToTester, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = wb;
  const toast = useToast();

  useEffect(() => {
    setNavigateToTester(() => navigate('/api-tester'));
  }, [navigate, setNavigateToTester]);

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;
    let isHorizontalGesture: boolean | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 768) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isSwiping = false;
      isHorizontalGesture = null;

      if (isSidebarCollapsed) {
        if (touchStartX <= 45) {
          isSwiping = true;
        }
      } else {
        if (touchStartX <= 300) {
          isSwiping = true;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping || window.innerWidth > 768) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (isHorizontalGesture === null) {
        if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            isHorizontalGesture = true;
          } else {
            isHorizontalGesture = false;
            isSwiping = false;
          }
        }
      }

      if (isHorizontalGesture) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping || isHorizontalGesture !== true || window.innerWidth > 768) {
        isSwiping = false;
        isHorizontalGesture = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;

      if (isSidebarCollapsed && deltaX > 45) {
        setSidebarCollapsed(false);
      } else if (!isSidebarCollapsed && deltaX < -35) {
        setSidebarCollapsed(true);
      }

      isSwiping = false;
      isHorizontalGesture = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isSidebarCollapsed, setSidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  };

  const isTesterRouteActive =
    location.pathname.startsWith('/api-tester') ||
    location.pathname.startsWith('/tester');

  const isApisRouteActive =
    location.pathname.startsWith('/apis') ||
    location.pathname.startsWith('/my-apis');

  return (
    <div className={`wb-app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {!isSidebarCollapsed && (
        <div
          className="wb-sidebar-mobile-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`wb-app-sidebar ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}
        aria-label="Sidebar Navigation"
        aria-hidden={isSidebarCollapsed}
      >
        <div className="wb-sidebar-top-section">
          <div className="wb-sidebar-header">
            <NavToggle />
          </div>

          <nav className="wb-sidebar-nav">
            <NavLink
              to="/api-tester"
              onClick={handleNavClick}
              className={() => `wb-sidebar-item ${isTesterRouteActive ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>API Tester</span>
            </NavLink>

            <NavLink
              to="/my-apis"
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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

      <main className="wb-app-main">
        <Outlet />
      </main>

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
