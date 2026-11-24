import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HospitalIcon, AlertTriangleIcon, FileTextIcon, CalendarIcon, StethoscopeIcon } from './Icons';

export default function Navbar() {
  const { user, profiles, activeProfile, switchProfile, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* State Health Network Top Bar */}
      <div className="demo-banner" style={{ backgroundColor: 'var(--color-heading)', color: '#FFFFFF', padding: '6px 20px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-pill badge-primary" style={{ fontSize: '0.6875rem' }}>Verified Portal</span>
          <span>Unified State Healthcare Coordination & Emergency Transit Network</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
          <span>&copy; 2026 MediBridge Healthcare Coordination Systems</span>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
            <HospitalIcon size={24} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--color-heading)' }}>Medi</span>
              <span style={{ color: 'var(--color-primary)' }}>Bridge</span>
            </span>
          </Link>

          <ul className="nav-links">
            <li>
              <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                Discover & Book
              </Link>
            </li>

            {user?.role === 'patient' && (
              <>
                <li>
                  <Link
                    to="/patient-dashboard"
                    className={`nav-item ${location.pathname === '/patient-dashboard' ? 'active' : ''}`}
                  >
                    <CalendarIcon size={16} /> Appointments & Vault
                  </Link>
                </li>
              </>
            )}

            {user?.role === 'doctor' && (
              <li>
                <Link
                  to="/doctor-portal"
                  className={`nav-item ${location.pathname === '/doctor-portal' ? 'active' : ''}`}
                >
                  <StethoscopeIcon size={16} /> Doctor Portal
                </Link>
              </li>
            )}

            {(user?.role === 'hospital_admin' || user?.role === 'super_admin') && (
              <li>
                <Link
                  to="/admin-console"
                  className={`nav-item ${location.pathname === '/admin-console' ? 'active' : ''}`}
                >
                  Operations Console
                </Link>
              </li>
            )}

            <li>
              <Link to="/emergency" className="btn btn-sm btn-danger">
                <AlertTriangleIcon size={14} /> Emergency (108)
              </Link>
            </li>

            {/* Patient Family Profile Switcher */}
            {user?.role === 'patient' && profiles.length > 0 && (
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Profile:</span>
                <select
                  value={activeProfile?._id || ''}
                  onChange={(e) => switchProfile(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--color-heading)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {profiles.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.relationship})
                    </option>
                  ))}
                </select>
              </li>
            )}

            {user ? (
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--bg-app)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-heading)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {user.role}
                </span>
                <button onClick={logout} className="btn btn-sm btn-secondary" style={{ padding: '2px 8px' }}>
                  Logout
                </button>
              </li>
            ) : (
              <li>
                <Link to="/login" className="btn btn-sm btn-primary">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
}
