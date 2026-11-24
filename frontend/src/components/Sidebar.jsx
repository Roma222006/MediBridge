import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Hospital,
  LayoutDashboard,
  Building2,
  Calendar,
  FolderLock,
  Users,
  Send,
  Clock,
  AlertTriangle,
  Settings,
  LogOut,
  Stethoscope,
  ShieldCheck,
  CalendarCheck,
  FileText,
  Bell,
  SlidersHorizontal,
  Bed,
  Layers,
  Activity,
  History,
  CheckCircle,
  X,
  UserCheck,
  ClipboardList,
  CalendarX,
  ScrollText,
  BarChart3,
  UserPlus
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isCurrent = (path, tab) => {
    if (tab) {
      return location.pathname === path && location.search.includes(`tab=${tab}`);
    }
    if (path === '/') {
      return location.pathname === '/' && !location.search.includes('tab=');
    }
    return location.pathname === path && (!location.search || !location.search.includes('tab='));
  };

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
        {/* Brand Logo Header */}
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
          {/* ========================================================
              1. PATIENT PORTAL SIDEBAR
              ======================================================== */}
          {(!user || user.role === 'patient') && (
            <div className="nav-group">
              <span className="nav-group-label" style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Patient Portal
              </span>
              <ul className="nav-list">
                <li>
                  <Link
                    to="/patient-dashboard"
                    className={`nav-link ${isCurrent('/patient-dashboard') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <LayoutDashboard size={17} strokeWidth={1.75} />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className={`nav-link ${isCurrent('/') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Building2 size={17} strokeWidth={1.75} />
                    <span>Discover Hospitals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/patient-dashboard?tab=appointments"
                    className={`nav-link ${isCurrent('/patient-dashboard', 'appointments') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Calendar size={17} strokeWidth={1.75} />
                    <span>Appointments</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/patient-dashboard?tab=vault"
                    className={`nav-link ${isCurrent('/patient-dashboard', 'vault') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <FolderLock size={17} strokeWidth={1.75} />
                    <span>Health Vault</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/patient-dashboard?tab=family"
                    className={`nav-link ${isCurrent('/patient-dashboard', 'family') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Users size={17} strokeWidth={1.75} />
                    <span>Family Profiles</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/patient-dashboard?tab=referrals"
                    className={`nav-link ${isCurrent('/patient-dashboard', 'referrals') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Send size={17} strokeWidth={1.75} />
                    <span>Referrals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/patient-dashboard?tab=followups"
                    className={`nav-link ${isCurrent('/patient-dashboard', 'followups') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Clock size={17} strokeWidth={1.75} />
                    <span>Follow-ups</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/emergency"
                    className={`nav-link nav-link-emergency ${isCurrent('/emergency') ? 'active' : ''}`}
                    onClick={onClose}
                    style={{ color: 'var(--status-critical-solid)' }}
                  >
                    <AlertTriangle size={17} strokeWidth={1.75} />
                    <span>Emergency (108)</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/patient-dashboard?tab=settings"
                    className={`nav-link ${isCurrent('/patient-dashboard', 'settings') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Settings size={17} strokeWidth={1.75} />
                    <span>Settings</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* ========================================================
              2. DOCTOR PORTAL SIDEBAR
              ======================================================== */}
          {user?.role === 'doctor' && (
            <div className="nav-group">
              <span className="nav-group-label" style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Doctor Portal
              </span>
              <ul className="nav-list">
                <li>
                  <Link
                    to="/doctor-portal"
                    className={`nav-link ${isCurrent('/doctor-portal') && !location.search ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <LayoutDashboard size={17} strokeWidth={1.75} />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=desk"
                    className={`nav-link ${isCurrent('/doctor-portal', 'desk') || isCurrent('/doctor-portal', 'appointments') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Stethoscope size={17} strokeWidth={1.75} />
                    <span>Appointments & Clinical Desk</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=availability"
                    className={`nav-link ${isCurrent('/doctor-portal', 'availability') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <CalendarCheck size={17} strokeWidth={1.75} />
                    <span>Availability</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=prescriptions"
                    className={`nav-link ${isCurrent('/doctor-portal', 'prescriptions') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <FileText size={17} strokeWidth={1.75} />
                    <span>Prescriptions</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=referrals"
                    className={`nav-link ${isCurrent('/doctor-portal', 'referrals') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Send size={17} strokeWidth={1.75} />
                    <span>Referrals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=followups"
                    className={`nav-link ${isCurrent('/doctor-portal', 'followups') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Clock size={17} strokeWidth={1.75} />
                    <span>Follow-ups</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=notifications"
                    className={`nav-link ${isCurrent('/doctor-portal', 'notifications') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Bell size={17} strokeWidth={1.75} />
                    <span>Notifications</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=credentials"
                    className={`nav-link ${isCurrent('/doctor-portal', 'credentials') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <ShieldCheck size={17} strokeWidth={1.75} />
                    <span>Credentials & Verification</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/doctor-portal?tab=settings"
                    className={`nav-link ${isCurrent('/doctor-portal', 'settings') || isCurrent('/doctor-portal', 'profile') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Settings size={17} strokeWidth={1.75} />
                    <span>Profile & Settings</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* ========================================================
              3. HOSPITAL ADMIN SIDEBAR (Organized Grouped Navigation)
              ======================================================== */}
          {user?.role === 'hospital_admin' && (
            <>
              {/* GROUP 1: HOSPITAL OVERVIEW */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hospital Overview
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console"
                      className={`nav-link ${isCurrent('/admin-console') && (!location.search || location.search.includes('tab=dashboard')) ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <LayoutDashboard size={17} strokeWidth={1.75} />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=profile"
                      className={`nav-link ${isCurrent('/admin-console', 'profile') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Building2 size={17} strokeWidth={1.75} />
                      <span>Hospital Profile</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 2: DOCTOR MANAGEMENT */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Doctor Management
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=doctors"
                      className={`nav-link ${isCurrent('/admin-console', 'doctors') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <UserCheck size={17} strokeWidth={1.75} />
                      <span>Doctor Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=doctor-verification"
                      className={`nav-link ${isCurrent('/admin-console', 'doctor-verification') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <ShieldCheck size={17} strokeWidth={1.75} />
                      <span>Doctor Verification</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=doctor-availability"
                      className={`nav-link ${isCurrent('/admin-console', 'doctor-availability') || isCurrent('/admin-console', 'slots') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <CalendarCheck size={17} strokeWidth={1.75} />
                      <span>Doctor Availability</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=leave-management"
                      className={`nav-link ${isCurrent('/admin-console', 'leave-management') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <CalendarX size={17} strokeWidth={1.75} />
                      <span>Leave Management</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 3: HOSPITAL STRUCTURE */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hospital Structure
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=departments"
                      className={`nav-link ${isCurrent('/admin-console', 'departments') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Layers size={17} strokeWidth={1.75} />
                      <span>Department Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=services"
                      className={`nav-link ${isCurrent('/admin-console', 'services') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <ClipboardList size={17} strokeWidth={1.75} />
                      <span>Service Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=diagnostics"
                      className={`nav-link ${isCurrent('/admin-console', 'diagnostics') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Activity size={17} strokeWidth={1.75} />
                      <span>Diagnostic Services</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 4: APPOINTMENT OPERATIONS */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Appointment Operations
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=appointments"
                      className={`nav-link ${isCurrent('/admin-console', 'appointments') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Calendar size={17} strokeWidth={1.75} />
                      <span>Appointment Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=pending-appointments"
                      className={`nav-link ${isCurrent('/admin-console', 'pending-appointments') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Clock size={17} strokeWidth={1.75} />
                      <span>Pending Appointments</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=cancellations"
                      className={`nav-link ${isCurrent('/admin-console', 'cancellations') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <AlertTriangle size={17} strokeWidth={1.75} />
                      <span>Cancellation Requests</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=replacements"
                      className={`nav-link ${isCurrent('/admin-console', 'replacements') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <UserPlus size={17} strokeWidth={1.75} />
                      <span>Replacement Doctor</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 5: RESOURCE MANAGEMENT */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Resource Management
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=beds"
                      className={`nav-link ${isCurrent('/admin-console', 'beds') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Bed size={17} strokeWidth={1.75} />
                      <span>Bed Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=facilities"
                      className={`nav-link ${isCurrent('/admin-console', 'facilities') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Hospital size={17} strokeWidth={1.75} />
                      <span>Facility Availability</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 6: PATIENT COORDINATION */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Patient Coordination
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=referrals"
                      className={`nav-link ${isCurrent('/admin-console', 'referrals') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Send size={17} strokeWidth={1.75} />
                      <span>Referral Management</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=checkin"
                      className={`nav-link ${isCurrent('/admin-console', 'checkin') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <UserCheck size={17} strokeWidth={1.75} />
                      <span>Patient Check-in</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 7: REPORTS AND COMMUNICATION */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reports & Communication
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=reports"
                      className={`nav-link ${isCurrent('/admin-console', 'reports') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <BarChart3 size={17} strokeWidth={1.75} />
                      <span>Operational Reports</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=notifications"
                      className={`nav-link ${isCurrent('/admin-console', 'notifications') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Bell size={17} strokeWidth={1.75} />
                      <span>Notifications</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-console?tab=audit"
                      className={`nav-link ${isCurrent('/admin-console', 'audit') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <ScrollText size={17} strokeWidth={1.75} />
                      <span>Audit Logs</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* GROUP 8: SETTINGS */}
              <div className="nav-group">
                <span className="nav-group-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Settings
                </span>
                <ul className="nav-list">
                  <li>
                    <Link
                      to="/admin-console?tab=settings"
                      className={`nav-link ${isCurrent('/admin-console', 'settings') ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Settings size={17} strokeWidth={1.75} />
                      <span>Hospital Settings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* ========================================================
              4. SUPER ADMIN SIDEBAR
              ======================================================== */}
          {user?.role === 'super_admin' && (
            <div className="nav-group">
              <span className="nav-group-label" style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Super Admin
              </span>
              <ul className="nav-list">
                <li>
                  <Link
                    to="/admin-console?tab=platform"
                    className={`nav-link ${isCurrent('/admin-console', 'platform') || isCurrent('/admin-console') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <LayoutDashboard size={17} strokeWidth={1.75} />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=hospitals"
                    className={`nav-link ${isCurrent('/admin-console', 'hospitals') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Building2 size={17} strokeWidth={1.75} />
                    <span>Hospital Management</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=approvals"
                    className={`nav-link ${isCurrent('/admin-console', 'approvals') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <CheckCircle size={17} strokeWidth={1.75} />
                    <span>Hospital Approvals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=users"
                    className={`nav-link ${isCurrent('/admin-console', 'users') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Users size={17} strokeWidth={1.75} />
                    <span>User Management</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=roles"
                    className={`nav-link ${isCurrent('/admin-console', 'roles') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <ShieldCheck size={17} strokeWidth={1.75} />
                    <span>Role Management</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=monitoring"
                    className={`nav-link ${isCurrent('/admin-console', 'monitoring') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Activity size={17} strokeWidth={1.75} />
                    <span>Platform Monitoring</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=audit"
                    className={`nav-link ${isCurrent('/admin-console', 'audit') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <History size={17} strokeWidth={1.75} />
                    <span>Audit Logs</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=reports"
                    className={`nav-link ${isCurrent('/admin-console', 'reports') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <FileText size={17} strokeWidth={1.75} />
                    <span>Reports</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin-console?tab=system"
                    className={`nav-link ${isCurrent('/admin-console', 'system') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Settings size={17} strokeWidth={1.75} />
                    <span>System Settings</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="sidebar-footer" style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          {user && (
            <button
              type="button"
              onClick={logout}
              className="nav-link"
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-heading)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px'
              }}
            >
              <LogOut size={17} strokeWidth={1.75} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
