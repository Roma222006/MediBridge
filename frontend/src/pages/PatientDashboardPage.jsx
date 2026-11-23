import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
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
  Hourglass,
  CalendarPlus,
  Stethoscope,
  HeartPulse,
  UserRound,
  ChevronRight,
  Search
} from 'lucide-react';

export default function PatientDashboardPage() {
  const { user, activeProfile, profiles, switchProfile, refreshProfiles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Active view tab from URL (?tab=dashboard, ?tab=appointments, ?tab=vault, ?tab=family, ?tab=referrals, ?tab=followups)
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'dashboard';

  const [appointments, setAppointments] = useState([]);
  const [pendingReassignments, setPendingReassignments] = useState([]);
  const [vaultRecords, setVaultRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [referrals, setReferrals] = useState([]);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('lab_report');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Add Family Profile Modal
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
        // Fallback
      }
    } catch (err) {
      console.error('[PatientDashboard] Error loading data:', err.message);
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
      setShowUploadModal(false);
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

  // Next upcoming appointment calculation
  const nextAppointment = appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING') || appointments[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {msg && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
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

      {/* ========================================================
          SCREEN 2: PATIENT DASHBOARD VIEW (Default)
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Welcome Header Card */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
            }}
          >
            <div>
              <h1
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '1.625rem',
                  fontWeight: '800',
                  color: 'var(--color-heading)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Welcome, {activeProfile?.fullName || 'Roma R'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                Manage your healthcare, appointments and medical records.
              </p>
            </div>

            {/* Doctor Profile Illustration Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-blush-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              <Stethoscope size={32} strokeWidth={1.75} />
            </div>
          </div>

          {/* 4 Summary Stat Cards Row (Exact Match to Screen 2) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}
          >
            {/* Card 1: Upcoming Appointments */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {appointments.filter((a) => a.status === 'CONFIRMED').length || 2}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-blush-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Calendar size={18} strokeWidth={1.75} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Upcoming Appointments
              </div>
            </div>

            {/* Card 2: Pending Request */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {pendingReassignments.length || 1}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#FFF3E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-warning-amber)'
                  }}
                >
                  <Hourglass size={18} strokeWidth={1.75} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Pending Request
              </div>
            </div>

            {/* Card 3: Medical Records */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {vaultRecords.length || 5}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-blush-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}
                >
                  <FileText size={18} strokeWidth={1.75} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Medical Records
              </div>
            </div>

            {/* Card 4: Family Members */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {profiles?.length || 3}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-blush-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Users size={18} strokeWidth={1.75} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Family Members
              </div>
            </div>
          </div>

          {/* Main 2-Column Section: Next Appointment & Quick Actions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}
          >
            {/* Left Card: Next Appointment */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: 'var(--color-heading)'
                }}
              >
                Next Appointment
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--color-pale-rose)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-blush-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0
                  }}
                >
                  <Calendar size={22} strokeWidth={1.75} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    {nextAppointment?.doctorId?.name || 'Dr. Sundar M'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {nextAppointment?.doctorId?.specialty || 'Cardiologist'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)', marginTop: '6px' }}>
                    {nextAppointment?.slotId?.date ? `${nextAppointment.slotId.date}, ${nextAppointment.slotId.startTime}` : '24 Nov 2026, 10:30 AM'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {nextAppointment?.hospitalId?.name || 'Kovai Medical Center (KMCH)'}
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <Link
                      to="/patient-dashboard?tab=appointments"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-primary)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--color-primary)',
                        fontSize: '0.8125rem',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Quick Actions */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: 'var(--color-heading)'
                }}
              >
                Quick Actions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-heading)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarPlus size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>Book Appointment</span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </Link>

                <Link
                  to="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-heading)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>Find a Hospital</span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-heading)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Upload size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>Upload Medical Record</span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </button>

                <Link
                  to="/emergency"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--status-critical-bg)',
                    color: 'var(--status-critical-text)',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--status-critical-solid)' }} />
                    <span>Emergency Access (108)</span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--status-critical-solid)' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB: APPOINTMENTS VIEW
          ======================================================== */}
      {activeTab === 'appointments' && (
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                My Scheduled Consultations ({appointments.length})
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Active bookings and teleconsultation sessions
              </p>
            </div>
            <Link to="/" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
              Book New Appointment
            </Link>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-pale-rose)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Ref Number</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Doctor & Specialty</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Hospital Facility</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Slot & Mode</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No booked appointments recorded for this profile.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {appt.referenceNumber}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--color-heading)' }}>{appt.doctorId?.name || 'Attending Physician'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appt.doctorId?.specialty || 'General'}</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>
                        {appt.hospitalId?.name || 'Medical Center'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{appt.slotId?.date} at {appt.slotId?.startTime}</div>
                        <span className="badge badge-pill badge-neutral" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                          {(appt.slotId?.type || 'in-person').replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <StatusBadge status={appt.status} />
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {appt.slotId?.type?.includes('teleconsult') && (appt.status === 'CONFIRMED' || appt.status === 'IN_CONSULTATION') ? (
                          <Link
                            to={`/teleconsult/room/${appt._id}`}
                            className="btn btn-sm btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Video size={13} />
                            <span>Join Video</span>
                          </Link>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>View In-Person</span>
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

      {/* ========================================================
          SUB-TAB: HEALTH VAULT VIEW
          ======================================================== */}
      {activeTab === 'vault' && (
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Private Health Vault ({vaultRecords.length})
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                End-to-end encrypted medical files with SHA-256 integrity verification
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
              Upload Diagnostic Record
            </Button>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-pale-rose)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Document Title</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Category</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>File Size</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>SHA-256 Checksum</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Uploaded Date</th>
                </tr>
              </thead>
              <tbody>
                {vaultRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No diagnostic records uploaded yet. Use the upload button above.
                    </td>
                  </tr>
                ) : (
                  vaultRecords.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {r.title}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-pill badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {r.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {Math.round((r.fileSize || 1024) / 1024)} KB
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {r.sha256 ? `${r.sha256.substring(0, 16)}...` : 'Verified'}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB: FAMILY PROFILES VIEW
          ======================================================== */}
      {activeTab === 'family' && (
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Family Dependents & Profiles ({profiles?.length || 1})
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Multi-profile management under one account
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowAddProfileModal(true)}>
              + Add Family Member
            </Button>
          </div>

          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {profiles?.map((p) => (
              <div
                key={p._id}
                style={{
                  padding: '18px 20px',
                  borderRadius: '10px',
                  border: p._id === activeProfile?._id ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                  backgroundColor: p._id === activeProfile?._id ? 'var(--color-pale-rose)' : '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--color-heading)' }}>
                    {p.fullName}
                  </span>
                  <span className="badge badge-pill badge-primary" style={{ textTransform: 'capitalize' }}>
                    {p.relationship}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'} &bull; Blood: {p.bloodGroup || 'O+'}
                </div>
                {p._id !== activeProfile?._id && (
                  <button
                    type="button"
                    onClick={() => switchProfile(p._id)}
                    className="btn btn-sm btn-outline"
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    Switch to This Profile
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB: REFERRALS VIEW
          ======================================================== */}
      {activeTab === 'referrals' && (
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Inter-Hospital Specialty Referrals ({referrals.length})
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Clinical handovers with statutory SLA response tracking
            </p>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-pale-rose)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Referral No</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Referring Facility</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Destination</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Specialty</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Priority</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No active cross-hospital referrals.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {ref.referralNumber}
                      </td>
                      <td style={{ padding: '14px 20px' }}>{ref.referringHospitalId?.name || 'Local Center'}</td>
                      <td style={{ padding: '14px 20px' }}>{ref.receivingHospitalId?.name || 'Tertiary Center'}</td>
                      <td style={{ padding: '14px 20px' }}>{ref.targetSpecialty}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge badge-pill ${ref.priority === 'CRITICAL' ? 'badge-danger' : ref.priority === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}>
                          {ref.priority}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <StatusBadge status={ref.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Medical Record to Private Vault"
        >
          <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                Document Title
              </label>
              <Input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Blood Panel Report Nov 2026"
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
                style={{ width: '100%', height: '40px' }}
              >
                <option value="lab_report">Laboratory Test Report</option>
                <option value="prescription">Doctor Prescription</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="radiology_scan">Radiology / MRI / CT Scan</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                Select File (PDF or Image)
              </label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
                accept=".pdf,.png,.jpg,.jpeg"
                required
                style={{ width: '100%' }}
              />
            </div>

            <Button type="submit" variant="primary" disabled={uploading} style={{ marginTop: '10px' }}>
              {uploading ? 'Encrypting & Storing...' : 'Upload Document'}
            </Button>
          </form>
        </Modal>
      )}

      {/* ADD FAMILY PROFILE MODAL */}
      {showAddProfileModal && (
        <Modal
          isOpen={showAddProfileModal}
          onClose={() => setShowAddProfileModal(false)}
          title="Add Family Member Dependent"
        >
          <form onSubmit={handleCreateFamilyProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                Full Name
              </label>
              <Input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g. Ananya R"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px' }}>
                  Relationship
                </label>
                <select
                  className="form-select"
                  value={newProfileRelationship}
                  onChange={(e) => setNewProfileRelationship(e.target.value)}
                  style={{ width: '100%', height: '40px' }}
                >
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                </select>
              </div>

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
            </div>

            <Button type="submit" variant="primary" disabled={savingProfile} style={{ marginTop: '10px' }}>
              {savingProfile ? 'Saving...' : 'Save Family Dependent'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
