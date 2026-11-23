import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import {
  ShieldAlert,
  Stethoscope,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function RoleAccessGate({ requiredPortal, allowedRoles = [] }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  const getPortalInfo = () => {
    switch (requiredPortal) {
      case 'doctor':
        return {
          title: 'Doctor Clinical Desk',
          roleName: 'Attending Physician',
          badge: 'Doctor Portal (Restricted)',
          icon: <Stethoscope size={28} style={{ color: 'var(--color-primary)' }} />,
          description:
            'Access to the clinical desk is restricted to licensed Attending Physicians and Super-Administrators. This portal manages confidential patient consultations, prescription ledgers, DPDP-consented diagnostic records, and inter-hospital specialty handovers.',
          quickOptions: [
            {
              name: 'Dr. M. Revathi',
              title: 'Attending Cardiologist — KMCH Coimbatore',
              email: 'dr.revathi@medibridge.org',
              pass: 'DoctorPass123!'
            },
            {
              name: 'Dr. P. Arumugam',
              title: 'General Medicine — Kongu District GH Pollachi',
              email: 'dr.arumugam@medibridge.org',
              pass: 'DoctorPass123!'
            }
          ]
        };
      case 'hospital_admin':
        return {
          title: 'Hospital Operations Console',
          roleName: 'Hospital Administrator',
          badge: 'Hospital Administration (Restricted)',
          icon: <Building2 size={28} style={{ color: 'var(--color-primary)' }} />,
          description:
            'Access is restricted to authorized Hospital Administrators. This console manages live General and ICU bed capacities, scheduling of diagnostic slots, clinician leave coverage, and patient intake queues.',
          quickOptions: [
            {
              name: 'KMCH Hospital Admin',
              title: 'Tertiary Care Center — Peelamedu, Coimbatore',
              email: 'admin.kmch@medibridge.org',
              pass: 'AdminPass123!'
            },
            {
              name: 'PSG Hospitals Admin',
              title: 'Academic Medical Center — Peelamedu, Coimbatore',
              email: 'admin.psg@medibridge.org',
              pass: 'AdminPass123!'
            }
          ]
        };
      case 'super_admin':
        return {
          title: 'Super-Admin Platform Governance',
          roleName: 'Super Administrator',
          badge: 'Statewide Platform Governance (Restricted)',
          icon: <ShieldCheck size={28} style={{ color: 'var(--color-primary)' }} />,
          description:
            'Access is restricted to State Platform Overseers and Super-Administrators. This console manages multi-hospital network registry, State Medical Council practitioner verification, and statewide audit trails.',
          quickOptions: [
            {
              name: 'Super Administrator',
              title: 'Statewide Healthcare Coordination & Council Verification',
              email: 'superadmin@medibridge.org',
              pass: 'SuperAdmin123!'
            }
          ]
        };
      case 'patient':
      default:
        return {
          title: 'Patient Health Vault & Appointments',
          roleName: 'Registered Patient',
          badge: 'Patient Portal (Restricted)',
          icon: <Calendar size={28} style={{ color: 'var(--color-primary)' }} />,
          description:
            'Access is restricted to verified Patients and Family Dependents. Manage your appointments, multi-profile dependents, DPDP Act 2023 consent records, and SHA-256 encrypted diagnostic files.',
          quickOptions: [
            {
              name: 'Roma R',
              title: 'Patient & Family Care Account (CMCHIS & Star Health)',
              email: 'roma.patient@medibridge.org',
              pass: 'PatientPass123!'
            },
            {
              name: 'Ragavi R',
              title: 'Patient Account',
              email: 'ragavi.patient@medibridge.org',
              pass: 'PatientPass123!'
            }
          ]
        };
    }
  };

  const portal = getPortalInfo();

  const handleQuickSwitch = async (email, password) => {
    setSwitching(true);
    setError(null);
    try {
      await login(email, password);
      // Auth state update in AuthContext automatically re-evaluates ProtectedRoute
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please check credentials.');
      setSwitching(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '780px',
        margin: '40px auto',
        padding: '0 20px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* Portal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-blush-pink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {portal.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.375rem',
                  fontWeight: '800',
                  color: 'var(--color-heading)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {portal.title}
              </h2>
              <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.75rem' }}>
                {portal.badge}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Authentication & Role Verification Required
            </p>
          </div>
        </div>

        {/* Current Identity & Explanation Banner */}
        <div
          style={{
            backgroundColor: 'var(--color-pale-rose)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <ShieldAlert size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)', marginBottom: '4px' }}>
                Current Session: {user ? `${user.name || user.email} (${user.role.replace('_', ' ')})` : 'Unauthenticated (Guest)'}
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {portal.description}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-critical-bg)',
              color: 'var(--status-critical-text)',
              border: '1px solid var(--status-critical-solid)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* One-Click Role Switcher */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: '700',
                color: 'var(--color-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Instant 1-Click Access ({portal.roleName} Demo Accounts)
            </span>
            <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.7rem' }}>
              Pre-configured Roles
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {portal.quickOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={switching}
                onClick={() => handleQuickSwitch(opt.email, opt.pass)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: switching ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  if (!switching) {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--color-pale-rose)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!switching) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {opt.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: 'var(--color-blush-pink)',
                        color: 'var(--color-heading)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {opt.email}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {opt.title}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.875rem' }}>
                  <span>{switching ? 'Signing in...' : 'Sign In & Enter'}</span>
                  <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Return to Healthcare Discovery
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Custom Account Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
