import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && !(role === 'teacher' && user.role === 'admin')) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/teacher/students'} replace />;
  }

  return children;
}
