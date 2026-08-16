import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, user, dbReady } = useAuth();
  const location = useLocation();

  if (!dbReady) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #f59e0b',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          marginBottom: 16
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>INITIALIZING SQLITE DATABASE...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.mustResetPassword && location.pathname !== '/first-login-reset') {
    return <Navigate to="/first-login-reset" replace />;
  }

  return children;
}
