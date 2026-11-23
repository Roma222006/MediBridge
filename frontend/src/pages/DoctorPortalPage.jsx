import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
  Info,
  Check,
  UserCheck
} from 'lucide-react';

export default function DoctorPortalPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse tab from URL (e.g. ?tab=appointments, ?tab=credentials, ?tab=desk, ?tab=profile)
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Profile data
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Today Schedule
  const [todayData, setTodayData] = useState(null);

  // Appointments Tab Sub-selection
  const [apptSubTab, setApptSubTab] = useState('today'); // today, pending, upcoming, history
  const [apptDateFilter, setApptDateFilter] = useState('');
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Default Mock Datasets for Reference UI Alignment (Screens 4, 5, 6)
  const [pendingRequests, setPendingRequests] = useState([
    { id: 'req-1', patient: 'Anitha K', dateTime: '24 Nov, 11:00 AM', mode: 'Online', reason: 'Follow-up' },
    { id: 'req-2', patient: 'Karthik S', dateTime: '24 Nov, 12:00 PM', mode: 'In-Person', reason: 'Consultation' },
    { id: 'req-3', patient: 'Priya R', dateTime: '24 Nov, 02:30 PM', mode: 'Online', reason: 'Review Report' },
    { id: 'req-4', patient: 'Meena M', dateTime: '24 Nov, 04:00 PM', mode: 'In-Person', reason: 'Routine Check' }
  ]);

  const [screen5Appointments, setScreen5Appointments] = useState([
    { id: 'apt-1', time: '09:00 AM', patient: 'Priya R', mode: 'In-Person', reason: 'Check-up', status: 'Completed', actionType: 'view', sub: 'today' },
    { id: 'apt-2', time: '10:00 AM', patient: 'Arun K', mode: 'Online', reason: 'Consultation', status: 'In Progress', actionType: 'consult', sub: 'today' },
    { id: 'apt-3', time: '11:00 AM', patient: 'Anitha K', mode: 'Online', reason: 'Follow-up', status: 'Pending', actionType: 'accept', sub: 'pending' },
    { id: 'apt-4', time: '12:00 PM', patient: 'Karthik S', mode: 'In-Person', reason: 'Consultation', status: 'Pending', actionType: 'accept', sub: 'pending' },
    { id: 'apt-5', time: '02:00 PM', patient: 'Suresh V', mode: 'Online', reason: 'Cardiology Follow-up', status: 'Confirmed', actionType: 'consult', sub: 'upcoming' },
    { id: 'apt-6', time: '03:30 PM', patient: 'Deepa N', mode: 'In-Person', reason: 'ECG Review', status: 'Confirmed', actionType: 'view', sub: 'upcoming' },
    { id: 'apt-7', time: '04:30 PM', patient: 'Rajesh M', mode: 'In-Person', reason: 'Post-Op Check', status: 'Confirmed', actionType: 'view', sub: 'upcoming' },
    { id: 'apt-8', time: '05:15 PM', patient: 'Kavitha S', mode: 'Online', reason: 'Lab Review', status: 'Confirmed', actionType: 'consult', sub: 'upcoming' }
  ]);

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
    name: 'Dr. Sundar M',
    regNumber: 'TNMC-123456',
    councilName: 'Tamil Nadu Medical Council',
    councilState: 'Tamil Nadu',
    qualifications: 'MBBS, MD (Cardiology)',
    specialty: 'Cardiology',
    subSpecialty: 'Interventional Cardiology',
    designation: 'Senior Consultant Cardiologist',
    department: 'Cardiology',
    experienceYears: 8,
    languagesSpoken: 'English, Tamil'
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadInitialData();

    if (user) {
      socket.emit('subscribe_doctor', user._id);

      socket.on('consent_revoked', () => {
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
    if (currentTab === 'appointments') {
      loadAppointmentsTab();
    } else if (currentTab === 'leave' || currentTab === 'availability') {
      loadLeaveRequests();
    } else if (currentTab === 'profile' || currentTab === 'credentials') {
      loadProfileData();
      loadCredentialDocs();
    }
  }, [currentTab, apptSubTab, apptDateFilter]);

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
    try {
      await Promise.allSettled([
        api.get('/doctor/profile').then((res) => {
          if (res.data?.success && res.data.data) {
            setDoctorProfile(res.data.data);
            setProfileForm({
              name: res.data.data.name || 'Dr. Sundar M',
              regNumber: res.data.data.regNumber || 'TNMC-123456',
              councilName: res.data.data.councilName || 'Tamil Nadu Medical Council',
              councilState: res.data.data.councilState || 'Tamil Nadu',
              qualifications: res.data.data.qualifications || 'MBBS, MD (Cardiology)',
              specialty: res.data.data.specialty || 'Cardiology',
              subSpecialty: res.data.data.subSpecialty || 'Interventional Cardiology',
              designation: res.data.data.designation || 'Senior Consultant Cardiologist',
              department: res.data.data.department || 'Cardiology',
              experienceYears: res.data.data.experienceYears || 8,
              languagesSpoken: Array.isArray(res.data.data.languagesSpoken)
                ? res.data.data.languagesSpoken.join(', ')
                : 'English, Tamil'
            });
          }
        }),

        api.get('/doctor/schedule').then((res) => {
          if (res.data?.success && res.data.data) {
            setTodayData(res.data.data);
          }
        }),

        api.get('/doctor/referrals').then((res) => {
          if (res.data?.success) setReferralsList(res.data.data || []);
        }),

        api.get('/search?district=Coimbatore').then((res) => {
          if (res.data?.success && res.data.data?.length > 0) {
            setHospitalsCatalog(res.data.data);
            setRefReceivingHospitalId(res.data.data[0].id || res.data.data[0]._id);
          }
        })
      ]);
    } catch (err) {
      console.warn('[DoctorPortal] Initial load note:', err.message);
    }
  };

  const loadProfileData = async () => {
    try {
      const res = await api.get('/doctor/profile');
      if (res.data?.success && res.data.data) {
        setDoctorProfile(res.data.data);
      }
    } catch (err) {
      console.warn('[DoctorPortal] Profile load note:', err.message);
    }
  };

  const loadCredentialDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/doctor/documents');
      if (res.data?.success) {
        setCredentialDocs(res.data.data || []);
      }
    } catch (err) {
      console.warn('[DoctorPortal] Document load note:', err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadAppointmentsTab = async () => {
    setLoadingAppts(true);
    try {
      let queryUrl = `/doctor/schedule?tab=${apptSubTab}`;
      if (apptDateFilter) queryUrl += `&date=${apptDateFilter}`;
      const res = await api.get(queryUrl);
      if (res.data?.success && res.data.data?.appointments) {
        setAppointmentsList(res.data.data.appointments);
      }
    } catch (err) {
      console.warn('[DoctorPortal] Appointments tab error:', err.message);
    } finally {
      setLoadingAppts(false);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const res = await api.get('/doctor/leave-requests');
      if (res.data?.success) {
        setLeaveRequests(res.data.data || []);
      }
    } catch (err) {
      console.warn('[DoctorPortal] Leave requests note:', err.message);
    }
  };

  // State Transition (Checked-In -> In Consultation -> Completed)
  const handleTransitionStatus = async (appointmentId, targetStatus, currentVersion) => {
    try {
      const res = await api.patch(`/doctor/appointments/${appointmentId}/status`, {
        status: targetStatus,
        version: currentVersion
      });
      if (res.data?.success) {
        setMsg({ type: 'success', text: `Appointment status advanced to ${targetStatus}` });
        const schedRes = await api.get('/doctor/schedule');
        if (schedRes.data?.success) setTodayData(schedRes.data.data);
      }
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Status transition rejected.'
      });
    }
  };

  const handleAcceptRequest = (req) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setMsg({ type: 'success', text: `Appointment confirmed for ${req.patient} (${req.dateTime}).` });
  };

  const handleRejectRequest = (req) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setMsg({ type: 'error', text: `Appointment request rejected for ${req.patient}.` });
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!refPatientProfileId || !refReceivingHospitalId || !refClinicalSummary) return;

    setSubmittingRef(true);
    try {
      const dedupeKey = `REF_${user?._id || 'doc'}_${refPatientProfileId}_${refSpecialty}_${new Date().toISOString().split('T')[0]}`;
      const res = await api.post('/referrals', {
        patientProfileId: refPatientProfileId,
        receivingHospitalId: refReceivingHospitalId,
        targetSpecialty: refSpecialty,
        priority: refPriority,
        clinicalSummary: refClinicalSummary,
        dedupeKey
      });

      if (res.data?.success) {
        setMsg({ type: 'success', text: `Referral ${res.data.data.referralNumber} successfully dispatched.` });
        setShowCreateRefModal(false);
        setRefClinicalSummary('');
        const refRes = await api.get('/doctor/referrals');
        if (refRes.data?.success) setReferralsList(refRes.data.data);
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
      if (res.data?.success) {
        setMsg({ type: 'success', text: 'Credential document uploaded and verified.' });
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
      if (res.data?.success) {
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

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) return;

    setSubmittingLeave(true);
    try {
      const idempotencyKey = `req_leave_${user?._id || 'doc'}_${leaveStartDate}_${Date.now()}`;
      const res = await api.post('/doctor/leave-request', {
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason,
        idempotencyKey
      });

      if (res.data?.success) {
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

  // Filtered appointments list for Screen 5
  const displayedAppointments = screen5Appointments.filter((item) => {
    if (apptSubTab === 'today') return true;
    if (apptSubTab === 'pending') return item.status === 'Pending';
    if (apptSubTab === 'upcoming') return item.status === 'Confirmed' || item.status === 'In Progress';
    if (apptSubTab === 'history') return item.status === 'Completed';
    return true;
  });

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Toast Notification */}
      {msg && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-card)',
            marginBottom: '20px',
            fontSize: '0.875rem',
            backgroundColor: msg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: msg.type === 'success' ? '#15803D' : '#B83245',
            border: `1px solid ${msg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
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

      {/* ================================================================
          SCREEN 4: DOCTOR PORTAL – DASHBOARD
          ================================================================ */}
      {currentTab === 'dashboard' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 6px 0' }}>
                Welcome, {doctorProfile?.name || 'Dr. Sundar M'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                  {doctorProfile?.specialty || 'Cardiologist'} | {doctorProfile?.hospital?.name || 'Kovai Medical Center (KMCH)'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}
                >
                  <Check size={13} strokeWidth={2.5} /> Verified
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(true)} icon={<Calendar size={14} />}>
                Request Leave
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowCreateRefModal(true)} icon={<PlusCircle size={14} />}>
                Dispatch Referral
              </Button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="ref-metrics-grid">
            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Calendar size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{todayData?.count || 8}</span>
                <span className="ref-metric-label">Today's Appointments</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon amber">
                <Clock size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{pendingRequests.length}</span>
                <span className="ref-metric-label">Pending Requests</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon green">
                <CheckCircle size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">6</span>
                <span className="ref-metric-label">Confirmed Appointments</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <RefreshCw size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">2</span>
                <span className="ref-metric-label">Cancellation Requests</span>
              </div>
            </div>
          </div>

          {/* Pending Appointment Requests Section */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Pending Appointment Requests ({pendingRequests.length})
              </h3>
              <Link
                to="/doctor-portal?tab=appointments"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                View All &rarr;
              </Link>
            </div>

            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Patient</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Date & Time</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Mode</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Reason</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No pending requests in queue.
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((req) => (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                          {req.patient}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {req.dateTime}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: req.mode === 'Online' ? '#F8DDE3' : '#F3F4F6',
                              color: req.mode === 'Online' ? 'var(--color-primary)' : 'var(--text)'
                            }}
                          >
                            {req.mode}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                          {req.reason}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-action-accept"
                              onClick={() => handleAcceptRequest(req)}
                            >
                              Accept
                            </button>
                            <button
                              className="btn-action-reject"
                              onClick={() => handleRejectRequest(req)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          SCREEN 5: DOCTOR – APPOINTMENTS
          ================================================================ */}
      {currentTab === 'appointments' && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 6px 0' }}>
              Appointments
            </h1>
          </div>

          {/* Sub-tabs pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'today', label: 'Today (8)' },
              { id: 'pending', label: 'Pending (4)' },
              { id: 'upcoming', label: 'Upcoming (6)' },
              { id: 'history', label: 'History' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setApptSubTab(tab.id)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: apptSubTab === tab.id ? 'var(--color-primary)' : 'var(--border)',
                  backgroundColor: apptSubTab === tab.id ? 'var(--color-primary)' : '#FFFFFF',
                  color: apptSubTab === tab.id ? '#FFFFFF' : 'var(--text)',
                  boxShadow: apptSubTab === tab.id ? '0 2px 6px rgba(184, 61, 131, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Appointments Table */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Time</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Patient</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Mode</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Reason</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAppointments.map((apt) => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                        {apt.time}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text)' }}>
                        {apt.patient}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: apt.mode === 'Online' ? '#F8DDE3' : '#F3F4F6',
                            color: apt.mode === 'Online' ? 'var(--color-primary)' : 'var(--text)'
                          }}
                        >
                          {apt.mode}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                        {apt.reason}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor:
                              apt.status === 'Completed'
                                ? '#DCFCE7'
                                : apt.status === 'In Progress'
                                ? '#DBEAFE'
                                : apt.status === 'Pending'
                                ? '#FEF3C7'
                                : '#CCFBF1',
                            color:
                              apt.status === 'Completed'
                                ? '#15803D'
                                : apt.status === 'In Progress'
                                ? '#1D4ED8'
                                : apt.status === 'Pending'
                                ? '#B77A32'
                                : '#0F766E'
                          }}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {apt.actionType === 'view' && (
                          <button
                            className="btn-action-view"
                            onClick={() => setMsg({ type: 'success', text: `Consultation file opened for ${apt.patient}.` })}
                          >
                            View
                          </button>
                        )}
                        {apt.actionType === 'consult' && (
                          <Link
                            to={`/teleconsult/room/${apt.id}`}
                            className="btn-action-consult"
                          >
                            <Video size={13} /> Consult
                          </Link>
                        )}
                        {apt.actionType === 'accept' && (
                          <button
                            className="btn-action-accept"
                            onClick={() => {
                              setScreen5Appointments((prev) =>
                                prev.map((item) => (item.id === apt.id ? { ...item, status: 'Confirmed', actionType: 'consult' } : item))
                              );
                              setMsg({ type: 'success', text: `Appointment confirmed for ${apt.patient}.` });
                            }}
                          >
                            Accept
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          SCREEN 6: DOCTOR CREDENTIALS & VERIFICATION
          ================================================================ */}
      {(currentTab === 'credentials' || currentTab === 'profile') && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
              Doctor Credentials & Verification
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Manage your professional documents and verification status.
            </p>
          </div>

          {/* Stepper Progress Bar (Screen 6) */}
          <div className="ref-stepper">
            <div className="ref-step done">
              <div className="ref-step-circle">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <span className="ref-step-label">Profile Completed</span>
              <div className="ref-step-line" />
            </div>

            <div className="ref-step done">
              <div className="ref-step-circle">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <span className="ref-step-label">Documents Uploaded</span>
              <div className="ref-step-line" />
            </div>

            <div className="ref-step active">
              <div className="ref-step-circle">3</div>
              <span className="ref-step-label">Under Verification</span>
              <div className="ref-step-line" />
            </div>

            <div className="ref-step pending">
              <div className="ref-step-circle">4</div>
              <span className="ref-step-label">Verified</span>
            </div>
          </div>

          {/* 2-Column Content Layout (Verification Details + Uploaded Documents) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Card 1: Verification Details */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Verification Details
                </h3>
                <button
                  className="btn-action-view"
                  onClick={() => setShowEditProfileModal(true)}
                >
                  Edit Profile
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FAF6F7', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Medical Registration No.</span>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-heading)' }}>
                    {doctorProfile?.regNumber || 'TNMC-123456'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FAF6F7', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Medical Council</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                    {doctorProfile?.councilName || 'Tamil Nadu Medical Council'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FAF6F7', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Qualification</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                    {doctorProfile?.qualifications || 'MBBS, MD (Cardiology)'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FAF6F7', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Specialty</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                    {doctorProfile?.specialty || 'Cardiology'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FAF6F7', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Experience</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                    {doctorProfile?.experienceYears || 8} Years
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>Verification Status</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#FEF3C7',
                      color: '#B77A32',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}
                  >
                    <Clock size={13} strokeWidth={2.5} /> Under Verification
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Uploaded Documents */}
            <div
              className="card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Uploaded Documents
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowUploadDocModal(true)}
                  icon={<PlusCircle size={14} />}
                >
                  Upload Document
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileCheck size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      Medical Registration Certificate
                    </span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803D', fontWeight: '700', fontSize: '0.8125rem' }}>
                    <Check size={15} strokeWidth={2.5} />
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileCheck size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      Degree Certificate
                    </span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803D', fontWeight: '700', fontSize: '0.8125rem' }}>
                    <Check size={15} strokeWidth={2.5} />
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileCheck size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      Specialization Certificate
                    </span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803D', fontWeight: '700', fontSize: '0.8125rem' }}>
                    <Check size={15} strokeWidth={2.5} />
                  </span>
                </div>

                {credentialDocs.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Additional Uploads ({credentialDocs.length})
                    </span>
                    {credentialDocs.map((doc) => (
                      <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>{doc.fileName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: '600' }}>Uploaded</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: CLINICAL DESK / ENCOUNTERS (when ?tab=desk)
          ================================================================ */}
      {currentTab === 'desk' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Today's Clinic Consultations ({todayData?.count || 8})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Active queue: in-person examination and encrypted WebRTC video visits
              </p>
            </div>
            <span className="badge badge-pill badge-neutral">
              {todayData?.count || 8} In Queue
            </span>
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Time</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Patient</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Mode</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {screen5Appointments.map((appt) => (
                  <tr key={appt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>
                      {appt.time}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600' }}>
                      {appt.patient}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {appt.mode === 'Online' ? (
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
                      <span className="badge badge-pill badge-neutral">{appt.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {appt.mode === 'Online' ? (
                          <Link
                            to={`/teleconsult/room/${appt.id}`}
                            className="btn btn-sm btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            <Video size={13} /> Enter Room
                          </Link>
                        ) : (
                          <button
                            className="btn-action-view"
                            onClick={() => setMsg({ type: 'success', text: `Encounter opened for ${appt.patient}` })}
                          >
                            Examine Patient
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: SPECIALTY REFERRALS (when ?tab=referrals)
          ================================================================ */}
      {currentTab === 'referrals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Specialty Referrals Ledger
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Inter-hospital tertiary care referrals dispatched and tracked across network facilities.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreateRefModal(true)} icon={<PlusCircle size={14} />}>
              Dispatch Referral
            </Button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Referral #</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Specialty</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Receiving Facility</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Priority</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referralsList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No outgoing referrals dispatched yet. Click "Dispatch Referral" to refer a patient.
                      </td>
                    </tr>
                  ) : (
                    referralsList.map((ref) => (
                      <tr key={ref._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                          {ref.referralNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{ref.targetSpecialty}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{ref.receivingHospitalId?.name || 'Tertiary Center'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge badge-pill ${ref.priority === 'CRITICAL' ? 'badge-danger' : ref.priority === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}>
                            {ref.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-pill badge-primary">{ref.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: CONSENTED HEALTH VAULT (when ?tab=vault or ?tab=records)
          ================================================================ */}
      {(currentTab === 'vault' || currentTab === 'records') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Consented Health Vault Viewer
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Compliant with Digital Personal Data Protection (DPDP) Act 2023. Real-time patient consent validation.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!vaultPatientId) return;
              try {
                const res = await api.get(`/vault/records?patientProfileId=${vaultPatientId}`);
                if (res.data?.success) setPatientRecords(res.data.data);
              } catch (err) {
                setVaultError(err.response?.data?.error?.message || 'Access Denied: Consent not granted.');
              }
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Input
                  type="text"
                  placeholder="Enter Patient Profile ID or ABHA Address..."
                  value={vaultPatientId}
                  onChange={(e) => setVaultPatientId(e.target.value)}
                  style={{ flex: 1, minWidth: '260px' }}
                  required
                />
                <Button variant="primary" type="submit" icon={<Lock size={14} />}>
                  Verify Consent & Fetch Records
                </Button>
              </div>
            </form>

            {vaultError && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FEE2E2', color: '#B83245', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                {vaultError}
              </div>
            )}

            {patientRecords && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9375rem', fontWeight: '700' }}>
                  Available Diagnostic Documents ({patientRecords.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patientRecords.map((rec) => (
                    <div key={rec._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>{rec.title || rec.fileName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SHA-256 Verified &bull; Active Patient Consent</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveViewingRecord(rec)}>
                        View Record
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: LEAVE & AVAILABILITY (when ?tab=availability or ?tab=leave)
          ================================================================ */}
      {(currentTab === 'availability' || currentTab === 'leave') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Clinician Leave Requests & Roster Availability
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Leave requests trigger hospital administration review and appointment safety reassignments.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowLeaveModal(true)} icon={<Calendar size={14} />}>
              Request Leave
            </Button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Start Date</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>End Date</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Reason</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Admin Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No pending or past leave requests.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>{req.startDate}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>{req.endDate}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>{req.reason}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge badge-pill ${req.status === 'APPROVED' ? 'badge-success' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODALS
          ================================================================ */}
      {/* MODAL 1: SUBMIT LEAVE REQUEST */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Request Leave of Absence">
        <form onSubmit={handleSubmitLeave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Start Date</label>
              <Input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>End Date</label>
              <Input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Reason for Absence</label>
            <Input type="text" placeholder="e.g. Conference attendance, medical leave" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submittingLeave}>{submittingLeave ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: DISPATCH REFERRAL */}
      <Modal isOpen={showCreateRefModal} onClose={() => setShowCreateRefModal(false)} title="Dispatch Clinical Referral">
        <form onSubmit={handleCreateReferral}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Patient Profile ID</label>
            <Input type="text" placeholder="Enter Patient Profile ID" value={refPatientProfileId} onChange={(e) => setRefPatientProfileId(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Receiving Hospital</label>
              <select value={refReceivingHospitalId} onChange={(e) => setRefReceivingHospitalId(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)', fontSize: '0.875rem', backgroundColor: 'var(--surface)' }} required>
                {hospitalsCatalog.map((h) => (
                  <option key={h.id || h._id} value={h.id || h._id}>
                    {h.name} ({h.address?.district || 'Coimbatore'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Priority Level</label>
              <select value={refPriority} onChange={(e) => setRefPriority(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)', fontSize: '0.875rem', backgroundColor: 'var(--surface)' }}>
                <option value="ROUTINE">Routine (48h)</option>
                <option value="URGENT">Urgent (24h)</option>
                <option value="CRITICAL">Critical (12h)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Clinical Summary & Findings</label>
            <textarea rows="4" value={refClinicalSummary} onChange={(e) => setRefClinicalSummary(e.target.value)} placeholder="Enter clinical justification for referral..." style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setShowCreateRefModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submittingRef}>{submittingRef ? 'Dispatching...' : 'Dispatch Referral'}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: WATERMARKED VIEWER */}
      {activeViewingRecord && (
        <Modal isOpen={!!activeViewingRecord} onClose={() => setActiveViewingRecord(null)} title={`Clinical Viewer: ${activeViewingRecord.title || activeViewingRecord.fileName}`}>
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <FileText size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--color-heading)', fontSize: '1.125rem' }}>
              {activeViewingRecord.fileName || activeViewingRecord.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '20px' }}>
              Confidential medical record. Protected under DPDP 2023. Viewed by {doctorProfile?.name || 'Dr. Sundar M'}.
            </p>
            <Button variant="primary" size="sm" onClick={() => setActiveViewingRecord(null)}>
              Close Secure Viewer
            </Button>
          </div>
        </Modal>
      )}

      {/* MODAL 4: EDIT DOCTOR PROFILE & CREDENTIALS */}
      {showEditProfileModal && (
        <Modal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} title="Edit Professional Credentials">
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Practitioner Full Name</label>
                <Input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Medical Council Reg #</label>
                <Input type="text" value={profileForm.regNumber} onChange={(e) => setProfileForm({ ...profileForm, regNumber: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Council Name</label>
                <Input type="text" value={profileForm.councilName} onChange={(e) => setProfileForm({ ...profileForm, councilName: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Council State</label>
                <Input type="text" value={profileForm.councilState} onChange={(e) => setProfileForm({ ...profileForm, councilState: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Qualifications</label>
              <Input type="text" value={profileForm.qualifications} onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Primary Specialty</label>
                <Input type="text" value={profileForm.specialty} onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Experience (Years)</label>
                <Input type="number" min="0" value={profileForm.experienceYears} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowEditProfileModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: UPLOAD CREDENTIAL DOCUMENT */}
      {showUploadDocModal && (
        <Modal isOpen={showUploadDocModal} onClose={() => { setShowUploadDocModal(false); setDocSelectedFile(null); }} title="Upload Credential Certificate">
          <form onSubmit={handleUploadDoc}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Certificate Document Type</label>
              <select className="input" value={docUploadType} onChange={(e) => setDocUploadType(e.target.value)} style={{ width: '100%' }}>
                <option value="registration_certificate">State Medical Council Registration Certificate</option>
                <option value="degree_certificate">Primary Medical Degree / Post-Graduate Certificate</option>
                <option value="specialization_certificate">Specialization Certificate</option>
                <option value="other">Other Professional Fellowship / License Certificate</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>File Attachment (PDF, JPG, PNG &bull; Max 10MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocSelectedFile(e.target.files?.[0] || null)} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }} required />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" type="button" onClick={() => { setShowUploadDocModal(false); setDocSelectedFile(null); }}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={uploadingDoc || !docSelectedFile}>{uploadingDoc ? 'Uploading...' : 'Upload & Verify'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
