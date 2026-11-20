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
  Hospital
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Drawer Overlay (<1024px) */}
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
            <Hospital size={22} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
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
          {/* Group 1: Discover & Emergency */}
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
                  <span>Emergency (108)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 2: Patient Services */}
          {(user?.role === 'patient' || !user) && (
            <div className="nav-group">
              <span className="nav-group-label">Patient Services</span>
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

          {/* Group 3: Clinical Staff */}
          {(user?.role === 'doctor' || user?.role === 'super_admin') && (
            <div className="nav-group">
              <span className="nav-group-label">Clinical Staff</span>
              <ul className="nav-list">
                <li>
                  <Link
                    to="/doctor-portal"
                    className={`nav-link ${isCurrent('/doctor-portal') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
                    <span>Doctor Portal</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Group 4: Administration */}
          {(user?.role === 'hospital_admin' || user?.role === 'super_admin') && (
            <div className="nav-group">
              <span className="nav-group-label">Administration</span>
              <ul className="nav-list">
                <li>
                  <Link
                    to="/admin-console"
                    className={`nav-link ${isCurrent('/admin-console') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
                    <span>Operations Console</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-env-tag">
            <span className="demo-badge">Demo</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Techthon 2026 R2</span>
          </div>
        </div>
      </aside>
    </>
  );
}
