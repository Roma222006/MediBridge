import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users } from 'lucide-react';

export default function DemoAccountSwitcher() {
  const { login } = useAuth();

  const demoAccounts = [
    { label: 'Patient (Lead: Roma)', email: 'roma.patient@medibridge.org', role: 'patient' },
    { label: 'Patient (Peer: Ragavi)', email: 'ragavi.patient@medibridge.org', role: 'patient' },
    { label: 'Doctor (City: Dr. Revathi)', email: 'dr.revathi@medibridge.org', role: 'doctor' },
    { label: 'Doctor (Rural: Dr. Arumugam)', email: 'dr.arumugam@medibridge.org', role: 'doctor' },
    { label: 'Hospital Admin (KMCH)', email: 'admin.kmch@medibridge.org', role: 'hospital_admin' },
    { label: 'Super Admin', email: 'superadmin@medibridge.org', role: 'super_admin' }
  ];

  const handleQuickLogin = async (acc) => {
    let password = 'PatientPass123!';
    if (acc.role === 'doctor') password = 'DoctorPass123!';
    if (acc.role === 'hospital_admin') password = 'AdminPass123!';
    if (acc.role === 'super_admin') password = 'SuperAdmin123!';

    try {
      await login(acc.email, password);
    } catch (err) {
      alert('Login failed. Ensure seed data has been executed: ' + err.message);
    }
  };

  return (
    <div className="demo-account-switcher">
      <div className="demo-switcher-label">
        <Users size={14} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--color-heading)' }} />
        <span>Live Demo Switcher (1-Click Role Access):</span>
      </div>
      <div className="demo-switcher-buttons">
        {demoAccounts.map((acc) => (
          <button
            key={acc.email}
            onClick={() => handleQuickLogin(acc)}
            className="btn btn-sm btn-secondary"
            style={{ height: '28px', fontSize: 'var(--text-label)', padding: '0 8px' }}
          >
            {acc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
