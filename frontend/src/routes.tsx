import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { WorkbenchProvider } from './context/WorkbenchContext';
import { WorkbenchLayout } from './components/WorkbenchLayout';
import { TesterPage } from './components/TesterPage';
import { SavedApiManager } from './components/saved/SavedApiManager';
import { MockManager } from './components/mock/MockManager';
import { AccountSettingsPage } from './components/auth/AccountSettingsPage';
import { LandingPage } from './components/landing/LandingPage';
import { DocsPage } from './components/docs/DocsPage';
import { AuthPage } from './components/auth/AuthPage';
import { useWorkbench } from './context/WorkbenchContext';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/api-tester" replace />;
  }

  return <>{children}</>;
}

function OpenSavedApiRoute() {
  const { id } = useParams<{ id: string }>();
  const wb = useWorkbench();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      wb.handleOpenSavedApi(id).catch(() => {
        navigate('/my-apis', { replace: true });
      });
    }
  }, [id]);

  return (
    <div className="auth-loading-screen">
      <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
      <p className="auth-loading-text">Loading API...</p>
    </div>
  );
}

function SavedApisPage() {
  const wb = useWorkbench();
  return (
    <SavedApiManager
      onOpenInTester={wb.handleOpenSavedApi}
      onCountChange={wb.setSavedApiCount}
    />
  );
}

function MocksPage() {
  const wb = useWorkbench();
  return (
    <MockManager onTestInWorkbench={wb.handleTestInWorkbench} />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route path="/features" element={<Navigate to="/#features" replace />} />
      <Route path="/about" element={<Navigate to="/#about" replace />} />
      <Route path="/docs" element={<DocsPage />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="login" />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/signin"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="register" />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/signup"
        element={<Navigate to="/register" replace />}
      />

      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="forgot_password" />
          </PublicOnlyRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <WorkbenchProvider>
              <WorkbenchLayout />
            </WorkbenchProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/api-tester" element={<TesterPage />} />
        <Route path="/api-tester/params" element={<TesterPage />} />
        <Route path="/api-tester/headers" element={<TesterPage />} />
        <Route path="/api-tester/auth" element={<TesterPage />} />
        <Route path="/api-tester/body" element={<TesterPage />} />
        <Route path="/api-tester/response" element={<TesterPage />} />

        <Route path="/tester" element={<Navigate to="/api-tester" replace />} />
        <Route path="/tester/params" element={<Navigate to="/api-tester/params" replace />} />
        <Route path="/tester/headers" element={<Navigate to="/api-tester/headers" replace />} />
        <Route path="/tester/auth" element={<Navigate to="/api-tester/auth" replace />} />
        <Route path="/tester/body" element={<Navigate to="/api-tester/body" replace />} />
        <Route path="/tester/response" element={<Navigate to="/api-tester/response" replace />} />

        <Route path="/my-apis" element={<SavedApisPage />} />
        <Route path="/my-apis/workspace/:slug" element={<SavedApisPage />} />
        <Route path="/my-apis/:id" element={<OpenSavedApiRoute />} />

        <Route path="/apis" element={<Navigate to="/my-apis" replace />} />
        <Route path="/apis/workspace/:slug" element={<SavedApisPage />} />
        <Route path="/apis/:id" element={<OpenSavedApiRoute />} />

        <Route path="/mocks" element={<MocksPage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
