import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, PhoneCall, LogOut, User as UserIcon, Bell, Search } from 'lucide-react';
import SuperAdminSearchModal from './superadmin/SuperAdminSearchModal';
import SuperAdminNotificationModal from './superadmin/SuperAdminNotificationModal';

export default function Header({ onMenuClick }) {
  const { user, profiles, activeProfile, switchProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuperAdminSearch, setShowSuperAdminSearch] = useState(false);
  const [showSuperAdminNotifications, setShowSuperAdminNotifications] = useState(false);

  const getUserInitials = () => {
    if (!user) return 'G';
    if (user.role === 'patient') return 'R';
    if (user.role === 'doctor') return 'Dr';
    if (user.role === 'hospital_admin') return 'H';
    if (user.role === 'super_admin') return 'SA';
    return user.email ? user.email[0].toUpperCase() : 'U';
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
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        {/* Global Search Pill Bar (visible in all reference images) */}
        <div style={{ position: 'relative', width: '340px' }}>
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

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Rapid Emergency 112 Action */}
        <Link
          to="/emergency"
          className="btn btn-sm btn-danger"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', borderRadius: '9999px', padding: '0 14px' }}
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
                backgroundColor: '#FFFFFF'
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

        {/* Patient Profile Switcher (Only visible for Patient role) */}
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

        {/* User Avatar Circle and Details (exact match to reference images) */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
              }}
            >
              {getUserInitials()}
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn btn-sm btn-secondary"
              aria-label="Logout from session"
              style={{ height: '34px', padding: '0 10px', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              <LogOut size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-sm btn-primary" style={{ height: '34px', borderRadius: '9999px', padding: '0 16px' }}>
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
