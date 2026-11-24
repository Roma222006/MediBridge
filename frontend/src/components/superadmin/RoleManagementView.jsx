import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Building2,
  Lock,
  Check,
  X,
  Edit,
  Save,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';

const PERMISSION_CATALOG = [
  // Patient Permissions
  { id: 'patient.dashboard.view', label: 'View Patient Dashboard', role: 'patient' },
  { id: 'hospitals.discover', label: 'Search & Discover Hospitals', role: 'patient' },
  { id: 'appointments.book', label: 'Book OPD Appointments', role: 'patient' },
  { id: 'appointments.view_own', label: 'View Own Bookings', role: 'patient' },
  { id: 'appointments.cancel_own', label: 'Cancel Own Bookings', role: 'patient' },
  { id: 'vault.manage', label: 'Manage Health Vault Records', role: 'patient' },
  { id: 'consent.grant_revoke', label: 'Grant & Revoke Doctor Consent', role: 'patient' },
  { id: 'family.manage', label: 'Manage Family Profiles', role: 'patient' },
  { id: 'referrals.view_own', label: 'View Own Tertiary Referrals', role: 'patient' },
  { id: 'followups.view_own', label: 'View Clinical Follow-ups', role: 'patient' },

  // Doctor Permissions
  { id: 'doctor.dashboard.view', label: 'View Clinical Doctor Dashboard', role: 'doctor' },
  { id: 'doctor.profile.edit', label: 'Edit Professional Bio & Qualifications', role: 'doctor' },
  { id: 'doctor.credentials.submit', label: 'Submit State Medical Council Credentials', role: 'doctor' },
  { id: 'availability.manage', label: 'Manage Clinical Schedule & Duty Hours', role: 'doctor' },
  { id: 'appointments.view_assigned', label: 'View Assigned OPD Queue', role: 'doctor' },
  { id: 'clinical_desk.manage', label: 'Execute Consultations & Teleconsult', role: 'doctor' },
  { id: 'prescriptions.write', label: 'Generate & Sign Digital Prescriptions', role: 'doctor' },
  { id: 'diagnostics.request', label: 'Order Diagnostic Tests', role: 'doctor' },
  { id: 'referrals.initiate_accept', label: 'Initiate & Accept Referrals', role: 'doctor' },
  { id: 'patient_records.view_consented', label: 'Read Consented Health Records', role: 'doctor' },

  // Hospital Admin Permissions
  { id: 'hospital.dashboard.view', label: 'View Hospital Administrative Dashboard', role: 'hospital_admin' },
  { id: 'hospital.profile.manage', label: 'Update Hospital Profile & Facility Data', role: 'hospital_admin' },
  { id: 'doctors.manage', label: 'Add & Manage Medical Staff', role: 'hospital_admin' },
  { id: 'doctors.verify_hospital_stage', label: 'Stage 1 Hospital Credential Review', role: 'hospital_admin' },
  { id: 'departments.manage', label: 'Manage Clinical Departments', role: 'hospital_admin' },
  { id: 'services.manage', label: 'Manage Hospital Medical Services', role: 'hospital_admin' },
  { id: 'slots.manage', label: 'Generate & Manage OPD Time Slots', role: 'hospital_admin' },
  { id: 'appointments.coordinate', label: 'Coordinate Facility Appointments', role: 'hospital_admin' },
  { id: 'cancellations.reassign', label: 'Execute Doctor Replacement Reassignments', role: 'hospital_admin' },
  { id: 'beds.broadcast_capacity', label: 'Broadcast Live 108 Emergency Beds', role: 'hospital_admin' },
  { id: 'referrals.coordinate', label: 'Coordinate Inbound & Outbound Patient Transfers', role: 'hospital_admin' },
  { id: 'hospital.reports.view', label: 'Access Hospital Operational Analytics', role: 'hospital_admin' },
  { id: 'hospital.audit.view', label: 'Review Institutional Audit Logs', role: 'hospital_admin' },

  // Super Admin Permissions
  { id: 'platform.dashboard.view', label: 'View Platform Overview Dashboard', role: 'super_admin' },
  { id: 'hospitals.manage_all', label: 'Manage All Registered Healthcare Centers', role: 'super_admin' },
  { id: 'hospitals.approve_reject', label: 'Approve & Reject Hospital Empanelments', role: 'super_admin' },
  { id: 'users.manage_all', label: 'Manage All Platform Accounts & Sessions', role: 'super_admin' },
  { id: 'roles.manage_matrix', label: 'Configure Role-Permission Matrix', role: 'super_admin' },
  { id: 'monitoring.view_telemetry', label: 'Inspect Live Microservice Health & Latency', role: 'super_admin' },
  { id: 'incidents.manage', label: 'Open, Triage & Resolve Operational Incidents', role: 'super_admin' },
  { id: 'audit.view_platform_chain', label: 'Inspect Immutable Platform Audit Trail', role: 'super_admin' },
  { id: 'reports.generate_statewide', label: 'Generate Statewide Healthcare Reports & CSV', role: 'super_admin' },
  { id: 'system.configure_settings', label: 'Configure Governance & Security Policies', role: 'super_admin' }
];

export default function RoleManagementView({ onToast }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState('patient');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/roles');
      if (res.data?.success) {
        setRoles(res.data.data);
        const current = res.data.data.find((r) => r.role === activeRole) || res.data.data[0];
        if (current) {
          setSelectedPermissions(current.permissions || []);
        }
      }
    } catch (err) {
      console.error('[Role Management] Error loading roles:', err);
      if (onToast) onToast('Failed to load role permissions matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSelectRole = (rName) => {
    setActiveRole(rName);
    const target = roles.find((r) => r.role === rName);
    if (target) {
      setSelectedPermissions(target.permissions || []);
    }
    setHasChanges(false);
  };

  const handleTogglePermission = (permId) => {
    if (activeRole === 'super_admin' && permId === 'platform.dashboard.view') {
      if (onToast) onToast('Core platform dashboard permission cannot be removed from Super Administrator.');
      return;
    }

    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/super-admin/roles/${activeRole}`, {
        permissions: selectedPermissions,
        reason: 'Authorized permission adjustment in Role Management matrix'
      });

      if (res.data?.success) {
        if (onToast) onToast(`Permissions updated and enforced on backend for ${activeRole}.`);
        setHasChanges(false);
        fetchRoles();
      }
    } catch (err) {
      console.error('[Save Permissions] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  const currentRoleDoc = roles.find((r) => r.role === activeRole);
  const rolePermissionsList = PERMISSION_CATALOG.filter((p) => p.role === activeRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.625rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            Role & Permission Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Central role-based access control (RBAC) governance matrix enforced across all API endpoints.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRoles}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border, #E8E3E5)',
            backgroundColor: '#FFFFFF',
            color: 'var(--color-heading, #702B59)',
            fontSize: '0.8125rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Reload Matrix</span>
        </button>
      </div>

      {/* 4 Role Selector Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {[
          { id: 'patient', name: 'Patient', icon: UserCheck, desc: 'Citizens & health vault managers' },
          { id: 'doctor', name: 'Clinical Doctor', icon: Stethoscope, desc: 'OPD & teleconsult specialists' },
          { id: 'hospital_admin', name: 'Hospital Admin', icon: Building2, desc: 'Facility & bed telemetry coordinators' },
          { id: 'super_admin', name: 'Super Admin', icon: ShieldCheck, desc: 'State Directorate platform governance' }
        ].map((r) => {
          const Icon = r.icon;
          const isSelected = activeRole === r.id;
          const rDoc = roles.find((item) => item.role === r.id);
          return (
            <div
              key={r.id}
              onClick={() => handleSelectRole(r.id)}
              style={{
                backgroundColor: isSelected ? '#FAF6F7' : '#FFFFFF',
                border: isSelected ? '2px solid var(--color-primary, #B83D83)' : '1px solid var(--border, #E8E3E5)',
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 14px rgba(184, 61, 131, 0.12)' : '0 2px 6px rgba(112, 43, 89, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--color-blush-pink, #F8DDE3)' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? 'var(--color-primary, #B83D83)' : 'var(--color-heading, #702B59)'
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading, #702B59)' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>
                    {rDoc?.userCount || 0} active users
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', lineHeight: '1.4' }}>
                {r.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix Panel for Selected Role */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        {/* Panel Header with Save Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
              Permissions Matrix: {currentRoleDoc?.name || activeRole}
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
              {selectedPermissions.length} of {rolePermissionsList.length} permissions granted &bull; Enforced via backend RBAC middleware
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasChanges && (
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#B77A32' }}>
                Unsaved changes pending
              </span>
            )}
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={!hasChanges || saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: hasChanges ? 'var(--color-primary, #B83D83)' : '#E8E3E5',
                color: hasChanges ? '#FFFFFF' : 'var(--text-muted, #702B59)',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: '800',
                cursor: hasChanges && !saving ? 'pointer' : 'not-allowed',
                boxShadow: hasChanges ? '0 2px 8px rgba(184, 61, 131, 0.25)' : 'none'
              }}
            >
              <Save size={14} />
              <span>{saving ? 'Enforcing...' : 'Save & Enforce Permissions'}</span>
            </button>
          </div>
        </div>

        {/* Permissions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          {rolePermissionsList.map((perm) => {
            const isGranted = selectedPermissions.includes(perm.id);
            return (
              <div
                key={perm.id}
                onClick={() => handleTogglePermission(perm.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '8px',
                  border: isGranted ? '1px solid #86EFAC' : '1px solid var(--border, #E8E3E5)',
                  backgroundColor: isGranted ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={isGranted}
                  onChange={() => {}} // Handled by parent div
                  style={{ accentColor: 'var(--color-primary, #B83D83)', marginTop: '3px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text, #29252A)' }}>
                    {perm.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {perm.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Notice */}
        <div style={{ marginTop: '24px', padding: '14px 16px', borderRadius: '8px', backgroundColor: '#FAF6F7', border: '1px solid var(--border, #E8E3E5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={18} style={{ color: 'var(--color-primary, #B83D83)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-heading, #702B59)', lineHeight: '1.45' }}>
            <strong>Backend Security Protocol:</strong> Permission matrix updates are validated on the server. Unauthorized role elevation or attempting to strip core platform permissions is automatically rejected and logged in the immutable audit trail.
          </span>
        </div>
      </div>
    </div>
  );
}
