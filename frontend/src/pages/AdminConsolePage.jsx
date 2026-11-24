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
import AuditLogsView from '../components/admin/AuditLogsView';

// Modular Super Admin Subcomponents
import SuperAdminDashboardView from '../components/superadmin/SuperAdminDashboardView';
import HospitalManagementView from '../components/superadmin/HospitalManagementView';
import HospitalApprovalsView from '../components/superadmin/HospitalApprovalsView';
import UserManagementView from '../components/superadmin/UserManagementView';
import RoleManagementView from '../components/superadmin/RoleManagementView';
import PlatformMonitoringView from '../components/superadmin/PlatformMonitoringView';
import SuperAdminAuditLogsView from '../components/superadmin/SuperAdminAuditLogsView';
import SuperAdminReportsView from '../components/superadmin/SuperAdminReportsView';
import SystemSettingsView from '../components/superadmin/SystemSettingsView';

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

  // Edit Doctor Modal State
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editDoctorForm, setEditDoctorForm] = useState({
    name: '',
    specialty: 'Cardiology',
    department: 'Cardiology',
    regNumber: '',
    qualifications: '',
    verification: 'Pending',
    availability: 'Available'
  });

  // Default Dataset for Doctor Management (Screen 8)
  const [screen8Doctors, setScreen8Doctors] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_doctors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initialDocs = [
      { id: 'doc-1', name: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', regNumber: 'TNMC/2012/04818', qualifications: 'MBBS, MD, DM', verification: 'Verified', availability: 'Available' },
      { id: 'doc-2', name: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology', regNumber: 'TNMC/2017/09841', qualifications: 'MBBS, MD, DM', verification: 'Pending', availability: 'Unavailable' },
      { id: 'doc-3', name: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', regNumber: 'TNMC/2011/03120', qualifications: 'MBBS, MS (Ortho)', verification: 'Verified', availability: 'Available' },
      { id: 'doc-4', name: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', regNumber: 'TNMC/2015/07621', qualifications: 'MBBS, MD (Gen Med)', verification: 'Verified', availability: 'Available' },
      { id: 'doc-5', name: 'Dr. Priya Dharshini', specialty: 'Pediatrics', department: 'Pediatrics', regNumber: 'TNMC/2019/11234', qualifications: 'MBBS, MD (Pediatrics)', verification: 'Pending', availability: 'Available' },
      { id: 'doc-6', name: 'Dr. M. Revathi', specialty: 'Cardiology', department: 'Cardiology', regNumber: 'TNMC/2016/08945', qualifications: 'MBBS, MD, DNB', verification: 'Verified', availability: 'Available' }
    ];
    try {
      localStorage.setItem('medibridge_hospital_doctors', JSON.stringify(initialDocs));
    } catch (e) {}
    return initialDocs;
  });

  // Dynamic Dashboard Metrics State (Computed Live from Stores)
  const [dynamicMetrics, setDynamicMetrics] = useState({
    totalDoctors: 64,
    verifiedDoctors: 58,
    todayAppointments: 36,
    pendingRequests: 8,
    genAvailable: 278,
    genTotal: 320,
    icuAvailable: 7,
    icuTotal: 28,
    doctorVerificationsPending: 3,
    cancellationsPending: 2,
    replacementRequests: 1
  });

  const refreshDynamicMetrics = () => {
    // 1. Doctors & Verifications Count
    let docs = screen8Doctors;
    const savedDocs = localStorage.getItem('medibridge_hospital_doctors');
    if (savedDocs) {
      try { docs = JSON.parse(savedDocs); } catch (e) {}
    }
    const totalDocs = Math.max(64, 64 + (docs.length - 6));
    const verifiedDocs = 58 + docs.filter((d) => !['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6'].includes(d.id) && d.verification === 'Verified').length;

    // Doctor Verifications Pending
    let docVerPending = 3;
    const savedVer = localStorage.getItem('medibridge_doctor_verifications');
    if (savedVer) {
      try {
        const verList = JSON.parse(savedVer);
        docVerPending = verList.filter((v) => v.status !== 'Verified').length;
      } catch (e) {}
    }

    // 2. Appointments
    let todayApts = 36;
    let pendingApts = 8;
    const savedApts = localStorage.getItem('medibridge_hospital_appointments');
    if (savedApts) {
      try {
        const apts = JSON.parse(savedApts);
        if (apts && apts.length > 0) {
          todayApts = apts.length;
          pendingApts = apts.filter((a) => a.status === 'Pending').length;
        }
      } catch (e) {}
    }

    // 3. Bed Capacity
    let gAvail = 278;
    let gTotal = 320;
    let iAvail = 7;
    let iTotal = 28;
    const savedBeds = localStorage.getItem('medibridge_hospital_bed_wards');
    if (savedBeds) {
      try {
        const wards = JSON.parse(savedBeds);
        const genWards = wards.filter((w) => w.type !== 'Critical Care');
        const icuWards = wards.filter((w) => w.type === 'Critical Care');
        gAvail = genWards.reduce((acc, w) => acc + (w.available || 0), 0);
        gTotal = genWards.reduce((acc, w) => acc + (w.total || 0), 0);
        iAvail = icuWards.reduce((acc, w) => acc + (w.available || 0), 0);
        iTotal = icuWards.reduce((acc, w) => acc + (w.total || 0), 0);
      } catch (e) {}
    }

    // 4. Cancellations & Replacements
    let cancPending = 2;
    const savedCanc = localStorage.getItem('medibridge_cancellation_requests');
    if (savedCanc) {
      try {
        const cancs = JSON.parse(savedCanc);
        cancPending = cancs.filter((c) => c.status === 'Pending' || c.status === 'Submitted').length;
      } catch (e) {}
    }

    let repCount = 1;
    const savedRep = localStorage.getItem('medibridge_active_doctor_replacements');
    if (savedRep) {
      try {
        const reps = JSON.parse(savedRep);
        repCount = reps.length;
      } catch (e) {}
    }

    setDynamicMetrics({
      totalDoctors: totalDocs,
      verifiedDoctors: verifiedDocs,
      todayAppointments: todayApts,
      pendingRequests: pendingApts,
      genAvailable: gAvail,
      genTotal: gTotal,
      icuAvailable: iAvail,
      icuTotal: iTotal,
      doctorVerificationsPending: docVerPending,
      cancellationsPending: cancPending,
      replacementRequests: repCount
    });
  };

  useEffect(() => {
    refreshDynamicMetrics();
    const handleSync = () => {
      refreshDynamicMetrics();
      const savedDocs = localStorage.getItem('medibridge_hospital_doctors');
      if (savedDocs) {
        try { setScreen8Doctors(JSON.parse(savedDocs)); } catch (e) {}
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

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
      { id: 'doc-cert-1', fileName: `${doctor.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Certificate.pdf`, type: 'registration_certificate', sha256: '9a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a', status: doctor.verification || 'Verified' },
      { id: 'doc-cert-2', fileName: `${doctor.name.replace(/[^a-zA-Z0-9]/g, '_')}_Specialist_Degree.pdf`, type: 'degree_certificate', sha256: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f', status: doctor.verification || 'Verified' }
    ]);
    setShowDocModal(true);
  };

  // Open Edit Doctor Modal
  const handleOpenEditDoctorModal = (doc) => {
    setEditingDoctor(doc);
    setEditDoctorForm({
      name: doc.name || '',
      specialty: doc.specialty || 'Cardiology',
      department: doc.department || 'Cardiology',
      regNumber: doc.regNumber || 'TNMC/2021/04812',
      qualifications: doc.qualifications || 'MBBS, MD',
      verification: doc.verification || 'Pending',
      availability: doc.availability || 'Available'
    });
    setShowEditDoctorModal(true);
  };

  // Helper to record events in the immutable audit trail
  const logAuditEvent = (eventData) => {
    let currentLogs = [];
    const savedLogs = localStorage.getItem('medibridge_audit_logs');
    if (savedLogs) {
      try {
        currentLogs = JSON.parse(savedLogs);
      } catch (e) {}
    }
    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newLog = {
      id: `AUD-${Math.floor(9100 + Math.random() * 899)}`,
      timestamp: `Today, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      status: 'SUCCESS',
      hash: `SHA256:${randomHex}`,
      certInCompliant: true,
      ...eventData
    };
    const updated = [newLog, ...currentLogs];
    localStorage.setItem('medibridge_audit_logs', JSON.stringify(updated));
    return newLog;
  };

  // Submit Edit Doctor
  const handleEditDoctorSubmit = (e) => {
    e.preventDefault();
    if (!editingDoctor) return;

    const oldName = editingDoctor.name;
    const updatedDocs = screen8Doctors.map((d) => {
      if (d.id === editingDoctor.id) {
        return {
          ...d,
          name: editDoctorForm.name.trim(),
          specialty: editDoctorForm.specialty,
          department: editDoctorForm.department,
          regNumber: editDoctorForm.regNumber,
          qualifications: editDoctorForm.qualifications,
          verification: editDoctorForm.verification,
          availability: editDoctorForm.availability
        };
      }
      return d;
    });

    setScreen8Doctors(updatedDocs);
    localStorage.setItem('medibridge_hospital_doctors', JSON.stringify(updatedDocs));

    // Also update in medibridge_doctor_verifications if name or verification changed
    const savedVer = localStorage.getItem('medibridge_doctor_verifications');
    if (savedVer) {
      try {
        const verList = JSON.parse(savedVer);
        const updatedVerList = verList.map((v) => {
          if (v.doctorName === oldName || v.doctorName === editingDoctor.name) {
            return {
              ...v,
              doctorName: editDoctorForm.name.trim(),
              specialty: editDoctorForm.specialty,
              department: editDoctorForm.department,
              regNumber: editDoctorForm.regNumber,
              status: editDoctorForm.verification === 'Verified' ? 'Verified' : 'Under Verification',
              currentStep: editDoctorForm.verification === 'Verified' ? 4 : v.currentStep
            };
          }
          return v;
        });
        localStorage.setItem('medibridge_doctor_verifications', JSON.stringify(updatedVerList));
      } catch (err) {}
    }

    // Also update in medibridge_doctor_availability_schedules if doctor name or department changed
    const savedSch = localStorage.getItem('medibridge_doctor_availability_schedules');
    if (savedSch) {
      try {
        const schList = JSON.parse(savedSch);
        const updatedSchList = schList.map((s) => {
          if (s.doctorName === oldName || s.doctorName === editingDoctor.name) {
            return {
              ...s,
              doctorName: editDoctorForm.name.trim(),
              specialty: editDoctorForm.specialty,
              department: editDoctorForm.department
            };
          }
          return s;
        });
        localStorage.setItem('medibridge_doctor_availability_schedules', JSON.stringify(updatedSchList));
      } catch (err) {}
    }

    // Record in Audit Trail
    logAuditEvent({
      category: 'Doctor Credentialing',
      eventType: 'DOCTOR_RECORD_MODIFIED',
      actor: user?.name ? `Admin: ${user.name}` : 'Admin: Medical Superintendent',
      actorRole: 'Hospital Administrator',
      terminal: 'Peelamedu Admin Desk #1 (192.168.1.104)',
      target: `${editDoctorForm.name.trim()} (${editDoctorForm.specialty})`,
      details: `Modified credentials for ${editDoctorForm.name.trim()} (${editDoctorForm.department}). Availability set to ${editDoctorForm.availability}, Verification set to ${editDoctorForm.verification}.`,
      oldValue: `Verification: ${editingDoctor.verification || 'Pending'}, Availability: ${editingDoctor.availability || 'Available'}`,
      newValue: `Verification: ${editDoctorForm.verification}, Availability: ${editDoctorForm.availability}`
    });

    window.dispatchEvent(new Event('storage'));
    refreshDynamicMetrics();

    setShowEditDoctorModal(false);
    setEditingDoctor(null);
    setMsg({ type: 'success', text: `Doctor record for ${editDoctorForm.name.trim()} updated across all hospital modules and logged in audit ledger.` });
  };

  // Add New Doctor and sync to all modules (Doctor Management, Verification, Availability, Dashboard)
  const handleAddDoctorSubmit = (e) => {
    e.preventDefault();
    if (!newDoctorForm.name.trim()) return;

    const newId = `doc-${Date.now()}`;
    const newEntry = {
      id: newId,
      name: newDoctorForm.name.trim(),
      specialty: newDoctorForm.specialty,
      department: newDoctorForm.department,
      regNumber: newDoctorForm.regNumber || `TNMC/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      qualifications: newDoctorForm.qualifications || 'MBBS, MD',
      verification: 'Pending',
      availability: 'Available'
    };

    const updatedDoctors = [newEntry, ...screen8Doctors];
    setScreen8Doctors(updatedDoctors);
    localStorage.setItem('medibridge_hospital_doctors', JSON.stringify(updatedDoctors));

    // Also sync to medibridge_doctor_verifications so it appears in Doctor Verification module!
    let verifications = [];
    const savedVer = localStorage.getItem('medibridge_doctor_verifications');
    if (savedVer) {
      try { verifications = JSON.parse(savedVer); } catch (e) {}
    } else {
      verifications = [
        { id: 'ver-1', doctorName: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology', regNumber: 'TNMC/2017/09841', status: 'Under Verification', currentStep: 3, submissionDate: '21 Nov 2026', documents: [{ name: 'Medical_Registration.pdf', type: 'Registration Certificate', status: 'Verified' }] },
        { id: 'ver-2', doctorName: 'Dr. Priya Dharshini', specialty: 'Pediatrics', department: 'Pediatrics', regNumber: 'TNMC/2019/11234', status: 'Under Verification', currentStep: 3, submissionDate: '22 Nov 2026', documents: [{ name: 'TNMC_Medical_Council_Reg.pdf', type: 'Registration Certificate', status: 'Verified' }] },
        { id: 'ver-3', doctorName: 'Dr. Karthik Raja', specialty: 'General Surgery', department: 'General Surgery', regNumber: 'TNMC/2014/05678', status: 'Info Requested', currentStep: 2, submissionDate: '19 Nov 2026', documents: [{ name: 'TNMC_Medical_Registration.pdf', type: 'Registration Certificate', status: 'Verified' }] }
      ];
    }
    const newVerEntry = {
      id: `ver-${Date.now()}`,
      doctorName: newDoctorForm.name.trim(),
      specialty: newDoctorForm.specialty,
      department: newDoctorForm.department,
      regNumber: newDoctorForm.regNumber || `TNMC/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      medicalCouncil: 'Tamil Nadu Medical Council',
      qualification: newDoctorForm.qualifications || 'MBBS, MD',
      experienceYears: 5,
      status: 'Under Verification',
      currentStep: 2,
      submissionDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      documents: [
        { name: `${newDoctorForm.name.trim().replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Certificate.pdf`, type: 'Registration Certificate', status: 'Pending Review', hash: '8f4c2e1a9b3d5f7e6a1c2b3d4e5f6a7b8c9d0e1f' },
        { name: `${newDoctorForm.name.trim().replace(/[^a-zA-Z0-9]/g, '_')}_Degree_Certificate.pdf`, type: 'Degree Certificate', status: 'Pending Review', hash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f' }
      ],
      adminNotes: 'Newly onboarded physician. Verification of medical council credentials initiated by hospital admin.'
    };
    const updatedVerifications = [newVerEntry, ...verifications];
    localStorage.setItem('medibridge_doctor_verifications', JSON.stringify(updatedVerifications));

    // Also sync to medibridge_doctor_availability_schedules so doctor appears in Doctor Availability!
    let schedules = [];
    const savedSch = localStorage.getItem('medibridge_doctor_availability_schedules');
    if (savedSch) {
      try { schedules = JSON.parse(savedSch); } catch (e) {}
    } else {
      schedules = [
        { id: 'sch-1', doctorName: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', days: 'Monday - Friday', time: '09:00 AM - 01:00 PM', mode: 'In-Person OPD', room: 'OPD 204', maxTokens: 20, booked: 16, status: 'Active' },
        { id: 'sch-2', doctorName: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', days: 'Monday, Wednesday, Friday', time: '02:30 PM - 05:00 PM', mode: 'Teleconsultation', room: 'Virtual Desk', maxTokens: 12, booked: 8, status: 'Active' },
        { id: 'sch-3', doctorName: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology', days: 'Tuesday, Thursday, Saturday', time: '09:00 AM - 01:30 PM', mode: 'In-Person OPD', room: 'OPD 310', maxTokens: 18, booked: 12, status: 'Active' },
        { id: 'sch-4', doctorName: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', days: 'Monday - Saturday', time: '10:00 AM - 02:00 PM', mode: 'In-Person OPD', room: 'OPD 108', maxTokens: 25, booked: 21, status: 'Active' },
        { id: 'sch-5', doctorName: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', days: 'Monday - Saturday', time: '08:30 AM - 12:30 PM', mode: 'In-Person OPD', room: 'OPD 102', maxTokens: 30, booked: 28, status: 'Active' },
        { id: 'sch-6', doctorName: 'Dr. M. Revathi', specialty: 'Cardiology', department: 'Cardiology', days: 'Tuesday, Thursday, Saturday', time: '02:00 PM - 06:00 PM', mode: 'Teleconsultation', room: 'Virtual Desk', maxTokens: 15, booked: 9, status: 'Active' }
      ];
    }
    const newSchedule = {
      id: `sch-${Date.now()}`,
      doctorName: newDoctorForm.name.trim(),
      specialty: newDoctorForm.specialty,
      department: newDoctorForm.department,
      days: 'Monday - Friday',
      time: '09:00 AM - 01:00 PM',
      mode: 'In-Person OPD',
      room: `OPD ${Math.floor(100 + Math.random() * 200)}`,
      maxTokens: 20,
      booked: 0,
      status: 'Active'
    };
    const updatedSchedules = [newSchedule, ...schedules];
    localStorage.setItem('medibridge_doctor_availability_schedules', JSON.stringify(updatedSchedules));

    // Record Doctor Onboarding in Immutable Audit Ledger
    logAuditEvent({
      category: 'Doctor Credentialing',
      eventType: 'DOCTOR_ADDED',
      actor: user?.name ? `Admin: ${user.name}` : 'Admin: Medical Superintendent',
      actorRole: 'Hospital Administrator',
      terminal: 'Peelamedu Admin Desk #1 (192.168.1.104)',
      target: `${newDoctorForm.name.trim()} (${newDoctorForm.specialty})`,
      details: `New physician onboarded into ${newDoctorForm.department} Department. Council Reg #${newDoctorForm.regNumber || 'TNMC-Pending'}. Credentials placed into Stage 2 Document Verification queue.`,
      oldValue: 'Unregistered',
      newValue: `Doctor ID: ${newId} (Status: Pending Verification)`
    });

    window.dispatchEvent(new Event('storage'));
    refreshDynamicMetrics();

    setShowAddDoctorModal(false);
    setNewDoctorForm({ name: '', specialty: 'Cardiology', regNumber: '', qualifications: '', department: 'Cardiology' });
    setMsg({ type: 'success', text: `Doctor ${newDoctorForm.name.trim()} successfully added to hospital staff, credential verification queue, OPD scheduling, and logged in Audit Ledger.` });
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
          SUPER ADMIN PORTAL VIEWS (9 FULLY FUNCTIONAL MODULES)
          ================================================================ */}
      {user?.role === 'super_admin' && (
        <>
          {(currentTab === 'dashboard' || currentTab === 'platform') && (
            <SuperAdminDashboardView
              onNavigateTab={(tab) => navigate(`/admin-console?tab=${tab}`)}
              onToast={setMsg}
            />
          )}

          {currentTab === 'hospitals' && (
            <HospitalManagementView onToast={setMsg} />
          )}

          {(currentTab === 'approvals' || currentTab === 'hospital-approvals') && (
            <HospitalApprovalsView onToast={setMsg} />
          )}

          {currentTab === 'users' && (
            <UserManagementView onToast={setMsg} />
          )}

          {currentTab === 'roles' && (
            <RoleManagementView onToast={setMsg} />
          )}

          {currentTab === 'monitoring' && (
            <PlatformMonitoringView onToast={setMsg} />
          )}

          {(currentTab === 'audit' || currentTab === 'audit-logs') && (
            <SuperAdminAuditLogsView onToast={setMsg} />
          )}

          {currentTab === 'reports' && (
            <SuperAdminReportsView onToast={setMsg} />
          )}

          {(currentTab === 'settings' || currentTab === 'system') && (
            <SystemSettingsView onToast={setMsg} />
          )}
        </>
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
                <span className="ref-metric-value">{dynamicMetrics.totalDoctors}</span>
                <span className="ref-metric-label">Total Doctors</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.verifiedDoctors}</span>
                <span className="ref-metric-label">Verified Doctors</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Calendar size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.todayAppointments}</span>
                <span className="ref-metric-label">Today's Appointments</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Clock size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.pendingRequests}</span>
                <span className="ref-metric-label">Pending Requests</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Bed size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.genAvailable} / {dynamicMetrics.genTotal}</span>
                <span className="ref-metric-label">Available General Beds</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <Activity size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.icuAvailable} / {dynamicMetrics.icuTotal}</span>
                <span className="ref-metric-label">Available ICU Beds</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <UserCheck size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.doctorVerificationsPending}</span>
                <span className="ref-metric-label">Doctor Verifications</span>
              </div>
            </div>

            <div className="ref-metric-card">
              <div className="ref-metric-icon pink">
                <AlertTriangle size={22} strokeWidth={2} />
              </div>
              <div className="ref-metric-info">
                <span className="ref-metric-value">{dynamicMetrics.cancellationsPending}</span>
                <span className="ref-metric-label">Cancellations Pending</span>
              </div>
            </div>
          </div>

          {/* 2-Column Main Content Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Left Card: Pending Approvals */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Pending Approvals ({dynamicMetrics.doctorVerificationsPending + dynamicMetrics.cancellationsPending + dynamicMetrics.replacementRequests})
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
                    {dynamicMetrics.doctorVerificationsPending}
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
                    {dynamicMetrics.cancellationsPending}
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
                    {dynamicMetrics.replacementRequests}
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

              {(() => {
                const bedPercent = dynamicMetrics.genTotal > 0 ? Math.round((dynamicMetrics.genAvailable / dynamicMetrics.genTotal) * 100) : 87;
                const strokeOffset = 251.2 - (251.2 * bedPercent) / 100;
                return (
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
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="ref-donut-center">
                        <span className="ref-donut-percent">{bedPercent}%</span>
                        <span className="ref-donut-subtext">Available</span>
                      </div>
                    </div>

                    <div className="ref-donut-legend">
                      <div className="ref-legend-item">
                        <span className="ref-legend-dot" style={{ backgroundColor: '#477B67' }} />
                        <span>Available ({dynamicMetrics.genAvailable})</span>
                      </div>
                      <div className="ref-legend-item">
                        <span className="ref-legend-dot" style={{ backgroundColor: '#B77A32' }} />
                        <span>Occupied ({Math.max(0, dynamicMetrics.genTotal - dynamicMetrics.genAvailable)})</span>
                      </div>
                      <div className="ref-legend-item">
                        <span className="ref-legend-dot" style={{ backgroundColor: '#9CA3AF' }} />
                        <span>Maintenance (0)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          HOSPITAL ADMIN PORTAL OPERATIONS (Only for hospital_admin)
          ================================================================ */}
      {user?.role !== 'super_admin' && (
        <>
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button className="btn-action-view" onClick={() => handleInspectDoctorDocs(doc)}>
                            View
                          </button>
                          <button
                            className="btn-action-view"
                            style={{
                              borderColor: 'var(--color-primary)',
                              color: 'var(--color-primary)',
                              backgroundColor: '#FAF6F7'
                            }}
                            onClick={() => handleOpenEditDoctorModal(doc)}
                          >
                            Edit
                          </button>
                        </div>
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
        <AuditLogsView onToast={setMsg} />
      )}

      {/* ================================================================
          MODULE 21: HOSPITAL SETTINGS
          ================================================================ */}
      {currentTab === 'settings' && (
        <HospitalSettingsView onToast={setMsg} />
      )}
        </>
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

      {/* MODAL 1B: EDIT DOCTOR */}
      {showEditDoctorModal && editingDoctor && (
        <Modal
          isOpen={showEditDoctorModal}
          onClose={() => { setShowEditDoctorModal(false); setEditingDoctor(null); }}
          title={`Edit Doctor Profile: ${editingDoctor.name}`}
        >
          <form onSubmit={handleEditDoctorSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Doctor Full Name</label>
              <Input
                type="text"
                placeholder="Doctor name with title"
                value={editDoctorForm.name}
                onChange={(e) => setEditDoctorForm({ ...editDoctorForm, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Specialty</label>
                <select
                  value={editDoctorForm.specialty}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, specialty: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Surgery">General Surgery</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Department</label>
                <select
                  value={editDoctorForm.department}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Surgery">General Surgery</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Council Reg #</label>
                <Input
                  type="text"
                  placeholder="e.g. TNMC/2018/12345"
                  value={editDoctorForm.regNumber}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, regNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Qualifications</label>
                <Input
                  type="text"
                  placeholder="e.g. MBBS, MD, DM"
                  value={editDoctorForm.qualifications}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, qualifications: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Verification Status</label>
                <select
                  value={editDoctorForm.verification}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, verification: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Availability Status</label>
                <select
                  value={editDoctorForm.availability}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, availability: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" type="button" onClick={() => { setShowEditDoctorModal(false); setEditingDoctor(null); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
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
