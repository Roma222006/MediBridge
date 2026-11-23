import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import {
  Calendar,
  FileText,
  Shield,
  Activity,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Video,
  FileCheck,
  Lock,
  ArrowRight,
  Users,
  Send,
  PlusCircle,
  Clock,
  Building2,
  UserCheck,
  ShieldCheck,
  HeartPulse,
  PhoneCall
} from 'lucide-react';

export default function PatientDashboardPage() {
  const { user, activeProfile, profiles, switchProfile, refreshProfiles } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pendingReassignments, setPendingReassignments] = useState([]);
  const [vaultRecords, setVaultRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('lab_report');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Add Family Profile Modal State
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDob, setNewProfileDob] = useState('2000-01-01');
  const [newProfileGender, setNewProfileGender] = useState('male');
  const [newProfileBlood, setNewProfileBlood] = useState('O+');
  const [newProfileRelationship, setNewProfileRelationship] = useState('child');
  const [newProfilePhone, setNewProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user && activeProfile) {
      loadData();
    }
  }, [user, activeProfile]);

  const loadData = async () => {
    try {
      // 1. My Bookings
      const apptRes = await api.get('/bookings/my-bookings');
      if (apptRes.data?.success) setAppointments(apptRes.data.data || []);

      // 2. Pending Reassignments
      const reassRes = await api.get('/reassignments/pending');
      if (reassRes.data?.success) setPendingReassignments(reassRes.data.data || []);

      // 3. Vault records
      const vaultRes = await api.get(`/vault/records?patientProfileId=${activeProfile._id}`);
      if (vaultRes.data?.success) setVaultRecords(vaultRes.data.data || []);

      // 4. Consents
      const consentRes = await api.get(`/vault/consents?patientProfileId=${activeProfile._id}`);
      if (consentRes.data?.success) setConsents(consentRes.data.data || []);

      // 5. Access Logs
      const logRes = await api.get(`/vault/access-logs?patientProfileId=${activeProfile._id}`);
      if (logRes.data?.success) setAccessLogs(logRes.data.data || []);

      // 6. My Referrals
      try {
        const refRes = await api.get('/referrals/my-referrals');
        if (refRes.data?.success) setReferrals(refRes.data.data || []);
      } catch (e) {
        // Fallback gracefully
      }
    } catch (err) {
      console.error('[PatientDashboard] Error loading data:', err.message);
    }
  };

  const handleResolveReassignment = async (appointmentId, choice, slotId) => {
    try {
      await api.post(`/reassignments/resolve/${appointmentId}`, {
        choice,
        replacementSlotId: slotId
      });
      setMsg({ type: 'success', text: `Reassignment resolved: ${choice.replace(/_/g, ' ')}` });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Resolution failed.' });
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('category', uploadCategory);
    formData.append('patientProfileId', activeProfile._id);

    try {
      await api.post('/vault/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg({ type: 'success', text: 'Document uploaded securely to Health Vault.' });
      setUploadFile(null);
      setUploadTitle('');
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    try {
      await api.patch(`/vault/consent/${consentId}/revoke`, { reason: 'Patient initiated immediate revocation' });
      setMsg({ type: 'success', text: 'Consent revoked immediately. Clinical access blocked.' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to revoke consent.' });
    }
  };

  const handleCreateFamilyProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.post('/patient-profiles', {
        fullName: newProfileName,
        dateOfBirth: newProfileDob,
        gender: newProfileGender,
        bloodGroup: newProfileBlood,
        relationship: newProfileRelationship,
        phone: newProfilePhone || user.phone
      });
      if (res.data?.success) {
        setMsg({ type: 'success', text: `Family profile created for ${newProfileName}.` });
        setShowAddProfileModal(false);
        setNewProfileName('');
        await refreshProfiles();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Failed to create family profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const tabsConfig = [
    { id: 'appointments', label: 'My Appointments', count: appointments.length, icon: Calendar },
    { id: 'vault', label: 'Health Vault', count: vaultRecords.length, icon: FileText },
    { id: 'family', label: `Family Profiles (${profiles?.length || 1})`, icon: Users },
    { id: 'referrals', label: `Specialty Referrals (${referrals.length})`, icon: Send },
    { id: 'consents', label: 'Doctor Consents', count: consents.length, icon: Shield },
    { id: 'logs', label: 'Access Audit Logs', count: accessLogs.length, icon: Activity }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <PageHeader
        breadcrumbs={[{ label: 'Patient Services', href: '/patient-dashboard' }, { label: 'Care Portal' }]}
        title="Patient Care Portal & Health Vault"
        subtitle={`Active Profile: ${activeProfile?.fullName || user?.name || 'Patient'} (${activeProfile?.relationship || 'Self'}) • Family ID: ${activeProfile?._id || ''}`}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/" className="btn btn-sm btn-outline" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={14} />
              <span>Book Appointment</span>
            </Link>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={14} />}
              onClick={() => setShowAddProfileModal(true)}
            >
              Add Dependent
            </Button>
          </div>
        }
      />

      {/* Patient Profile Summary & Quick Stats Banner */}
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)', margin: 0 }}>
                {activeProfile?.fullName || user?.name || 'Patient'}
              </h2>
              <span className="badge badge-pill badge-primary" style={{ textTransform: 'capitalize' }}>
                {activeProfile?.relationship || 'Self'}
              </span>
              <span className="badge badge-pill badge-neutral">
                Blood Group: {activeProfile?.bloodGroup || 'Unknown'}
              </span>
              <span className="badge badge-pill badge-success">
                Govt Scheme: CMCHIS Empaneled
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              DOB: {activeProfile?.dateOfBirth ? new Date(activeProfile.dateOfBirth).toLocaleDateString() : 'N/A'} &bull; Contact: {activeProfile?.phone || user?.phone || 'N/A'} &bull; Protected under DPDP Act 2023
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', textAlign: 'center', minWidth: '95px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Bookings</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>{appointments.length}</div>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', textAlign: 'center', minWidth: '95px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Vault Files</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)', marginTop: '2px' }}>{vaultRecords.length}</div>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', textAlign: 'center', minWidth: '95px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Consents</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--status-success-accent)', marginTop: '2px' }}>{consents.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {msg && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '0.875rem',
            backgroundColor: msg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-critical-bg)',
            color: msg.type === 'success' ? 'var(--status-success-text)' : 'var(--status-critical-text)',
            border: `1px solid ${msg.type === 'success' ? 'var(--status-success-accent)' : 'var(--status-critical-solid)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{msg.text}</span>
          <button
            onClick={() => setMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: '700' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Prominent Doctor Leave & Reassignment Banner */}
      {pendingReassignments.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-accent)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 20px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-warning-text)' }}>
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--status-warning-text)', margin: 0 }}>
              Action Required: Attending Physician on Leave & Appointment Reassignment
            </h3>
          </div>
          <p style={{ margin: '6px 0 16px 0', fontSize: '0.8125rem', color: 'var(--text)' }}>
            Your doctor has an unavoidable medical absence. MediBridge has preserved your slot with certified options:
          </p>

          {pendingReassignments.map((appt) => (
            <div
              key={appt._id}
              style={{
                backgroundColor: 'var(--surface)',
                padding: '16px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ color: 'var(--color-heading)' }}>Appointment {appt.referenceNumber}</strong> &bull; {appt.hospitalId?.name}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Original Doctor: {appt.doctorId?.name} &bull; Scheduled: {appt.date} at {appt.startTime}
                  </div>
                </div>
                <StatusBadge status="REASSIGNMENT_PENDING" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {/* Option 1: Suggested Specialist */}
                <div style={{ border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)', padding: '12px', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                    Option 1: Suggested Specialist
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: 'var(--text)' }}>
                    {appt.reassignmentDetails?.suggestedDoctorId?.name || 'Dr. M. Revathi (Cardiology)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Slot: {appt.date} at 10:30 AM
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      handleResolveReassignment(
                        appt._id,
                        'SUGGESTED_DOCTOR',
                        appt.reassignmentDetails?.suggestedSlotId?._id || appt.reassignmentDetails?.suggestedSlotId
                      )
                    }
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Accept Specialist
                  </Button>
                </div>

                {/* Option 2: Same Doctor Reschedule */}
                <div style={{ border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)', padding: '12px', backgroundColor: 'var(--surface)' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                    Option 2: Same Doctor Next Date
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: 'var(--text)' }}>
                    Keep {appt.doctorId?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Rescheduled to next available open OPD
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleResolveReassignment(
                        appt._id,
                        'SAME_DOCTOR_NEW_DATE',
                        appt.reassignmentDetails?.suggestedSlotId?._id || appt.reassignmentDetails?.suggestedSlotId
                      )
                    }
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Reschedule Same Doctor
                  </Button>
                </div>

                {/* Option 3: Urgent Emergency */}
                <div style={{ border: '1px solid var(--status-critical-bg)', borderRadius: 'var(--radius-control)', padding: '12px', backgroundColor: 'var(--status-critical-bg)' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--status-critical-text)' }}>
                    Urgent / Emergency Case?
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--status-critical-text)' }}>
                    Cancel routine visit and route directly to trauma triage.
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleResolveReassignment(appt._id, 'EMERGENCY_REDIRECT')}
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Emergency Redirect (108)
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Tab 1: Appointments Table */}
      {activeTab === 'appointments' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                My Scheduled Consultations ({appointments.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Track outpatient hospital visits and access remote video teleconsultation rooms.
              </p>
            </div>
            <Link to="/" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
              Find Doctor & Slot
            </Link>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reference</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patient</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hospital / Facility</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Doctor / Service</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date & Time</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mode</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No appointments booked yet. Use Hospital Discovery to book a consultation.</p>
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {appt.referenceNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600' }}>
                        {appt.patientProfileId?.fullName}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                        {appt.hospitalId?.name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {appt.doctorId?.name || appt.serviceId?.name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                        {appt.date} at {appt.startTime}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-pill ${appt.type === 'consultation_tele' ? 'badge-info' : 'badge-neutral'}`}>
                          {appt.type === 'consultation_tele' ? 'Teleconsult' : 'In-Person'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={appt.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {appt.type === 'consultation_tele' && ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(appt.status) && (
                          <a
                            href={`/teleconsult/room/${appt._id}`}
                            className="btn btn-sm btn-primary"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Video size={13} strokeWidth={1.75} aria-hidden="true" />
                            <span>Join Video Room</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Health Vault */}
      {activeTab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Upload Widget */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Upload Clinical Document to Private Health Vault
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Secure cloud storage with SHA-256 cryptographic integrity verification. Accessible to doctors only with your explicit consent.
            </p>
            <form onSubmit={handleFileUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Document Title
                </label>
                <Input
                  type="text"
                  placeholder="e.g. MRI Brain Scan Report"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  className="form-select"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)' }}
                >
                  <option value="radiology_scan">Radiology / MRI / CT Scan</option>
                  <option value="lab_report">Laboratory Test Report</option>
                  <option value="prescription">Official Prescription</option>
                  <option value="discharge_summary">Hospital Discharge Summary</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  File Attachment (PDF, JPG, PNG &le; 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                  style={{ display: 'block', width: '100%', padding: '6px', fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <Button type="submit" variant="primary" loading={uploading} disabled={uploading} icon={<Upload size={14} />} style={{ width: '100%', height: '38px' }}>
                  {uploading ? 'Validating...' : 'Upload File'}
                </Button>
              </div>
            </form>
          </div>

          {/* Stored Records */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Stored Health Documents ({vaultRecords.length})
              </h3>
            </div>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Document Title</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Version</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Size</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SHA-256 Checksum</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        No clinical documents stored in vault yet.
                      </td>
                    </tr>
                  ) : (
                    vaultRecords.map((rec) => (
                      <tr key={rec._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-heading)' }}>{rec.title}</td>
                        <td style={{ padding: '12px 16px', textTransform: 'capitalize', fontSize: '0.8125rem' }}>{rec.category?.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '12px 16px' }}><span className="badge badge-pill badge-neutral">v{rec.version}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{(rec.fileSizeBytes / 1024).toFixed(1)} KB</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rec.sha256Hash?.substring(0, 16)}...
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(rec.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Family Profiles */}
      {activeTab === 'family' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Registered Family Dependents
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Manage appointments and medical records for dependents under one primary account.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setShowAddProfileModal(true)}>
              Add Family Member
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {profiles?.map((prof) => {
              const isSelected = prof._id === activeProfile?._id;
              return (
                <div
                  key={prof._id}
                  className="card"
                  style={{
                    padding: '20px',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--bg-subtle)' : '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {prof.fullName}
                      </h4>
                      <span className="badge badge-pill badge-neutral" style={{ textTransform: 'capitalize', marginTop: '4px', display: 'inline-block' }}>
                        {prof.relationship}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="badge badge-pill badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Active
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '16px', lineHeight: '1.6' }}>
                    <div>Gender: <strong>{prof.gender}</strong> &bull; Blood: <strong>{prof.bloodGroup}</strong></div>
                    <div>DOB: {new Date(prof.dateOfBirth).toLocaleDateString()}</div>
                    <div>Phone: {prof.phone || 'N/A'}</div>
                  </div>

                  {!isSelected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchProfile(prof._id)}
                      style={{ width: '100%' }}
                    >
                      Switch to this Profile
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Specialty Referrals */}
      {activeTab === 'referrals' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Inter-Hospital Specialty Referrals ({referrals.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Referrals initiated by your attending physicians to specialized hospitals in Coimbatore.
            </p>
          </div>
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Referral #</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Referring Clinic</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Receiving Hospital</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Specialty</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Priority</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Summary</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      No active referrals dispatched for this patient profile.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {ref.referralNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                        {ref.referringHospitalId?.name || 'Primary Clinic'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', fontWeight: '600' }}>
                        {ref.receivingHospitalId?.name || 'Tertiary Center'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                        {ref.targetSpecialty}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-pill ${ref.priority === 'CRITICAL' ? 'badge-critical' : ref.priority === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}>
                          {ref.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={ref.status} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                        {ref.clinicalSummary}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Doctor Consents */}
      {activeTab === 'consents' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Active & Ephemeral Doctor Consent Grants (DPDP Act 2023)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Doctors can access your health records only with active consent. Clicking 'Revoke' immediately terminates their clinical access.
            </p>
          </div>
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Doctor</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hospital Facility</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Purpose</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expires At</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      No active consent records granted.
                    </td>
                  </tr>
                ) : (
                  consents.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-heading)' }}>{c.grantedToDoctorId?.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>{c.grantedToHospitalId?.name || 'City Facility'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>{c.purpose}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>{new Date(c.expiresAt).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.status === 'ACTIVE' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRevokeConsent(c._id)}
                          >
                            Revoke Now
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Patient Access History Log */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Append-Only Patient Access History Log
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Complete legal audit trail of health record access events, purpose, exact timestamps, and access authorization decisions.
            </p>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actor Role</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actor Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Decision</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Purpose / Denial Reason</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      No access log events recorded yet.
                    </td>
                  </tr>
                ) : (
                  accessLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700' }}>{log.actorRole}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-heading)' }}>{log.actorName || 'User'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>{log.action}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-pill ${log.accessGranted ? 'badge-success' : 'badge-danger'}`}>
                          {log.accessGranted ? 'ALLOWED' : 'DENIED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {log.clinicalPurpose || log.denialReason || 'Standard verification'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPENDENT FAMILY MEMBER */}
      {showAddProfileModal && (
        <Modal
          isOpen={showAddProfileModal}
          onClose={() => setShowAddProfileModal(false)}
          title="Add Dependent Family Member"
        >
          <form onSubmit={handleCreateFamilyProfile}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                Full Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Ramesh S"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={newProfileDob}
                  onChange={(e) => setNewProfileDob(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Relationship
                </label>
                <select
                  value={newProfileRelationship}
                  onChange={(e) => setNewProfileRelationship(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)' }}
                >
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="other">Other Dependent</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Gender
                </label>
                <select
                  value={newProfileGender}
                  onChange={(e) => setNewProfileGender(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Blood Group
                </label>
                <select
                  value={newProfileBlood}
                  onChange={(e) => setNewProfileBlood(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)' }}
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowAddProfileModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Adding...' : 'Add Family Profile'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
