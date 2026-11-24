import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  PhoneCall,
  LogOut,
  Bell,
  Search,
  Stethoscope,
  Building2,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import SuperAdminSearchModal from './superadmin/SuperAdminSearchModal';
import SuperAdminNotificationModal from './superadmin/SuperAdminNotificationModal';

export default function Header({ onMenuClick }) {
  const { user, profiles, activeProfile, switchProfile, switchDemoRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuperAdminSearch, setShowSuperAdminSearch] = useState(false);
  const [showSuperAdminNotifications, setShowSuperAdminNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close notifications popover on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const getUserInitials = () => {
    if (!user) return 'G';
    const name = activeProfile?.fullName || user.fullName || user.email || '';
    if (user.role === 'patient') {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0] ? parts[0][0].toUpperCase() : 'P';
    }
    if (user.role === 'doctor') {
      const cleanName = name.replace(/^Dr\.?\s*/i, '').trim();
      const parts = cleanName.split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      if (parts[0] && parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return 'DR';
    }
    if (user.role === 'hospital_admin') return 'HA';
    if (user.role === 'super_admin') return 'SA';
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'doctor':
        return 'Doctor Portal';
      case 'hospital_admin':
        return 'Hospital Admin';
      case 'super_admin':
        return 'Super Admin';
      case 'patient':
      default:
        return 'Patient Portal';
    }
  };

  const handlePortalChange = async (targetRole) => {
    const paths = {
      patient: '/patient-dashboard',
      doctor: '/doctor-portal',
      hospital_admin: '/admin-console',
      super_admin: '/admin-console?tab=platform'
    };
    if (switchDemoRole) {
      await switchDemoRole(targetRole);
    }
    navigate(paths[targetRole] || '/');
  };

  const handleProfileNavigation = () => {
    if (user?.role === 'patient') {
      navigate('/patient-dashboard?tab=profile');
    } else if (user?.role === 'doctor') {
      navigate('/doctor-portal?tab=profile');
    } else if (user?.role === 'hospital_admin') {
      navigate('/admin-console');
    } else if (user?.role === 'super_admin') {
      navigate('/admin-console?tab=platform');
    }
  };

  return (
    <header
      className="app-header"
      style={{
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 90
      }}
    >
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Global Search Pill Bar */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={() => {
              if (user?.role === 'super_admin') setShowSuperAdminSearch(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && user?.role === 'super_admin') {
                setShowSuperAdminSearch(true);
              }
            }}
            placeholder={user?.role === 'super_admin' ? "Search platform hospitals, doctors, users... (Ctrl+K)" : "Search hospitals, doctors..."}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 16px 0 38px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              outline: 'none',
              cursor: user?.role === 'super_admin' ? 'pointer' : 'text',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Portal Selector Pill */}
        {user && switchDemoRole && (
          <div style={{ position: 'relative' }}>
            <select
              value={user.role || 'patient'}
              onChange={(e) => handlePortalChange(e.target.value)}
              aria-label="Portal Selection"
              style={{
                height: '34px',
                padding: '0 28px 0 12px',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--color-pale-rose)',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23B83D83%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              }}
            >
              <option value="patient">Portal: Patient</option>
              <option value="doctor">Portal: Doctor</option>
              <option value="hospital_admin">Portal: Hospital Admin</option>
              <option value="super_admin">Portal: Super Admin</option>
            </select>
          </div>
        )}

        {/* Rapid Emergency 112 Action */}
        <Link
          to="/emergency"
          className="btn btn-sm btn-danger"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            borderRadius: '9999px',
            padding: '0 14px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}
        >
          <PhoneCall size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Emergency 112</span>
        </Link>

        {/* Notification Bell */}
        {user && (
          <div ref={notificationRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                if (user?.role === 'super_admin') {
                  setShowSuperAdminNotifications(true);
                } else {
                  setShowNotifications(!showNotifications);
                }
              }}
              aria-label="Notification Centre"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '1px solid var(--border)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <Bell size={17} strokeWidth={1.75} style={{ color: 'var(--color-heading)' }} />
              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  right: '7px',
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
                  top: '46px',
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

        {/* Patient Family Profile Switcher (Only visible for Patient role) */}
        {user?.role === 'patient' && profiles.length > 0 && (
          <div className="header-profile-selector">
            <select
              id="header-profile-select"
              value={activeProfile?._id || ''}
              onChange={(e) => switchProfile(e.target.value)}
              className="form-select header-profile-dropdown"
              style={{ height: '34px', borderRadius: '9999px', fontSize: '0.75rem', padding: '0 10px' }}
            >
              {profiles.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.relationship})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Identity Pill & Profile Navigation */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleProfileNavigation}
              title="Click to view profile & settings"
              aria-label="User Profile Navigation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '8px',
                padding: '3px 6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)',
                  flexShrink: 0
                }}
              >
                {getUserInitials()}
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    color: 'var(--color-heading)',
                    lineHeight: '1.2',
                    maxWidth: '120px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user.fullName || (user.role === 'doctor' ? 'Doctor' : user.email?.split('@')[0] || 'User')}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={logout}
              className="btn btn-sm btn-secondary"
              aria-label="Logout from session"
              style={{
                height: '34px',
                padding: '0 10px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <LogOut size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="btn btn-sm btn-primary"
            style={{ height: '34px', borderRadius: '9999px', padding: '0 16px', fontSize: '0.8125rem', fontWeight: '700' }}
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Super Admin Global Modals */}
      {user?.role === 'super_admin' && (
        <>
          <SuperAdminSearchModal
            isOpen={showSuperAdminSearch}
            onClose={() => setShowSuperAdminSearch(false)}
            onNavigate={(tab) => {
              setShowSuperAdminSearch(false);
              navigate(`/admin-console?tab=${tab}`);
            }}
          />
          <SuperAdminNotificationModal
            isOpen={showSuperAdminNotifications}
            onClose={() => setShowSuperAdminNotifications(false)}
            onNavigate={(tab) => {
              setShowSuperAdminNotifications(false);
              navigate(`/admin-console?tab=${tab}`);
            }}
          />
        </>
      )}
    </header>
  );
}
