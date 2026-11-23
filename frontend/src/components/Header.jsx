import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, PhoneCall, LogOut, User as UserIcon, Bell, ShieldCheck, Check, ChevronDown, Stethoscope, Building2, Calendar } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, profiles, activeProfile, switchProfile, logout, login } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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

  const handleQuickSwitch = async (email, pass) => {
    try {
      await login(email, pass);
      setShowRoleMenu(false);
    } catch (e) {
      console.error('Switch failed', e);
    }
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
        {/* Quick Demo Role Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-heading)',
              backgroundColor: 'var(--color-pale-rose)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px'
            }}
          >
            <span>Role: {user ? user.role.replace('_', ' ').toUpperCase() : 'DEMO SELECT'}</span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '38px',
                width: '260px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: '0 10px 25px rgba(112, 43, 89, 0.12)',
                zIndex: 1000,
                padding: '8px'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase' }}>
                Instant Switch Demo Role
              </div>

              <button
                type="button"
                onClick={() => handleQuickSwitch('roma.patient@medibridge.org', 'PatientPass123!')}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: user?.role === 'patient' ? 'var(--color-pale-rose)' : 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>Patient (Roma R)</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Health Vault & Appointments</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('dr.revathi@medibridge.org', 'DoctorPass123!')}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: user?.role === 'doctor' ? 'var(--color-pale-rose)' : 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                <Stethoscope size={15} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>Doctor (Dr. Revathi)</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cardiology Desk - KMCH</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('admin.kmch@medibridge.org', 'AdminPass123!')}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: user?.role === 'hospital_admin' ? 'var(--color-pale-rose)' : 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                <Building2 size={15} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>Hospital Admin</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>KMCH Operations Console</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('superadmin@medibridge.org', 'SuperAdmin123!')}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: user?.role === 'super_admin' ? 'var(--color-pale-rose)' : 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                <ShieldCheck size={15} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>Super Admin</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Statewide Governance</div>
                </div>
              </button>
            </div>
          )}
        </div>

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
            <span className="badge badge-info" style={{ textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
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
