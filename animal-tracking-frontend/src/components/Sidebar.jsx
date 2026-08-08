import React from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard',       icon: '🏠', path: '/',          section: 'main' },
  { label: 'QR Scanner',      icon: '📷', path: '/scanner',   section: 'main' },
  { label: 'Hotspot Map',     icon: '🗺️', path: '/map',       section: 'main' },
  { label: 'Register Animal', icon: '➕', path: '/register',  section: 'volunteer', volunteerOnly: true },
  { label: 'Adoptions',       icon: '🤝', path: '/adoptions', section: 'volunteer', volunteerOnly: true },
];

const Sidebar = ({ currentPath, onNavigate }) => {
  const { user, logout, isVolunteer } = useAuth();

  const mainItems      = navItems.filter(i => !i.volunteerOnly);
  const volunteerItems = navItems.filter(i => i.volunteerOnly);
  const getInitials    = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🐾</div>
        <div className="sidebar-logo-text">
          PawTrack
          <span>Animal Management</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Main</span>
        {mainItems.map(item => (
          <button
            key={item.path}
            className={`nav-item${currentPath === item.path ? ' active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {isVolunteer && (
          <>
            <span className="nav-section-label" style={{ marginTop: 8 }}>Volunteer</span>
            {volunteerItems.map(item => (
              <button
                key={item.path}
                className={`nav-item${currentPath === item.path ? ' active' : ''}`}
                onClick={() => onNavigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Footer user card */}
      <div className="sidebar-user">
        {user ? (
          <div className="user-card">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out">↩</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-full" onClick={() => onNavigate('/auth')}>
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
