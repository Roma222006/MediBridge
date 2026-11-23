import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

import SearchPage from './pages/SearchPage';
import HospitalDetailsPage from './pages/HospitalDetailsPage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import DoctorPortalPage from './pages/DoctorPortalPage';
import AdminConsolePage from './pages/AdminConsolePage';
import EmergencyPage from './pages/EmergencyPage';
import TeleconsultRoomPage from './pages/TeleconsultRoomPage';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

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

  // Not authenticated -> redirect to clean login screen
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but unauthorized role -> redirect to their role's home workspace
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'patient') return <Navigate to="/patient-dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor-portal" replace />;
    if (user.role === 'hospital_admin') return <Navigate to="/admin-console" replace />;
    if (user.role === 'super_admin') return <Navigate to="/admin-console?tab=platform" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="demo-banner">
        <div>
          <span className="demo-badge">Techthon 2026</span>
          <span>Demonstration Environment — Synthetic Health Data (Visionet Techthon Round 2)</span>
        </div>
        <div>
          <span>Sri Shakthi Institute of Engineering & Technology</span>
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

          {/* All other routes render within MainLayout */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
