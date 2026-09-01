import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { WorkbenchProvider } from './context/WorkbenchContext';
import { WorkbenchLayout } from './components/WorkbenchLayout';
import { TesterPage } from './components/TesterPage';
import { SavedApiManager } from './components/saved/SavedApiManager';
import { MockManager } from './components/mock/MockManager';
import { AccountSettingsPage } from './components/auth/AccountSettingsPage';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { useWorkbench } from './context/WorkbenchContext';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Wrapper that redirects unauthenticated users to /login.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Loading is handled at the App level
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Wrapper that redirects authenticated users away from login/register to /tester.
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/tester" replace />;
  }

  return <>{children}</>;
}

/**
 * Small component that loads a saved API into the tester and redirects to /tester.
 */
function OpenSavedApiRoute() {
  const { id } = useParams<{ id: string }>();
  const wb = useWorkbench();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      wb.handleOpenSavedApi(id).then(() => {
        // handleOpenSavedApi already navigates to tester via navigateToTester
      }).catch(() => {
        navigate('/apis', { replace: true });
      });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="auth-loading-screen">
      <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
      <p className="auth-loading-text">Loading API...</p>
    </div>
  );
}

/**
 * Connected Saved APIs page — wires workbench callbacks.
 */
function SavedApisPage() {
  const wb = useWorkbench();
  return (
    <SavedApiManager
      onOpenInTester={wb.handleOpenSavedApi}
      onCountChange={wb.setSavedApiCount}
    />
  );
}

/**
 * Connected Mock APIs page — wires workbench callbacks.
 */
function MocksPage() {
  const wb = useWorkbench();
  return (
    <MockManager onTestInWorkbench={wb.handleTestInWorkbench} />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route path="/features" element={<Navigate to="/#features" replace />} />
      <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
      <Route path="/about" element={<Navigate to="/#about" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="login" />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="register" />
          </PublicOnlyRoute>
        }
      />

      {/* Protected routes — wrapped in WorkbenchProvider for state persistence */}
      <Route
        element={
          <ProtectedRoute>
            <WorkbenchProvider>
              <WorkbenchLayout />
            </WorkbenchProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/tester" element={<TesterPage />} />
        <Route path="/apis" element={<SavedApisPage />} />
        <Route path="/apis/workspace/:slug" element={<SavedApisPage />} />
        <Route path="/my-apis" element={<SavedApisPage />} />
        <Route path="/my-apis/workspace/:slug" element={<SavedApisPage />} />
        <Route path="/apis/:id" element={<OpenSavedApiRoute />} />
        <Route path="/mocks" element={<MocksPage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
      </Route>

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
