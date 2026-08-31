import './components/workbench.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppRoutes } from './routes';

function MainApp() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
        <p className="auth-loading-text">Loading API Workbench...</p>
      </div>
    );
  }

  return <AppRoutes />;
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
