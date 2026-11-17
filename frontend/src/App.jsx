import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
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
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
