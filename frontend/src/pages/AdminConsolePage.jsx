import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
  Hospital,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  Truck,
  UserPlus,
  ClipboardList
} from 'lucide-react';

// Modular Hospital Admin Subcomponents
import HospitalProfileView from '../components/admin/HospitalProfileView';
import DoctorVerificationView from '../components/admin/DoctorVerificationView';
import DoctorAvailabilityView from '../components/admin/DoctorAvailabilityView';
import LeaveManagementView from '../components/admin/LeaveManagementView';
import DepartmentManagementView from '../components/admin/DepartmentManagementView';
import ServiceManagementView from '../components/admin/ServiceManagementView';
import DiagnosticServicesView from '../components/admin/DiagnosticServicesView';
import AppointmentManagementView from '../components/admin/AppointmentManagementView';
import CancellationReplacementView from '../components/admin/CancellationReplacementView';
import BedManagementView from '../components/admin/BedManagementView';
import FacilityManagementView from '../components/admin/FacilityManagementView';
import ReferralManagementView from '../components/admin/ReferralManagementView';
import PatientCheckinView from '../components/admin/PatientCheckinView';
import PatientCoordinationView from '../components/admin/PatientCoordinationView';
import ReportsAnalyticsView from '../components/admin/ReportsAnalyticsView';
import NotificationsView from '../components/admin/NotificationsView';
import HospitalSettingsView from '../components/admin/HospitalSettingsView';

export default function AdminConsolePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Doctor Credentialing & Verification
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorDocs, setSelectedDoctorDocs] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);

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

  // Default Dataset for Doctor Management (Screen 8)
  const [screen8Doctors, setScreen8Doctors] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_doctors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'doc-1', name: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', verification: 'Verified', availability: 'Available' },
      { id: 'doc-2', name: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology', verification: 'Pending', availability: 'Unavailable' },
      { id: 'doc-3', name: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', verification: 'Verified', availability: 'Available' },
      { id: 'doc-4', name: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', verification: 'Verified', availability: 'Available' },
      { id: 'doc-5', name: 'Dr. Priya Dharshini', specialty: 'Pediatrics', department: 'Pediatrics', verification: 'Pending', availability: 'Available' },
      { id: 'doc-6', name: 'Dr. M. Revathi', specialty: 'Cardiology', department: 'Cardiology', verification: 'Verified', availability: 'Available' }
    ];
  });

  // Super Admin Platform Approvals (Screen 9)
  const [platformApprovals, setPlatformApprovals] = useState([
    { id: 'appr-1', name: 'Ramakrishna Hospital', status: 'Pending', type: 'Tertiary Care', beds: '250 Beds' },
    { id: 'appr-2', name: 'Aravind Eye Care', status: 'Pending', type: 'Super Specialty Eye Hospital', beds: '180 Beds' },
    { id: 'appr-3', name: 'Sri Lakshmi Hospital', status: 'Pending', type: 'General Medical Center', beds: '120 Beds' }
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState(() => {
    return [
      { id: 'aud-1', time: '10 mins ago', type: 'DOCTOR_VERIFY_STAGE', actor: 'HOSPITAL_ADMIN', details: 'Dr. Sundar M credential review approved', status: 'SUCCESS' },
      { id: 'aud-2', time: '25 mins ago', type: 'BED_CAPACITY_BROADCAST', actor: 'HOSPITAL_ADMIN', details: 'Live bed availability broadcasted to Tamil Nadu 108 Emergency Network', status: 'SUCCESS' },
      { id: 'aud-3', time: '1 hour ago', type: 'LEAVE_REPLACEMENT_MATCH', actor: 'SYSTEM_AUTOPILOT', details: 'Dr. M. Revathi leave processed with Dr. Sundar M covering appointments', status: 'SUCCESS' },
      { id: 'aud-4', time: '2 hours ago', type: 'REFERRAL_ACCEPTED', actor: 'HOSPITAL_ADMIN', details: 'Annur PHC acute STEMI referral accepted & Cath Lab held', status: 'SUCCESS' },
      { id: 'aud-5', time: '4 hours ago', type: 'AUDIT_SEAL_VERIFICATION', actor: 'SECURITY_DAEMON', details: 'DPDP 2023 Digital Health integrity hash chain validated', status: 'SUCCESS' }
    ];
  });

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
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
      }
    } catch (err) {
      console.warn('[AdminConsole] Overview fetch warning:', err.message);
    }
  };

  const handleInspectDoctorDocs = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDoctorDocs([
      { id: 'doc-cert-1', fileName: 'State_Medical_Council_Registration.pdf', type: 'registration_certificate', sha256: '9a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a', status: 'Verified' },
      { id: 'doc-cert-2', fileName: 'Specialist_Degree_Certificate.pdf', type: 'degree_certificate', sha256: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f', status: 'Verified' }
    ]);
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
    const updated = [newEntry, ...screen8Doctors];
    setScreen8Doctors(updated);
    localStorage.setItem('medibridge_hospital_doctors', JSON.stringify(updated));
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
          SUPER ADMIN VIEW (Platform Overview - Screen 9)
          ================================================================ */}
      {(user?.role === 'super_admin' || currentTab === 'platform') && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
              Platform Overview
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Monitor hospitals, users and platform activities across Tamil Nadu state network.
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

          {/* 2-Column Content Layout (Hospital Approvals + Recent Activity) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Left Card: Hospital Approvals (3) */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Hospital Approvals ({platformApprovals.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {platformApprovals.map((hosp) => (
                  <div key={hosp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>{hosp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hosp.type} &bull; {hosp.beds}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#FEF3C7', color: '#B77A32' }}>
                        {hosp.status}
                      </span>
                      <button className="btn-action-view" style={{ borderColor: 'var(--color-primary)' }} onClick={() => handleReviewHospitalApproval(hosp)}>
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Recent Platform Activity */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Recent Platform Activity
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { text: 'New hospital registration', time: '10 min ago' },
                  { text: 'Doctor verification completed', time: '25 min ago' },
                  { text: 'Appointment spike detected', time: '1 hour ago' },
                  { text: 'System backup completed', time: '3 hours ago' },
                  { text: 'Emergency 108 dispatch routed', time: '5 hours ago' }
                ].map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>{act.text}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>- {act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          HOSPITAL ADMIN DASHBOARD (Screen 7 from Reference Image)
          (Rendered when user.role !== 'super_admin' and currentTab === 'dashboard')
          ================================================================ */}
      {user?.role !== 'super_admin' && currentTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
                Kovai Medical Center & Hospital (KMCH)
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Hospital Admin Dashboard &bull; License: <strong>LIC-TN-CBE-001</strong> &bull; Level 1 Trauma Center
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', alignSelf: 'center', marginRight: '6px' }}>
              Quick Actions:
            </span>
            <button
              onClick={() => navigate('/admin-console?tab=doctors')}
              style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FAF6F7', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)', cursor: 'pointer' }}
            >
              + Add Doctor
            </button>
            <button
              onClick={() => navigate('/admin-console?tab=departments')}
              style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FAF6F7', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)', cursor: 'pointer' }}
            >
              + Add Department
            </button>
            <button
              onClick={() => navigate('/admin-console?tab=services')}
              style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FAF6F7', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)', cursor: 'pointer' }}
            >
              + Add Service
            </button>
            <button
              onClick={() => navigate('/admin-console?tab=doctor-availability')}
              style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FAF6F7', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)', cursor: 'pointer' }}
            >
              Manage Availability
            </button>
            <button
              onClick={() => navigate('/admin-console?tab=appointments')}
              style={{ padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FAF6F7', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)', cursor: 'pointer' }}
            >
              View Appointments
            </button>
            <button
              onClick={() => navigate('/admin-console?tab=beds')}
              style={{ padding: '6px 14px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: '700', cursor: 'pointer' }}
            >
              Update Bed Capacity
            </button>
          </div>

          {/* 8 Summary Metric Cards from Section 5 */}
          <div className="ref-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Users size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">64</span>
                <span className="ref-metric-label">Total Doctors</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">58</span>
                <span className="ref-metric-label">Verified Doctors</span>
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

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Clock size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">8</span>
                <span className="ref-metric-label">Pending Requests</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Bed size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">278 / 320</span>
                <span className="ref-metric-label">Available General Beds</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Activity size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">7 / 28</span>
                <span className="ref-metric-label">Available ICU Beds</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <UserCheck size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">3</span>
                <span className="ref-metric-label">Doctor Verifications</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <AlertTriangle size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">2</span>
                <span className="ref-metric-label">Cancellations Pending</span>
              </div>
            </div>
          </div>

          {/* 2-Column Main Content Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Left Card: Pending Approvals (5) */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Pending Approvals (5)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link
                  to="/admin-console?tab=doctor-verification"
                  style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
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
                </Link>

                <Link
                  to="/admin-console?tab=cancellations"
                  style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
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
                </Link>

                <Link
                  to="/admin-console?tab=replacements"
                  style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
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
                </Link>
              </div>
            </div>

            {/* Right Card: Bed Availability (Donut Chart) */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Bed Availability
                </h3>
                <Link to="/admin-console?tab=beds" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>
                  Manage Beds &rarr;
                </Link>
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
          MODULE 1: HOSPITAL PROFILE
          ================================================================ */}
      {currentTab === 'profile' && <HospitalProfileView onToast={setMsg} />}

      {/* ================================================================
          MODULE 2: DOCTOR MANAGEMENT (Screen 8 from Reference Image)
          ================================================================ */}
      {currentTab === 'doctors' && (
        <div>
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

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={doctorSearchQuery}
                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                placeholder="Search doctor by name or specialty..."
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>

            <select
              value={doctorDeptFilter}
              onChange={(e) => setDoctorDeptFilter(e.target.value)}
              style={{ padding: '9px 16px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', outline: 'none' }}
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
              style={{ padding: '9px 16px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="All">All Status ▾</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Doctor Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: doc.verification === 'Verified' ? '#DCFCE7' : '#FEF3C7', color: doc.verification === 'Verified' ? '#15803D' : '#B77A32' }}>
                          {doc.verification === 'Verified' ? <Check size={13} strokeWidth={2.5} /> : '●'} {doc.verification}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: doc.availability === 'Available' ? '#DCFCE7' : '#FEE2E2', color: doc.availability === 'Available' ? '#15803D' : '#B83245' }}>
                          ● {doc.availability}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button className="btn-action-view" onClick={() => handleInspectDoctorDocs(doc)}>
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
          MODULE 3: DOCTOR CREDENTIAL VERIFICATION
          ================================================================ */}
      {currentTab === 'doctor-verification' && (
        <DoctorVerificationView
          onToast={setMsg}
          onDoctorUpdated={(docName, status) => {
            const updated = screen8Doctors.map((d) => (d.name === docName ? { ...d, verification: status } : d));
            setScreen8Doctors(updated);
            localStorage.setItem('medibridge_hospital_doctors', JSON.stringify(updated));
          }}
        />
      )}

      {/* ================================================================
          MODULE 4: DOCTOR AVAILABILITY & SLOTS
          ================================================================ */}
      {(currentTab === 'doctor-availability' || currentTab === 'slots') && (
        <DoctorAvailabilityView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 5: LEAVE MANAGEMENT
          ================================================================ */}
      {currentTab === 'leave-management' && (
        <LeaveManagementView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 6: DEPARTMENT MANAGEMENT
          ================================================================ */}
      {currentTab === 'departments' && (
        <DepartmentManagementView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 7: SERVICE MANAGEMENT
          ================================================================ */}
      {currentTab === 'services' && (
        <ServiceManagementView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 8: DIAGNOSTIC SERVICES
          ================================================================ */}
      {currentTab === 'diagnostics' && (
        <DiagnosticServicesView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 9: APPOINTMENT MANAGEMENT
          ================================================================ */}
      {currentTab === 'appointments' && (
        <AppointmentManagementView onToast={setMsg} defaultPendingOnly={false} />
      )}

      {/* ================================================================
          MODULE 10: PENDING APPOINTMENTS
          ================================================================ */}
      {currentTab === 'pending-appointments' && (
        <AppointmentManagementView onToast={setMsg} defaultPendingOnly={true} />
      )}

      {/* ================================================================
          MODULE 11: CANCELLATION REQUESTS
          ================================================================ */}
      {currentTab === 'cancellations' && (
        <CancellationReplacementView onToast={setMsg} defaultTab="cancellations" />
      )}

      {/* ================================================================
          MODULE 12: REPLACEMENT DOCTOR MANAGEMENT
          ================================================================ */}
      {currentTab === 'replacements' && (
        <CancellationReplacementView onToast={setMsg} defaultTab="replacements" />
      )}

      {/* ================================================================
          MODULE 13: BED MANAGEMENT
          ================================================================ */}
      {currentTab === 'beds' && (
        <BedManagementView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 14: FACILITY AVAILABILITY
          ================================================================ */}
      {currentTab === 'facilities' && (
        <FacilityManagementView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 15: REFERRAL MANAGEMENT
          ================================================================ */}
      {currentTab === 'referrals' && (
        <ReferralManagementView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 16: PATIENT CHECK-IN
          ================================================================ */}
      {currentTab === 'checkin' && (
        <PatientCheckinView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 17: PATIENT COORDINATION
          ================================================================ */}
      {currentTab === 'patient-coordination' && (
        <PatientCoordinationView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 18: OPERATIONAL REPORTS
          ================================================================ */}
      {currentTab === 'reports' && (
        <ReportsAnalyticsView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 19: NOTIFICATIONS
          ================================================================ */}
      {currentTab === 'notifications' && (
        <NotificationsView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 20: AUDIT LOGS
          ================================================================ */}
      {currentTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
              Hospital Operations Audit Trail
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Immutable system activity trail compliant with CERT-In and hospital tenant safeguards.
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Timestamp</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Event Type</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Actor</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Details</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{log.time}</td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>{log.type}</td>
                      <td style={{ padding: '14px 18px', fontSize: '0.75rem' }}>{log.actor}</td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem' }}>{log.details}</td>
                      <td style={{ padding: '14px 18px' }}>
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
          MODULE 21: HOSPITAL SETTINGS
          ================================================================ */}
      {currentTab === 'settings' && (
        <HospitalSettingsView onToast={setMsg} />
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
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Department</label>
                <select
                  value={newDoctorForm.department}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
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
                  placeholder="e.g. MBBS, MD, DM"
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
                {selectedDoctorDocs.map((doc) => (
                  <div key={doc.id} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>SHA-256: {doc.sha256}</div>
                    </div>
                    <span className="badge badge-pill badge-success" style={{ fontSize: '0.7rem' }}>{doc.status}</span>
                  </div>
                ))}
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
