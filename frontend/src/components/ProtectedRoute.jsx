import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="vh-100 d-grid place-items-center text-center pt-5"><div className="spinner-ring" /></div>;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
}
