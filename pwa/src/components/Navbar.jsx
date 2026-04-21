import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { kapper, logout } = useAuth();

  return (
    <>
      {/* Top bar */}
      <nav className="pwa-nav">
        <div className="pwa-nav-inner">
          <span className="pwa-logo">ZakaBarber</span>
          <div className="pwa-nav-actions">
            {kapper && (
              <div className="pwa-user-badge">
                <div className="pwa-avatar">
                  {kapper.name?.charAt(0).toUpperCase()}
                </div>
                <span>{kapper.name}</span>
              </div>
            )}
            <button className="btn-logout" onClick={logout}>Afmelden</button>
          </div>
        </div>
      </nav>

      {/* Bottom Tab Bar */}
      <nav className="tab-bar">
        <NavLink to="/" end className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}>
          <span className="tab-icon">🏠</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/dag" className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}>
          <span className="tab-icon">📅</span>
          <span>Dag</span>
        </NavLink>
        <NavLink to="/week" className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}>
          <span className="tab-icon">🗓️</span>
          <span>Week</span>
        </NavLink>
        <NavLink to="/beschikbaarheid" className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}>
          <span className="tab-icon">🔒</span>
          <span>Blokkeer</span>
        </NavLink>
        {kapper?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}>
            <span className="tab-icon">⚙️</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
