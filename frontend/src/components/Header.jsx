import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, PhoneCall, LogOut, User as UserIcon } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, profiles, activeProfile, switchProfile, logout } = useAuth();
  const location = useLocation();

  const getSectionTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Hospital Discovery & Capacity';
    if (path.startsWith('/hospital/')) return 'Facility Details & Booking';
    if (path === '/emergency') return 'Emergency Mode';
    if (path === '/patient-dashboard') return 'Patient Dashboard';
    if (path === '/doctor-portal') return 'Doctor Clinical Schedule';
    if (path === '/admin-console') return 'Hospital Operations Console';
    if (path.startsWith('/teleconsult/')) return 'Teleconsultation Session';
    if (path === '/login') return 'Authentication';
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
        {/* Rapid 108 Action */}
        <Link
          to="/emergency"
          className="btn btn-sm btn-danger"
          style={{ textDecoration: 'none' }}
        >
          <PhoneCall size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Emergency (108)</span>
        </Link>

        {/* Patient Profile Switcher */}
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
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              <UserIcon size={12} strokeWidth={1.75} aria-hidden="true" />
              <span>{user.role.replace('_', ' ')}</span>
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
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
