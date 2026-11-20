import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

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
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
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
              <Routes>
                <Route path="/" element={<SearchPage />} />
                <Route path="/hospital/:id" element={<HospitalDetailsPage />} />
                <Route path="/emergency" element={<EmergencyPage />} />
                <Route path="/login" element={<LoginPage />} />

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
            </main>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
