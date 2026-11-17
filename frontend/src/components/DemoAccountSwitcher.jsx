import React from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div
      style={{
        backgroundColor: '#EDF5F3',
        border: '1px dashed #147D78',
        borderRadius: '6px',
        padding: '10px 14px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}
    >
      <div style={{ fontSize: '0.8125rem', color: '#102D3A', fontWeight: '600' }}>
        Live Demo Switcher (1-Click Role Access):
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {demoAccounts.map((acc) => (
          <button
            key={acc.email}
            onClick={() => handleQuickLogin(acc)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
          >
            {acc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
