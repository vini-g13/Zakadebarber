import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import DayView    from './pages/DayView';
import WeekView   from './pages/WeekView';
import Availability from './pages/Availability';
import Admin      from './pages/Admin';
import Navbar     from './components/Navbar';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, kapper, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && kapper?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className={user ? 'with-nav' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dag" element={
            <ProtectedRoute><DayView /></ProtectedRoute>
          } />
          <Route path="/week" element={
            <ProtectedRoute><WeekView /></ProtectedRoute>
          } />
          <Route path="/beschikbaarheid" element={
            <ProtectedRoute><Availability /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
