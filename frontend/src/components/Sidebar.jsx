import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Calendar,
  Stethoscope,
  SlidersHorizontal,
  AlertTriangle,
  X,
  Hospital,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        <div className="sidebar-brand">
          <Link to="/" className="brand-logo" onClick={onClose} style={{ textDecoration: 'none' }}>
            <Hospital size={24} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--color-heading)' }}>Medi</span>
              <span style={{ color: 'var(--color-primary)' }}>Bridge</span>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation sidebar"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* 1. PATIENT ACCOUNT or GUEST */}
          {(!user || user.role === 'patient') && (
            <>
              {user && (
                <div className="nav-group">
                  <span className="nav-group-label">Patient Portal</span>
                  <ul className="nav-list">
                    <li>
                      <Link
                        to="/patient-dashboard"
                        className={`nav-link ${isCurrent('/patient-dashboard') ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        <Calendar size={18} strokeWidth={1.75} aria-hidden="true" />
                        <span>Appointments & Vault</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              <div className="nav-group">
                <span className="nav-group-label">Healthcare Discovery</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/"
                      className={`nav-link ${isCurrent('/') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Building2 size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Discover & Book</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/emergency"
                      className={`nav-link nav-link-emergency ${isCurrent('/emergency') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Emergency Mode (108)</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* 2. DOCTOR ACCOUNT */}
          {user?.role === 'doctor' && (
            <>
              <div className="nav-group">
                <span className="nav-group-label">Doctor Workspace</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/doctor-portal"
                      className={`nav-link ${isCurrent('/doctor-portal') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Clinical Desk</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="nav-group">
                <span className="nav-group-label">Clinical Resources</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/emergency"
                      className={`nav-link nav-link-emergency ${isCurrent('/emergency') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Emergency Triage (108)</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* 3. HOSPITAL ADMIN ACCOUNT */}
          {user?.role === 'hospital_admin' && (
            <>
              <div className="nav-group">
                <span className="nav-group-label">Hospital Administration</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console"
                      className={`nav-link ${isCurrent('/admin-console') && !location.search.includes('tab=platform') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Operations Console</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="nav-group">
                <span className="nav-group-label">Hospital Services</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/emergency"
                      className={`nav-link nav-link-emergency ${isCurrent('/emergency') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Emergency Beds (108)</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* 4. SUPER ADMIN ACCOUNT */}
          {user?.role === 'super_admin' && (
            <>
              <div className="nav-group">
                <span className="nav-group-label">State Platform Governance</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=platform"
                      className={`nav-link ${isCurrent('/admin-console') && location.search.includes('tab=platform') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Platform Governance</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console"
                      className={`nav-link ${isCurrent('/admin-console') && !location.search.includes('tab=platform') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Hospital Operations</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="nav-group">
                <span className="nav-group-label">Network Discovery</span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/"
                      className={`nav-link ${isCurrent('/') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Building2 size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Hospital Network</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/emergency"
                      className={`nav-link nav-link-emergency ${isCurrent('/emergency') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>Emergency Grid (108)</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-env-tag">
            <span className="demo-badge">{user ? user.role.replace('_', ' ').toUpperCase() : 'PUBLIC'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Techthon 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
}
