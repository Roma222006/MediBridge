import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, PhoneCall, LogOut, User as UserIcon, Bell } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, profiles, activeProfile, switchProfile, logout } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const getSectionTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Hospital Discovery & Capacity';
    if (path.startsWith('/hospital/')) return 'Facility Details & Booking';
    if (path === '/emergency') return 'Emergency Mode (108)';
    if (path === '/patient-dashboard') return 'Patient Care Portal & Vault';
    if (path === '/doctor-portal') return 'Doctor Clinical Desk';
    if (path === '/admin-console') return 'Hospital Operations Console';
    if (path.startsWith('/teleconsult/')) return 'Teleconsultation Session';
    if (path === '/login') return 'Authentication Gateway';
    return 'Healthcare Coordination';
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span className="header-page-title">{getSectionTitle()}</span>
      </div>

      <div className="header-right">
        {/* Rapid 112 / 108 Emergency Action */}
        <Link
          to="/emergency"
          className="btn btn-sm btn-danger"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <PhoneCall size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Emergency 112</span>
        </Link>

        {/* Notification Bell */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notification Centre"
              style={{ padding: '0 8px', height: '32px', position: 'relative' }}
            >
              <Bell size={16} strokeWidth={1.75} aria-hidden="true" />
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)'
                }}
              />
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  width: '300px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: '0 10px 25px rgba(112, 43, 89, 0.1)',
                  zIndex: 1000,
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                    System Notifications
                  </span>
                  <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.6875rem' }}>
                    Live
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <strong style={{ color: 'var(--text)' }}>Bed Capacity Socket</strong>: Real-time broadcast active.
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    <strong style={{ color: 'var(--text)' }}>DPDP Act 2023</strong>: Active consent enforcement enabled.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patient Profile Switcher (Only visible for Patient role) */}
        {user?.role === 'patient' && profiles.length > 0 && (
          <div className="header-profile-selector">
            <label htmlFor="header-profile-select" className="header-profile-label">
              Profile:
            </label>
            <select
              id="header-profile-select"
              value={activeProfile?._id || ''}
              onChange={(e) => switchProfile(e.target.value)}
              className="form-select header-profile-dropdown"
            >
              {profiles.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.relationship})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Session Info / Controls */}
        {user ? (
          <div className="header-user-block">
            <span className="badge badge-info" style={{ textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <UserIcon size={12} strokeWidth={1.75} aria-hidden="true" />
              <span>{user.name ? `${user.name} (${user.role.replace('_', ' ')})` : user.role.replace('_', ' ')}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="btn btn-sm btn-secondary"
              aria-label="Logout from session"
            >
              <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-sm btn-primary">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
