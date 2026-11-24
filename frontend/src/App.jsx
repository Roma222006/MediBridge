import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ShieldCheck } from 'lucide-react';

import SearchPage from './pages/SearchPage';
import HospitalDetailsPage from './pages/HospitalDetailsPage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import DoctorPortalPage from './pages/DoctorPortalPage';
import AdminConsolePage from './pages/AdminConsolePage';
import EmergencyPage from './pages/EmergencyPage';
import TeleconsultRoomPage from './pages/TeleconsultRoomPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, switchDemoRole } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // Not authenticated or unauthorized role -> show a smooth one-click role switch bridge
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    const targetRole = allowedRoles ? allowedRoles[0] : 'patient';
    const roleLabels = {
      patient: 'Patient Portal',
      doctor: 'Doctor Portal',
      hospital_admin: 'Hospital Admin Portal',
      super_admin: 'Super Admin Platform'
    };

    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '60px auto',
          padding: '36px 32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-blush-pink)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}
        >
          <ShieldCheck size={28} />
        </div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
          {roleLabels[targetRole] || 'Portal Access Required'}
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {user
            ? `You are currently viewing as ${user.role}. Click below to enter ${roleLabels[targetRole]}.`
            : `Please activate your session to enter ${roleLabels[targetRole]}.`}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            disabled={switching}
            onClick={async () => {
              setSwitching(true);
              if (switchDemoRole) await switchDemoRole(targetRole);
              setSwitching(false);
            }}
            className="btn btn-primary"
            style={{ width: '100%', height: '42px', borderRadius: '10px', fontSize: '0.9375rem', fontWeight: '700' }}
          >
            {switching ? 'Activating Credentials...' : `Enter ${roleLabels[targetRole]} Directly`}
          </button>
          <Link
            to="/login"
            style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none', marginTop: '6px' }}
          >
            Sign in with specific credentials
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handlePortalSwitch = async (role, path) => {
    if (switchDemoRole) {
      const target = await switchDemoRole(role);
      navigate(path || target);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <div
        className="demo-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'var(--color-heading)',
          color: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="demo-badge">Techthon 2026</span>
          <span style={{ fontWeight: '700', fontSize: '0.75rem' }}>
            MediBridge Multi-Portal Hub
          </span>
        </div>

        {/* Instant Multi-Portal Launcher Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-blush-pink)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
            All Portals:
          </span>
          <button
            type="button"
            onClick={() => handlePortalSwitch('patient', '/patient-dashboard')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: user?.role === 'patient' ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF'
            }}
          >
            Patient Portal
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch('doctor', '/doctor-portal')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: user?.role === 'doctor' ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF'
            }}
          >
            Doctor Portal
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch('hospital_admin', '/admin-console')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: user?.role === 'hospital_admin' ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF'
            }}
          >
            Hospital Admin
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch('super_admin', '/admin-console?tab=platform')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: user?.role === 'super_admin' ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF'
            }}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF'
            }}
          >
            Discover & Book
          </button>
          <button
            type="button"
            onClick={() => navigate('/emergency')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: 'rgba(184, 50, 69, 0.6)',
              color: '#FFFFFF'
            }}
          >
            Emergency 108
          </button>
        </div>
      </div>
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-main">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<SearchPage />} />
                <Route path="/hospital/:id" element={<HospitalDetailsPage />} />
                <Route path="/emergency" element={<EmergencyPage />} />

                {/* Protected Routes */}
                <Route
                  path="/patient-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['patient', 'super_admin']}>
                      <PatientDashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/doctor-portal"
                  element={
                    <ProtectedRoute allowedRoles={['doctor', 'super_admin']}>
                      <DoctorPortalPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin-console"
                  element={
                    <ProtectedRoute allowedRoles={['hospital_admin', 'super_admin']}>
                      <AdminConsolePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/teleconsult/room/:id"
                  element={
                    <ProtectedRoute>
                      <TeleconsultRoomPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Dedicated Independent Authentication Route (Clean split-screen, no sidebar/header) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* All other routes render within MainLayout */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
