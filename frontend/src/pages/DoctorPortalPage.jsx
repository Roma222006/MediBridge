import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Send,
  Lock,
  User,
  CheckCircle,
  XCircle,
  Phone,
  Search,
  RefreshCw,
  PlusCircle,
  FileCheck,
  Eye,
  X,
  Stethoscope,
  Info
} from 'lucide-react';

export default function DoctorPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('today'); // today, appointments, referrals, records, leave, profile
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Profile
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Today Schedule
  const [todayData, setTodayData] = useState(null);

  // Appointments Tab
  const [apptSubTab, setApptSubTab] = useState('upcoming'); // upcoming, completed, cancelled, all
  const [apptDateFilter, setApptDateFilter] = useState('');
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Referrals
  const [referralsList, setReferralsList] = useState([]);
  const [showCreateRefModal, setShowCreateRefModal] = useState(false);
  const [refPatientProfileId, setRefPatientProfileId] = useState('');
  const [refReceivingHospitalId, setRefReceivingHospitalId] = useState('');
  const [refSpecialty, setRefSpecialty] = useState('Cardiology');
  const [refPriority, setRefPriority] = useState('ROUTINE');
  const [refClinicalSummary, setRefClinicalSummary] = useState('');
  const [hospitalsCatalog, setHospitalsCatalog] = useState([]);
  const [submittingRef, setSubmittingRef] = useState(false);

  // Records / Consent Viewer
  const [vaultPatientId, setVaultPatientId] = useState('');
  const [patientRecords, setPatientRecords] = useState(null);
  const [vaultError, setVaultError] = useState(null);
  const [activeViewingRecord, setActiveViewingRecord] = useState(null);
  const [accessEnded, setAccessEnded] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);

  // Leave Requests
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Credential Documents & Profile Editing
  const [credentialDocs, setCredentialDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docUploadType, setDocUploadType] = useState('registration_certificate');
  const [docSelectedFile, setDocSelectedFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    regNumber: '',
    councilName: '',
    councilState: '',
    qualifications: '',
    specialty: '',
    subSpecialty: '',
    designation: '',
    department: '',
    experienceYears: 5,
    languagesSpoken: 'English, Tamil'
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadInitialData();

    // Socket listener for doctor private events
    if (user) {
      socket.emit('subscribe_doctor', user._id);

      socket.on('consent_revoked', (data) => {
        setAccessEnded(true);
        setActiveViewingRecord(null);
        setMsg({
          type: 'error',
          text: 'Patient revoked consent. Document viewer closed immediately (Access ended).'
        });
      });

      socket.on('doctor_leave_recorded', () => {
        loadLeaveRequests();
      });
    }

    return () => {
      socket.off('consent_revoked');
      socket.off('doctor_leave_recorded');
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointmentsTab();
    } else if (activeTab === 'leave') {
      loadLeaveRequests();
    } else if (activeTab === 'profile') {
      loadProfileData();
      loadCredentialDocs();
    }
  }, [activeTab, apptSubTab, apptDateFilter]);

  // Viewer Countdown
  useEffect(() => {
    let timer = null;
    if (activeViewingRecord && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            setAccessEnded(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeViewingRecord, countdownSeconds]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        // 1. Doctor Profile
        api.get('/doctor/profile').then((res) => {
          if (res.data?.success) setDoctorProfile(res.data.data);
        }).catch((err) => {
          console.warn('[DoctorPortal] Profile fetch warning:', err.response?.data?.error?.message || err.message);
        }),

        // 2. Today's Schedule
        api.get('/doctor/schedule').then((res) => {
          if (res.data?.success) setTodayData(res.data.data);
        }).catch((err) => {
          console.warn('[DoctorPortal] Schedule fetch warning:', err.response?.data?.error?.message || err.message);
        }),

        // 3. Specialty Referrals
        api.get('/doctor/referrals').then((res) => {
          if (res.data?.success) setReferralsList(res.data.data || []);
        }).catch((err) => {
          console.warn('[DoctorPortal] Referrals fetch warning:', err.response?.data?.error?.message || err.message);
        }),

        // 4. Hospitals Catalog for Referral Dispatch
        api.get('/search?district=Coimbatore').then((res) => {
          if (res.data?.success && res.data.data?.length > 0) {
            setHospitalsCatalog(res.data.data);
            setRefReceivingHospitalId(res.data.data[0].id || res.data.data[0]._id);
          }
        }).catch((err) => {
          console.warn('[DoctorPortal] Catalog fetch warning:', err.message);
        })
      ]);
    } catch (err) {
      console.error('[DoctorPortal] Initial load failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async () => {
    try {
      const res = await api.get('/doctor/profile');
      if (res.data.success) {
        setDoctorProfile(res.data.data);
        setProfileForm({
          name: res.data.data.name || '',
          regNumber: res.data.data.regNumber || '',
          councilName: res.data.data.councilName || '',
          councilState: res.data.data.councilState || '',
          qualifications: res.data.data.qualifications || '',
          specialty: res.data.data.specialty || '',
          subSpecialty: res.data.data.subSpecialty || '',
          designation: res.data.data.designation || '',
          department: res.data.data.department || '',
          experienceYears: res.data.data.experienceYears || 5,
          languagesSpoken: Array.isArray(res.data.data.languagesSpoken)
            ? res.data.data.languagesSpoken.join(', ')
            : 'English, Tamil'
        });
      }
    } catch (err) {
      console.error('[DoctorPortal] Profile load failed:', err.message);
    }
  };

  const loadCredentialDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/doctor/documents');
      if (res.data.success) {
        setCredentialDocs(res.data.data || []);
      }
    } catch (err) {
      console.error('[DoctorPortal] Document load failed:', err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docSelectedFile) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', docSelectedFile);
      formData.append('type', docUploadType);

      const res = await api.post('/doctor/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: 'Credential document uploaded successfully.' });
        setShowUploadDocModal(false);
        setDocSelectedFile(null);
        loadCredentialDocs();
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to upload credential document.'
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDoc = async (docId) => {
    try {
      const res = await api.get(`/doctor/documents/${docId}/download-url`);
      if (res.data.success) {
        window.open(res.data.data.downloadUrl, '_blank');
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to generate signed download link.'
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const langs = profileForm.languagesSpoken
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.patch('/doctor/profile', {
        ...profileForm,
        languagesSpoken: langs
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message || 'Profile updated successfully.' });
        setShowEditProfileModal(false);
        loadProfileData();
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update professional profile.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const loadAppointmentsTab = async () => {
    setLoadingAppts(true);
    try {
      let queryUrl = `/doctor/schedule?tab=${apptSubTab}`;
      if (apptDateFilter) queryUrl += `&date=${apptDateFilter}`;
      const res = await api.get(queryUrl);
      if (res.data.success) {
        setAppointmentsList(res.data.data.appointments || []);
      }
    } catch (err) {
      console.error('[DoctorPortal] Appointments tab error:', err.message);
    } finally {
      setLoadingAppts(false);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const res = await api.get('/doctor/leave-requests');
      if (res.data.success) {
        setLeaveRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('[DoctorPortal] Leave requests error:', err.message);
    }
  };

  // State Transition (Checked-In -> In Consultation -> Completed)
  const handleTransitionStatus = async (appointmentId, targetStatus, currentVersion) => {
    try {
      const res = await api.patch(`/doctor/appointments/${appointmentId}/status`, {
        status: targetStatus,
        version: currentVersion
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Appointment status advanced to ${targetStatus}` });
        // Refresh schedule and appointments
        const schedRes = await api.get('/doctor/schedule');
        if (schedRes.data.success) setTodayData(schedRes.data.data);
        if (activeTab === 'appointments') loadAppointmentsTab();
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Status transition rejected.'
      });
    }
  };

  // Create Referral Dispatch
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!refPatientProfileId || !refReceivingHospitalId || !refClinicalSummary) return;

    setSubmittingRef(true);
    try {
      const dedupeKey = `REF_${user._id}_${refPatientProfileId}_${refSpecialty}_${new Date().toISOString().split('T')[0]}`;
      const res = await api.post('/referrals', {
        patientProfileId: refPatientProfileId,
        receivingHospitalId: refReceivingHospitalId,
        targetSpecialty: refSpecialty,
        priority: refPriority,
        clinicalSummary: refClinicalSummary,
        dedupeKey
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: `Referral ${res.data.data.referralNumber} successfully dispatched.` });
        setShowCreateRefModal(false);
        setRefClinicalSummary('');
        // Reload referrals
        const refRes = await api.get('/doctor/referrals');
        if (refRes.data.success) setReferralsList(refRes.data.data);
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to dispatch referral.'
      });
    } finally {
      setSubmittingRef(false);
    }
  };

  // Withdraw Referral
  const handleWithdrawReferral = async (referralId) => {
    try {
      const res = await api.patch(`/referrals/${referralId}/withdraw`, {
        reason: 'Clinician withdrew referral'
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: 'Referral withdrawn.' });
        const refRes = await api.get('/doctor/referrals');
        if (refRes.data.success) setReferralsList(refRes.data.data);
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Withdrawal failed.'
      });
    }
  };

  // Vault Record Query
  const handleFetchRecords = async (e) => {
    e.preventDefault();
    if (!vaultPatientId) return;

    setVaultError(null);
    setPatientRecords(null);
    setAccessEnded(false);

    try {
      const res = await api.get(`/vault/records?patientProfileId=${vaultPatientId}`);
      if (res.data.success) {
        setPatientRecords(res.data.data);
      }
    } catch (err) {
      const errCode = err.response?.data?.error?.code;
      setVaultError(
        errCode === 'CONSENT_REQUIRED_OR_REVOKED'
          ? 'Access Denied: Patient has not granted active consent or consent was revoked (HTTP 403).'
          : err.response?.data?.error?.message || 'Access denied.'
      );
    }
  };

  // Open Watermarked Viewer
  const handleOpenViewer = async (record) => {
    setAccessEnded(false);
    setCountdownSeconds(60);
    try {
      const res = await api.get(`/vault/records/${record._id}/download-url`);
      if (res.data.success) {
        setActiveViewingRecord({
          ...record,
          downloadUrl: res.data.data.downloadUrl
        });
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: 'Access Denied: ' + (err.response?.data?.error?.message || 'Consent expired or revoked.')
      });
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) return;

    setSubmittingLeave(true);
    try {
      const idempotencyKey = `req_leave_${user._id}_${leaveStartDate}_${Date.now()}`;
      const res = await api.post('/doctor/leave-request', {
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason,
        idempotencyKey
      });

      if (res.data.success) {
        setMsg({
          type: 'success',
          text: `Leave request submitted for ${leaveStartDate} to ${leaveEndDate}. Pending hospital admin approval.`
        });
        setShowLeaveModal(false);
        setLeaveReason('');
        loadLeaveRequests();
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to submit leave request.'
      });
    } finally {
      setSubmittingLeave(false);
    }
  };

  const mainTabs = [
    { id: 'today', label: "Today's Clinic", icon: Clock, count: todayData?.count },
    { id: 'appointments', label: 'Appointments Ledger', icon: Calendar },
    { id: 'referrals', label: 'Specialty Referrals', icon: Send, count: referralsList?.length },
    { id: 'records', label: 'Consented Health Vault', icon: Lock },
    { id: 'leave', label: 'Leave Requests', icon: Calendar },
    { id: 'profile', label: 'Doctor Credentials', icon: User }
  ];

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Skeleton variant="card" height="120px" className="mb-4" />
        <Skeleton variant="card" height="300px" />
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <PageHeader
        title={doctorProfile?.name || 'Doctor Clinical Desk'}
        subtitle={`Specialty: ${doctorProfile?.specialty || 'Physician'} | Hospital: ${doctorProfile?.hospital?.name || 'Medical Center'} | Reg: ${doctorProfile?.regNumber || 'Demo, not verified'}`}
        breadcrumbs={[
          { label: 'Portal', path: '/doctor-portal' },
          { label: 'Clinical Desk' }
        ]}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaveModal(true)}
              icon={<Calendar size={14} />}
            >
              Request Leave
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateRefModal(true)}
              icon={<PlusCircle size={14} />}
            >
              Dispatch Referral
            </Button>
          </div>
        }
      />

      {/* Explanatory Clinical Desk Guide Banner */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--color-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 600px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} style={{ color: 'var(--color-primary)' }} />
              Doctor Clinical Operations Portal
            </h2>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Welcome to your outpatient clinical workspace. Manage your daily consultation queue, launch secure WebRTC video sessions, verify and review patient diagnostic files under active consent (DPDP Act 2023), coordinate inter-hospital specialty handovers, and manage your Medical Council licensing.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.75rem' }}>
              Role: Attending Physician
            </span>
            <span className="badge badge-pill badge-info" style={{ fontSize: '0.75rem' }}>
              Hospital Tenant Guard Active
            </span>
          </div>
        </div>
      </div>

      {/* Doctor Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          fontSize: '0.8125rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-badge)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--color-heading)',
              fontWeight: '700',
              fontSize: '0.75rem',
              border: '1px solid var(--border)'
            }}
          >
            {doctorProfile?.verificationStatus === 'VERIFIED' ? 'Verified Practitioner' : 'Demo, not verified'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Hospital Tenant: <strong>{doctorProfile?.hospital?.name || 'Assigned Facility'}</strong> ({doctorProfile?.hospital?.district || 'Coimbatore'})
          </span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Consultation Fee: ₹{doctorProfile?.consultationFee || 500} &bull; Modes: {doctorProfile?.consultModes?.teleconsult ? 'Teleconsult' : ''} {doctorProfile?.consultModes?.inPerson ? '+ In-Person' : ''}
        </div>
      </div>

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

      {/* Main Tabs Navigation */}
      <Tabs tabs={mainTabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* TAB 1: TODAY'S SCHEDULE */}
      {activeTab === 'today' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Today's Clinic Consultations ({todayData?.count || 0})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Date: {todayData?.date} &bull; Confirmed patients attending outpatient or teleconsultation
              </p>
            </div>
            <span className="badge badge-pill badge-neutral">
              {todayData?.count || 0} Scheduled
            </span>
          </div>

          {/* Tab 1 Guidance Strip */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Clock size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              <strong>Active Clinic Workflow:</strong> In-person patients arrive at reception and display <strong>CHECKED IN</strong>. For remote visits, click <strong>Enter Consult Room</strong> to open the encrypted WebRTC consultation. Click <strong>Begin Consultation</strong> to call a patient, and <strong>Complete Visit</strong> when concluding the encounter.
            </span>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Time</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reference</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patient (Age)</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contact</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mode</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {!todayData?.appointments || todayData.appointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <EmptyState title="No consultations today" description="No outpatient visits or teleconsultations are booked for today's session." />
                    </td>
                  </tr>
                ) : (
                  todayData.appointments.map((appt) => (
                    <tr key={appt._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>
                        {appt.startTime} - {appt.endTime}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {appt.referenceNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>{appt.patientProfileId?.fullName || 'Patient'}</span>{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          ({appt.patientAge ? `${appt.patientAge}y` : 'Age N/A'}, {appt.patientProfileId?.gender || 'N/A'})
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {appt.patientProfileId?.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {appt.type === 'consultation_tele' ? (
                          <span className="badge badge-pill badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Video size={12} /> Teleconsult
                          </span>
                        ) : (
                          <span className="badge badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={12} /> In-Person
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={appt.status} />
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {appt.type === 'consultation_tele' ? (
                            <a
                              href={`/teleconsult/room/${appt._id}`}
                              className="btn btn-sm btn-primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              <Video size={13} /> Enter Consult Room
                            </a>
                          ) : (
                            <>
                              {(appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN') && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleTransitionStatus(appt._id, 'IN_CONSULTATION', appt.version)}
                                >
                                  Begin Consultation
                                </Button>
                              )}
                              {appt.status === 'IN_CONSULTATION' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleTransitionStatus(appt._id, 'COMPLETED', appt.version)}
                                >
                                  Complete Visit
                                </Button>
                              )}
                              {appt.status === 'COMPLETED' && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--status-success-accent)', fontWeight: '600' }}>
                                  ✓ Completed
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS LEDGER */}
      {activeTab === 'appointments' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${apptSubTab === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setApptSubTab('upcoming')}
              >
                Upcoming Consults
              </button>
              <button
                type="button"
                className={`btn btn-sm ${apptSubTab === 'completed' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setApptSubTab('completed')}
              >
                Completed Visits
              </button>
              <button
                type="button"
                className={`btn btn-sm ${apptSubTab === 'cancelled' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setApptSubTab('cancelled')}
              >
                Cancelled / No-Show
              </button>
              <button
                type="button"
                className={`btn btn-sm ${apptSubTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setApptSubTab('all')}
              >
                All Records
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input
                type="date"
                value={apptDateFilter}
                onChange={(e) => setApptDateFilter(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
              />
              {apptDateFilter && (
                <Button variant="outline" size="sm" onClick={() => setApptDateFilter('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Tab 2 Guidance Strip */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Calendar size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              <strong>Appointments Ledger:</strong> Filter consultations across all dates. Use the sub-tabs to switch between Upcoming visits, Completed encounters, and Cancelled appointments. Click 'Room' to enter scheduled teleconsultation rooms.
            </span>
          </div>

          <div className="table-container">
            {loadingAppts ? (
              <div style={{ padding: '30px' }}><Skeleton height="150px" /></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date & Time</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Ref #</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patient Name & Age</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Service</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mode</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px' }}>
                        <EmptyState title="No appointments match this filter" description="Try selecting another tab or clearing the date filter." />
                      </td>
                    </tr>
                  ) : (
                    appointmentsList.map((appt) => (
                      <tr key={appt._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600' }}>
                          {appt.date} &bull; {appt.startTime}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                          {appt.referenceNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: '600' }}>{appt.patientProfileId?.fullName || 'Patient'}</span>{' '}
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            ({appt.patientAge ? `${appt.patientAge}y` : 'Age N/A'}, {appt.patientProfileId?.gender || 'N/A'})
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {appt.serviceId?.name || 'Consultation'} (₹{appt.consultationFee})
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-pill badge-neutral">
                            {appt.type === 'consultation_tele' ? 'Teleconsult' : 'In-Person'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={appt.status} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {appt.type === 'consultation_tele' ? (
                            <a href={`/teleconsult/room/${appt._id}`} className="btn btn-sm btn-outline">
                              Room
                            </a>
                          ) : (
                            appt.status === 'IN_CONSULTATION' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleTransitionStatus(appt._id, 'COMPLETED', appt.version)}
                              >
                                Complete
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SPECIALTY REFERRALS */}
      {activeTab === 'referrals' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Specialty Referrals Inbox ({referralsList.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Rural-to-city clinical handover queue &bull; Tracked from Sent to Completed
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateRefModal(true)}
              icon={<PlusCircle size={14} />}
            >
              Create New Referral
            </Button>
          </div>

          {/* Tab 3 Guidance Strip */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Send size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              <strong>Inter-Hospital Specialty Handover:</strong> Dispatch patients requiring specialized tertiary evaluation. Triaged by priority SLA: <strong>Critical (12h)</strong>, <strong>Urgent (24h)</strong>, and <strong>Routine (48h)</strong>.
            </span>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Referral #</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Origin</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patient</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Priority</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Summary</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {referralsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <EmptyState title="No active referrals in queue" description="Referrals dispatched to your specialty or originating from your visits appear here." />
                    </td>
                  </tr>
                ) : (
                  referralsList.map((ref) => (
                    <tr key={ref._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {ref.referralNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                        {ref.referringHospitalId?.name || 'Clinic'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600' }}>
                        {ref.patientProfileId?.fullName || 'Patient'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`badge badge-pill ${ref.priority === 'CRITICAL' ? 'badge-critical' : ref.priority === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}
                        >
                          {ref.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', maxWidth: '280px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {ref.clinicalSummary}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={ref.status} />
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {ref.status === 'SENT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWithdrawReferral(ref._id)}
                          >
                            Withdraw
                          </Button>
                        )}
                        {ref.status === 'REJECTED' && ref.alternativeHospitals?.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--status-critical-text)', fontWeight: '600' }}>
                            {ref.alternativeHospitals.length} Alternatives available
                          </span>
                        )}
                        {ref.status === 'COMPLETED' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--status-success-accent)', fontWeight: '600' }}>
                            ✓ Care Completed
                          </span>
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

      {/* TAB 4: CONSENTED HEALTH VAULT */}
      {activeTab === 'records' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Consent-Gated Patient Diagnostic Documents
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Requires active, unexpired, and unrevoked patient consent under the Digital Personal Data Protection (DPDP) Act 2023. Instant 403 Forbidden is enforced upon patient revocation.
            </p>
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Lock size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              <strong>Clinical Vault Access:</strong> Enter the Patient Profile ID (from today's clinic schedule or referral) to request and verify consent. Verified records can be opened in the watermarked viewer, which automatically terminates access after 60 seconds.
            </span>
          </div>

          <form onSubmit={handleFetchRecords} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', maxWidth: '420px' }}>
              <Input
                type="text"
                placeholder="Enter Patient Profile ID to verify consent"
                value={vaultPatientId}
                onChange={(e) => setVaultPatientId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary" icon={<Lock size={14} />}>
              Verify Consent & Retrieve Records
            </Button>
          </form>

          {vaultError && (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--status-critical-bg)',
                color: 'var(--status-critical-text)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid var(--status-critical-solid)',
                marginBottom: '16px',
                fontSize: '0.875rem'
              }}
            >
              <AlertTriangle size={18} />
              <span>{vaultError}</span>
            </div>
          )}

          {patientRecords && (
            <div>
              <div
                style={{
                  backgroundColor: 'var(--status-success-bg)',
                  color: 'var(--status-success-text)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--status-success-accent)',
                  marginBottom: '16px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShieldCheck size={18} />
                <span>
                  Active Patient Consent Verified &bull; <strong>{patientRecords.length}</strong> record(s) available for clinical review.
                </span>
              </div>

              <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Document Title</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>File Name</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Size</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Version</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Viewer Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientRecords.map((rec) => (
                      <tr key={rec._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', fontSize: '0.875rem' }}>{rec.title}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8125rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                          {rec.category.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {rec.fileName}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {(rec.fileSizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge badge-pill badge-neutral">v{rec.version}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenViewer(rec)}
                            icon={<Eye size={12} />}
                          >
                            Open Watermarked Viewer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LEAVE REQUESTS */}
      {activeTab === 'leave' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Doctor Leave Requests ({leaveRequests.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Submit absence requests to hospital administration &bull; Admin records leave and handles patient reassignment
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowLeaveModal(true)}
              icon={<PlusCircle size={14} />}
            >
              Submit Leave Request
            </Button>
          </div>

          {/* Tab 5 Guidance Strip */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Calendar size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              <strong>Absence & Coverage Arrangement:</strong> When you file leave, hospital administration is notified. The admin records your absence in the hospital roster and reassigns any affected patient bookings to cover doctors.
            </span>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Start Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>End Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reason</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Admin Action / Event</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <EmptyState title="No leave requests filed" description="Use the button above to request planned absence for clinical administrative approval." />
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((req) => (
                    <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>{req.startDate}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>{req.endDate}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)' }}>{req.reason}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`badge badge-pill ${req.status === 'RECORDED_BY_ADMIN' ? 'badge-success' : req.status === 'DECLINED' ? 'badge-critical' : 'badge-warning'}`}
                        >
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {req.recordedEventId ? (
                          <span style={{ fontFamily: 'monospace' }}>Event: {req.recordedEventId}</span>
                        ) : req.adminNotes ? (
                          <span>{req.adminNotes}</span>
                        ) : (
                          <span>Awaiting review</span>
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

      {/* TAB 6: DOCTOR PROFILE & CREDENTIALS */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Credentials Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                  Attending Physician Credentials & Licensing
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Official medical council credentials. Hospital affiliation is managed by platform administration.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setShowEditProfileModal(true)}>
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Official Verification Badge Banner */}
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>
                  Verification Status
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: doctorProfile?.verificationStatus === 'VERIFIED' ? 'var(--color-primary)' : 'var(--text)' }}>
                  {doctorProfile?.verificationBadgeText || 'Status pending'}
                </span>
              </div>
              <span className={`badge badge-pill ${doctorProfile?.verificationStatus === 'VERIFIED' ? 'badge-primary' : doctorProfile?.verificationStatus === 'DEMO_NOT_VERIFIED' ? 'badge-neutral' : 'badge-warning'}`}>
                {doctorProfile?.verificationStatus?.replace(/_/g, ' ') || 'PENDING'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Full Practitioner Name
                </label>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '4px', color: 'var(--text)' }}>
                  {doctorProfile?.name}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Medical Council Registration #
                </label>
                <div style={{ fontSize: '0.9375rem', fontFamily: 'monospace', fontWeight: '600', marginTop: '4px', color: 'var(--color-heading)' }}>
                  {doctorProfile?.regNumber}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Council & State
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  {doctorProfile?.councilName} ({doctorProfile?.councilState})
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Specialty & Sub-Specialty
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  {doctorProfile?.specialty} {doctorProfile?.subSpecialty ? `(${doctorProfile.subSpecialty})` : ''}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Qualifications & Experience
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  {doctorProfile?.qualifications} &bull; {doctorProfile?.experienceYears} yrs exp.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Department & Designation
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  {doctorProfile?.designation} &bull; {doctorProfile?.department}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Languages Spoken
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  {Array.isArray(doctorProfile?.languagesSpoken) ? doctorProfile.languagesSpoken.join(', ') : 'English, Tamil'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Hospital Affiliation
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  {doctorProfile?.hospital?.name} ({doctorProfile?.hospital?.district})
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                  Consultation Fee & Modes
                </label>
                <div style={{ fontSize: '0.9375rem', fontWeight: '600', marginTop: '4px', color: 'var(--text)' }}>
                  ₹{doctorProfile?.consultationFee} &bull; In-Person: {doctorProfile?.consultModes?.inPerson ? 'Yes' : 'No'} &bull; Teleconsult: {doctorProfile?.consultModes?.teleconsult ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Credential Documents Table */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                  Credential Documents & Certificates
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Registration and degree certificates stored in secure private storage with SHA-256 integrity verification.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowUploadDocModal(true)}>
                Upload Document
              </Button>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Name</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Size</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Version</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SHA-256 Checksum</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Uploaded</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDocs ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center' }}>
                        <Skeleton height="20px" width="60%" />
                      </td>
                    </tr>
                  ) : credentialDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No credential documents uploaded yet. Upload your State Medical Council registration certificate.
                      </td>
                    </tr>
                  ) : (
                    credentialDocs.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '700', fontSize: '0.8125rem' }}>
                          {doc.type === 'registration_certificate' ? 'Registration Certificate' : doc.type === 'degree_certificate' ? 'Degree Certificate' : 'Other Certificate'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.8125rem' }}>{doc.fileName}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(doc.fileSize / 1024).toFixed(1)} KB
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.8125rem' }}>v{doc.version}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {doc.sha256?.substring(0, 16)}...
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadDoc(doc.id)}>
                            Download (60s URL)
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Audit Thread */}
          {doctorProfile?.verificationHistory?.length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Administrative Verification Audit History
              </h4>
              <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stage</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comments / Lookup Source</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorProfile.verificationHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '700', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                          {item.stage} Stage
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '0.8125rem' }}>{item.reviewerRole}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`badge badge-pill ${item.status === 'VERIFIED' ? 'badge-primary' : 'badge-neutral'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '0.8125rem' }}>
                          <div>{item.comments}</div>
                          {item.lookupSource && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Source: {item.lookupSource} ({item.lookupOutcome})
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: SUBMIT LEAVE REQUEST */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Request Leave of Absence"
      >
        <form onSubmit={handleSubmitLeave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                Start Date
              </label>
              <Input
                type="date"
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                End Date
              </label>
              <Input
                type="date"
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Reason for Absence
            </label>
            <Input
              type="text"
              placeholder="e.g. Conference attendance, medical emergency"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingLeave}>
              {submittingLeave ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: DISPATCH REFERRAL */}
      <Modal
        isOpen={showCreateRefModal}
        onClose={() => setShowCreateRefModal(false)}
        title="Dispatch Clinical Referral"
      >
        <form onSubmit={handleCreateReferral}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Patient Profile ID
            </label>
            <Input
              type="text"
              placeholder="Enter Patient Profile ID"
              value={refPatientProfileId}
              onChange={(e) => setRefPatientProfileId(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                Receiving Hospital
              </label>
              <select
                value={refReceivingHospitalId}
                onChange={(e) => setRefReceivingHospitalId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-control)',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--surface)'
                }}
                required
              >
                {hospitalsCatalog.map((h) => (
                  <option key={h.id || h._id} value={h.id || h._id}>
                    {h.name} ({h.address?.district || 'Coimbatore'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                Priority Level
              </label>
              <select
                value={refPriority}
                onChange={(e) => setRefPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-control)',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--surface)'
                }}
              >
                <option value="ROUTINE">Routine (48h)</option>
                <option value="URGENT">Urgent (24h)</option>
                <option value="CRITICAL">Critical (12h)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
              Clinical Summary & Findings
            </label>
            <textarea
              rows="4"
              value={refClinicalSummary}
              onChange={(e) => setRefClinicalSummary(e.target.value)}
              placeholder="Enter structured clinical justification for specialized referral..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-control)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setShowCreateRefModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingRef}>
              {submittingRef ? 'Dispatching...' : 'Dispatch Referral'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: WATERMARKED VIEWER */}
      {activeViewingRecord && (
        <Modal
          isOpen={!!activeViewingRecord}
          onClose={() => setActiveViewingRecord(null)}
          title={`Clinical Viewer: ${activeViewingRecord.title}`}
        >
          {accessEnded ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <XCircle size={48} style={{ color: 'var(--status-critical-text)', margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--status-critical-text)', fontSize: '1.25rem' }}>
                Access Ended
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Patient consent has expired or was revoked. This document viewer has been securely closed.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveViewingRecord(null)} className="mt-4">
                Close Viewer
              </Button>
            </div>
          ) : (
            <div>
              {/* Top Watermark & Expiry Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  marginBottom: '14px',
                  fontSize: '0.8125rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--status-success-accent)' }} />
                  <span>Licensed to: <strong>{doctorProfile?.name}</strong></span>
                </div>
                <div style={{ color: 'var(--status-warning-accent)', fontWeight: '700' }}>
                  <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Session expires in: {countdownSeconds}s
                </div>
              </div>

              {/* Watermarked Document Preview Surface */}
              <div
                style={{
                  position: 'relative',
                  minHeight: '340px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '24px'
                }}
              >
                {/* Visual Watermark Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    color: 'rgba(184, 61, 131, 0.08)',
                    letterSpacing: '0.1em',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  CONFIDENTIAL MEDICAL RECORD<br />
                  VIEWED BY {doctorProfile?.name?.toUpperCase()}<br />
                  DO NOT DISTRIBUTE
                </div>

                <FileText size={48} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                  {activeViewingRecord.fileName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Size: {(activeViewingRecord.fileSizeBytes / 1024).toFixed(1)} KB &bull; SHA-256 Verified
                </div>

                <div style={{ marginTop: '20px' }}>
                  <a
                    href={`http://localhost:5000${activeViewingRecord.downloadUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    Download Direct Stream (60s Token)
                  </a>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL 4: EDIT DOCTOR PROFILE & CREDENTIALS */}
      {showEditProfileModal && (
        <Modal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          title="Edit Professional Credentials"
        >
          <form onSubmit={handleSaveProfile}>
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                marginBottom: '16px',
                fontSize: '0.8125rem',
                color: 'var(--status-critical-accent)'
              }}
            >
              <strong>Notice:</strong> Modifying your Practitioner Name, Council Registration #, Council Name, or Qualifications will automatically reset your verification status to <strong>Submitted</strong> and pause new bookings until reviewed.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Practitioner Full Name
                </label>
                <Input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Medical Council Registration #
                </label>
                <Input
                  type="text"
                  value={profileForm.regNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, regNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Medical Council Name
                </label>
                <Input
                  type="text"
                  value={profileForm.councilName}
                  onChange={(e) => setProfileForm({ ...profileForm, councilName: e.target.value })}
                  placeholder="e.g. Tamil Nadu Medical Council"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Council State
                </label>
                <Input
                  type="text"
                  value={profileForm.councilState}
                  onChange={(e) => setProfileForm({ ...profileForm, councilState: e.target.value })}
                  placeholder="e.g. Tamil Nadu"
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                Qualifications (Degrees, Institutions, Years)
              </label>
              <Input
                type="text"
                value={profileForm.qualifications}
                onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Primary Specialty
                </label>
                <Input
                  type="text"
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Sub-Specialty (Optional)
                </label>
                <Input
                  type="text"
                  value={profileForm.subSpecialty}
                  onChange={(e) => setProfileForm({ ...profileForm, subSpecialty: e.target.value })}
                  placeholder="e.g. Interventional Cardiology"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Designation
                </label>
                <Input
                  type="text"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Department
                </label>
                <Input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Experience (Years)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={profileForm.experienceYears}
                  onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                  Languages Spoken (comma-separated)
                </label>
                <Input
                  type="text"
                  value={profileForm.languagesSpoken}
                  onChange={(e) => setProfileForm({ ...profileForm, languagesSpoken: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowEditProfileModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: UPLOAD CREDENTIAL DOCUMENT */}
      {showUploadDocModal && (
        <Modal
          isOpen={showUploadDocModal}
          onClose={() => {
            setShowUploadDocModal(false);
            setDocSelectedFile(null);
          }}
          title="Upload Credential Certificate"
        >
          <form onSubmit={handleUploadDoc}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                Certificate Document Type
              </label>
              <select
                className="input"
                value={docUploadType}
                onChange={(e) => setDocUploadType(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="registration_certificate">State Medical Council Registration Certificate</option>
                <option value="degree_certificate">Primary Medical Degree / Post-Graduate Certificate</option>
                <option value="other">Other Professional Fellowship / License Certificate</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                File Attachment (PDF, JPG, PNG &bull; Max 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocSelectedFile(e.target.files?.[0] || null)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8125rem'
                }}
                required
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Files undergo magic-byte signature validation and SHA-256 cryptographic hashing upon upload.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowUploadDocModal(false);
                  setDocSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={uploadingDoc || !docSelectedFile}>
                {uploadingDoc ? 'Uploading...' : 'Upload & Verify'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
