import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import {
  Bed,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  UserCheck,
  Send,
  Layers,
  History,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Building2,
  Stethoscope,
  Users,
  Search,
  ExternalLink,
  Info,
  Check,
  X,
  PlusCircle,
  CalendarX,
  RefreshCw,
  Eye,
  Hospital
} from 'lucide-react';

export default function AdminConsolePage() {
  const { user } = useAuth();
  const location = useLocation();

  // Active Tab from query parameters
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('just now');

  // Overview Data
  const [overview, setOverview] = useState(null);
  const [genTotal, setGenTotal] = useState(320);
  const [genAvail, setGenAvail] = useState(278);
  const [icuTotal, setIcuTotal] = useState(28);
  const [icuAvail, setIcuAvail] = useState(7);

  // Slots & Services
  const [servicesList, setServicesList] = useState([]);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('09:30');
  const [slotDoctorId, setSlotDoctorId] = useState('');
  const [slotServiceId, setSlotServiceId] = useState('');
  const [slotsTable, setSlotsTable] = useState([]);

  // Leave Management
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveDoctorId, setLeaveDoctorId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Doctor Credentialing & Verification
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorDocs, setSelectedDoctorDocs] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState(null);
  const [verifyComments, setVerifyComments] = useState('');

  // Add Doctor Modal
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    specialty: 'Cardiology',
    regNumber: '',
    qualifications: '',
    department: 'Cardiology'
  });

  // Filters for Doctor Management (Screen 8)
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorDeptFilter, setDoctorDeptFilter] = useState('All');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('All');

  // Default Mock Dataset for Doctor Management (Screen 8)
  const [screen8Doctors, setScreen8Doctors] = useState([
    { id: 'doc-1', name: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', verification: 'Verified', availability: 'Available' },
    { id: 'doc-2', name: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology', verification: 'Pending', availability: 'Unavailable' },
    { id: 'doc-3', name: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', verification: 'Verified', availability: 'Available' },
    { id: 'doc-4', name: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', verification: 'Verified', availability: 'Available' }
  ]);

  // Super Admin Platform Approvals (Screen 9)
  const [platformApprovals, setPlatformApprovals] = useState([
    { id: 'appr-1', name: 'Ramakrishna Hospital', status: 'Pending', type: 'Tertiary Care', beds: '250 Beds' },
    { id: 'appr-2', name: 'Aravind Eye Care', status: 'Pending', type: 'Super Specialty Eye Hospital', beds: '180 Beds' },
    { id: 'appr-3', name: 'Sri Lakshmi Hospital', status: 'Pending', type: 'General Medical Center', beds: '120 Beds' }
  ]);

  // Referrals & Audit
  const [referralsList, setReferralsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Super Admin Platform Data
  const [platformOverview, setPlatformOverview] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      if (user?.role === 'super_admin') {
        await Promise.allSettled([
          loadOverviewData(),
          loadPlatformData(),
          loadDoctors()
        ]);
      } else {
        await Promise.allSettled([
          loadOverviewData(),
          loadDoctors(),
          loadLeaveRequests()
        ]);
      }
    } catch (err) {
      console.warn('[AdminConsole] Load error:', err.message);
    }
  };

  const loadOverviewData = async () => {
    try {
      const res = await api.get('/admin/overview');
      if (res.data?.success) {
        const d = res.data.data;
        setOverview(d);
        if (d.hospital?.bedCapacity) {
          setGenTotal(d.hospital.bedCapacity.general?.total || 320);
          setGenAvail(d.hospital.bedCapacity.general?.available || 278);
          setIcuTotal(d.hospital.bedCapacity.icu?.total || 28);
          setIcuAvail(d.hospital.bedCapacity.icu?.available || 7);
        }
        setLastUpdated('just now');
      }

      const srvRes = await api.get('/admin/services');
      if (srvRes.data?.success) {
        setServicesList(srvRes.data.data || []);
        if (srvRes.data.data?.length > 0) setSlotServiceId(srvRes.data.data[0]._id);
      }

      const slRes = await api.get('/admin/slots');
      if (slRes.data?.success) setSlotsTable(slRes.data.data || []);

      const audRes = await api.get('/admin/audit-logs');
      if (audRes.data?.success) setAuditLogs(audRes.data.data || []);

      const refRes = await api.get('/referrals');
      if (refRes.data?.success) setReferralsList(refRes.data.data || []);
    } catch (err) {
      console.warn('[AdminConsole] Overview fetch warning:', err.message);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors');
      if (res.data?.success && res.data.data?.length > 0) {
        setDoctorsList(res.data.data);
        if (!leaveDoctorId) setLeaveDoctorId(res.data.data[0]._id);
      }
    } catch (err) {
      console.warn('[AdminConsole] Doctors fetch warning:', err.message);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const res = await api.get('/admin/leave-requests');
      if (res.data?.success) {
        setLeaveRequests(res.data.data || []);
      }
    } catch (err) {
      console.warn('[AdminConsole] Leave requests warning:', err.message);
    }
  };

  const loadPlatformData = async () => {
    try {
      const res = await api.get('/admin/platform/overview');
      if (res.data?.success) {
        setPlatformOverview(res.data.data);
      }
    } catch (err) {
      console.warn('[AdminConsole] Platform overview warning:', err.message);
    }
  };

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    try {
      if (user?.hospitalId) {
        await api.patch(`/search/hospitals/${user.hospitalId}/bed-capacity`, {
          general: { total: Number(genTotal), available: Number(genAvail) },
          icu: { total: Number(icuTotal), available: Number(icuAvail) }
        });
      }
      setMsg({ type: 'success', text: 'Live Bed & ICU capacity broadcast updated to 108 Emergency network.' });
      setLastUpdated('just now');
    } catch (err) {
      setMsg({ type: 'error', text: 'Update failed: ' + (err.response?.data?.error?.message || err.message) });
    }
  };

  const handleInspectDoctorDocs = async (doctor) => {
    setSelectedDoctor(doctor);
    try {
      if (doctor._id) {
        const res = await api.get(`/admin/doctors/${doctor._id}/documents`);
        if (res.data?.success) setSelectedDoctorDocs(res.data.data || []);
      } else {
        setSelectedDoctorDocs([
          { id: 'doc-cert-1', fileName: 'Medical_Registration_Certificate.pdf', type: 'registration_certificate', sha256: '9a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a', version: 1 },
          { id: 'doc-cert-2', fileName: 'MBBS_Degree_Certificate.pdf', type: 'degree_certificate', sha256: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f', version: 1 }
        ]);
      }
    } catch (err) {
      setSelectedDoctorDocs([]);
    }
    setShowDocModal(true);
  };

  const handleAddDoctorSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `doc-${Date.now()}`,
      name: newDoctorForm.name,
      specialty: newDoctorForm.specialty,
      department: newDoctorForm.department,
      verification: 'Pending',
      availability: 'Available'
    };
    setScreen8Doctors((prev) => [newEntry, ...prev]);
    setShowAddDoctorModal(false);
    setNewDoctorForm({ name: '', specialty: 'Cardiology', regNumber: '', qualifications: '', department: 'Cardiology' });
    setMsg({ type: 'success', text: `Doctor ${newDoctorForm.name} added. Credential verification initiated.` });
  };

  const handleReviewHospitalApproval = (appr) => {
    setPlatformApprovals((prev) => prev.filter((item) => item.id !== appr.id));
    setMsg({ type: 'success', text: `${appr.name} empanelled and approved for MediBridge state network.` });
  };

  // Filtered list of doctors for Screen 8
  const filteredDoctors = screen8Doctors.filter((doc) => {
    const matchesSearch =
      !doctorSearchQuery ||
      doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase());
    const matchesDept = doctorDeptFilter === 'All' || doc.department === doctorDeptFilter;
    const matchesStatus = doctorStatusFilter === 'All' || doc.verification === doctorStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Toast Alert */}
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
          SCREEN 9: SUPER ADMIN – DASHBOARD (PLATFORM OVERVIEW)
          (Rendered when user.role === 'super_admin' or tab === 'platform')
          ================================================================ */}
      {(user?.role === 'super_admin' || currentTab === 'platform') && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
              Platform Overview
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Monitor hospitals, users and platform activities.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="ref-metrics-grid">
            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Building2 size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">24</span>
                <span className="ref-metric-label">Hospitals</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Users size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">1,260</span>
                <span className="ref-metric-label">Registered Users</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Stethoscope size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">402</span>
                <span className="ref-metric-label">Doctors</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Calendar size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">1,984</span>
                <span className="ref-metric-label">Total Appointments</span>
              </div>
            </div>
          </div>

          {/* 2-Column Content Layout (Hospital Approvals + Recent Platform Activity) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Left Card: Hospital Approvals (3) */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Hospital Approvals ({platformApprovals.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {platformApprovals.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    All hospital applications have been reviewed.
                  </div>
                ) : (
                  platformApprovals.map((hosp) => (
                    <div
                      key={hosp.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        backgroundColor: '#FAF6F7',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                          {hosp.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {hosp.type} &bull; {hosp.beds}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: '#FEF3C7',
                            color: '#B77A32'
                          }}
                        >
                          {hosp.status}
                        </span>
                        <button
                          className="btn-action-view"
                          style={{ borderColor: 'var(--color-primary)' }}
                          onClick={() => handleReviewHospitalApproval(hosp)}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Card: Recent Platform Activity */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Recent Platform Activity
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>New hospital registration</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>- 10 min ago</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>Doctor verification completed</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>- 25 min ago</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>Appointment spike detected</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>- 1 hour ago</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>System backup completed</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>- 3 hours ago</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>Emergency 108 dispatch routed</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>- 5 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          SCREEN 7: HOSPITAL ADMIN – DASHBOARD
          (Rendered when user.role === 'hospital_admin' and currentTab === 'dashboard')
          ================================================================ */}
      {user?.role === 'hospital_admin' && currentTab === 'dashboard' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: '#F8DDE3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Hospital size={30} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.625rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
                {overview?.hospital?.name || 'Kovai Medical Center & Hospital (KMCH)'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Hospital Admin Dashboard
              </p>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="ref-metrics-grid">
            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Bed size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{genTotal}</span>
                <span className="ref-metric-label">Total Beds</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Activity size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{icuTotal}</span>
                <span className="ref-metric-label">ICU Beds</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Users size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">64</span>
                <span className="ref-metric-label">Doctors</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Calendar size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">36</span>
                <span className="ref-metric-label">Today's Appointments</span>
              </div>
            </div>
          </div>

          {/* 2-Column Content Layout (Pending Approvals + Bed Availability Donut) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Left Card: Pending Approvals (5) */}
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
                  Pending Approvals (5)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    backgroundColor: '#FAF6F7',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F8DDE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      Doctor Verification
                    </span>
                  </div>
                  <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    3
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    backgroundColor: '#FAF6F7',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F8DDE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarX size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      Cancellation Requests
                    </span>
                  </div>
                  <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    1
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    backgroundColor: '#FAF6F7',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F8DDE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      Replacement Requests
                    </span>
                  </div>
                  <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    1
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Bed Availability (Donut Chart) */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Bed Availability
                </h3>
              </div>

              <div className="ref-donut-wrapper">
                <div className="ref-donut-container">
                  <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FCEFED" strokeWidth="12" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#477B67"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset="32.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="ref-donut-center">
                    <span className="ref-donut-percent">87%</span>
                    <span className="ref-donut-subtext">Available</span>
                  </div>
                </div>

                <div className="ref-donut-legend">
                  <div className="ref-legend-item">
                    <span className="ref-legend-dot" style={{ backgroundColor: '#477B67' }} />
                    <span>Available (278)</span>
                  </div>
                  <div className="ref-legend-item">
                    <span className="ref-legend-dot" style={{ backgroundColor: '#B77A32' }} />
                    <span>Occupied (42)</span>
                  </div>
                  <div className="ref-legend-item">
                    <span className="ref-legend-dot" style={{ backgroundColor: '#9CA3AF' }} />
                    <span>Maintenance (0)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          SCREEN 8: HOSPITAL ADMIN – DOCTOR MANAGEMENT
          (Rendered when currentTab === 'doctors')
          ================================================================ */}
      {currentTab === 'doctors' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
                Doctor Management
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Add, verify and manage doctors in your hospital.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDoctorModal(true)}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '9px 20px',
                fontSize: '0.875rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
              }}
            >
              + Add Doctor
            </button>
          </div>

          {/* Filter Bar (Single row: search + department + status) */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                value={doctorSearchQuery}
                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                placeholder="Search doctor by name or specialty..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={doctorDeptFilter}
              onChange={(e) => setDoctorDeptFilter(e.target.value)}
              style={{
                padding: '9px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">All Departments ▾</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="General Medicine">General Medicine</option>
            </select>

            <select
              value={doctorStatusFilter}
              onChange={(e) => setDoctorStatusFilter(e.target.value)}
              style={{
                padding: '9px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">All Status ▾</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Doctor Table */}
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
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Doctor</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Specialty</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Verification</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Availability</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                        {doc.name}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text)' }}>
                        {doc.specialty}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: doc.verification === 'Verified' ? '#DCFCE7' : '#FEF3C7',
                            color: doc.verification === 'Verified' ? '#15803D' : '#B77A32'
                          }}
                        >
                          {doc.verification === 'Verified' ? <Check size={13} strokeWidth={2.5} /> : '●'} {doc.verification}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: doc.availability === 'Available' ? '#DCFCE7' : '#FEE2E2',
                            color: doc.availability === 'Available' ? '#15803D' : '#B83245'
                          }}
                        >
                          ● {doc.availability}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          className="btn-action-view"
                          onClick={() => handleInspectDoctorDocs(doc)}
                        >
                          View
                        </button>
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
          TAB: BEDS & CAPACITY (when ?tab=beds)
          ================================================================ */}
      {currentTab === 'beds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Live Bed & ICU Capacity Broadcast
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Broadcast capacity live to the 108 Emergency ambulance dispatch network.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <form onSubmit={handleUpdateBeds}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>General Ward Beds</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Beds</label>
                      <Input type="number" min="0" value={genTotal} onChange={(e) => setGenTotal(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Available</label>
                      <Input type="number" min="0" value={genAvail} onChange={(e) => setGenAvail(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>ICU Critical Care Beds</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total ICU</label>
                      <Input type="number" min="0" value={icuTotal} onChange={(e) => setIcuTotal(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Available ICU</label>
                      <Input type="number" min="0" value={icuAvail} onChange={(e) => setIcuAvail(e.target.value)} required />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" type="submit" icon={<Bed size={15} />}>
                  Broadcast Bed Capacity to 108 Network
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          TAB: SLOTS & AVAILABILITY (when ?tab=slots)
          ================================================================ */}
      {currentTab === 'slots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Outpatient Booking Slots & Services
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Configure outpatient consult windows and procedure slots published to patients.
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Date</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Time Window</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Department</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '24 Nov 2026', time: '09:00 AM - 01:00 PM', dept: 'Cardiology Clinic', status: 'Active' },
                    { date: '24 Nov 2026', time: '02:00 PM - 06:00 PM', dept: 'Cardiology Teleconsult', status: 'Active' },
                    { date: '25 Nov 2026', time: '09:00 AM - 01:00 PM', dept: 'Neurology OPD', status: 'Active' },
                    { date: '25 Nov 2026', time: '10:00 AM - 02:00 PM', dept: 'Orthopedics Consultation', status: 'Active' }
                  ].map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem' }}>{s.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{s.time}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{s.dept}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-pill badge-success">{s.status}</span>
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
          TAB: AUDIT LOGS (when ?tab=audit)
          ================================================================ */}
      {currentTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Hospital Operations Audit Trail
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Immutable system activity trail compliant with CERT-In and hospital tenant safeguards.
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Timestamp</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Event Type</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Actor</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Details</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: '10 mins ago', type: 'DOCTOR_VERIFY_STAGE', actor: 'HOSPITAL_ADMIN', details: 'Dr. Sundar M credential review approved', status: 'SUCCESS' },
                    { time: '35 mins ago', type: 'BED_CAPACITY_UPDATE', actor: 'HOSPITAL_ADMIN', details: 'ICU capacity updated to 7 available beds', status: 'SUCCESS' },
                    { time: '1 hour ago', type: 'LEAVE_REASSIGNMENT', actor: 'SYSTEM_AUTOPILOT', details: 'Dr. Lavanya leave request processed with patient notifications', status: 'SUCCESS' }
                  ].map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{log.time}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>{log.type}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem' }}>{log.actor}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>{log.details}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-pill badge-success">{log.status}</span>
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
          MODALS
          ================================================================ */}
      {/* MODAL 1: ADD DOCTOR */}
      {showAddDoctorModal && (
        <Modal isOpen={showAddDoctorModal} onClose={() => setShowAddDoctorModal(false)} title="Add Doctor to Hospital">
          <form onSubmit={handleAddDoctorSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Doctor Name</label>
              <Input
                type="text"
                placeholder="e.g. Dr. Ramesh Kumar"
                value={newDoctorForm.name}
                onChange={(e) => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Specialty</label>
                <select
                  value={newDoctorForm.specialty}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, specialty: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)', fontSize: '0.875rem', backgroundColor: 'var(--surface)' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Department</label>
                <select
                  value={newDoctorForm.department}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-control)', fontSize: '0.875rem', backgroundColor: 'var(--surface)' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Council Reg #</label>
                <Input
                  type="text"
                  placeholder="e.g. TNMC-987654"
                  value={newDoctorForm.regNumber}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, regNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Qualifications</label>
                <Input
                  type="text"
                  placeholder="e.g. MBBS, MS"
                  value={newDoctorForm.qualifications}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, qualifications: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowAddDoctorModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Submit Doctor Credentials</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: INSPECT DOCTOR CREDENTIALS */}
      {showDocModal && selectedDoctor && (
        <Modal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          title={`Doctor Credential Inspection: ${selectedDoctor.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#F8DDE3', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                {selectedDoctor.name} ({selectedDoctor.specialty})
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Department: {selectedDoctor.department} &bull; Verification: <strong>{selectedDoctor.verification || 'Verified'}</strong>
              </div>
            </div>

            <div>
              <h5 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Uploaded Credential Documents & Integrity Hashes
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>Medical_Registration_Certificate.pdf</div>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>SHA-256: 9a3f2b8c9d1e4f5a6b7c... Verified</div>
                  </div>
                  <span className="badge badge-pill badge-success" style={{ fontSize: '0.7rem' }}>Verified</span>
                </div>

                <div style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>MBBS_Degree_Certificate.pdf</div>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>SHA-256: 5e6f7a8b9c0d1e2f3a4b... Verified</div>
                  </div>
                  <span className="badge badge-pill badge-success" style={{ fontSize: '0.7rem' }}>Verified</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="outline" size="sm" onClick={() => setShowDocModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
