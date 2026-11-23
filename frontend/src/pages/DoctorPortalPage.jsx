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
import { generatePrescriptionPDF } from '../utils/prescriptionPdf';
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
  UserCheck,
  Bell,
  Settings,
  Download,
  Trash2,
  CalendarCheck,
  PhoneCall,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Filter,
  Save,
  Printer,
  Pill,
  Award,
  CheckSquare,
  MessageSquare
} from 'lucide-react';

export default function DoctorPortalPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab from URL (?tab=desk, ?tab=availability, ?tab=prescriptions, ?tab=referrals, ?tab=followups, ?tab=notifications, ?tab=credentials, ?tab=settings)
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // ==========================================================================
  // 1. DASHBOARD & PERSISTENT PENDING REQUESTS (Saved to localStorage)
  // ==========================================================================
  const [pendingRequests, setPendingRequests] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_pending_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'req-1', patient: 'Anitha K', dateTime: '24 Nov, 11:00 AM', mode: 'Online', reason: 'Follow-up' },
      { id: 'req-2', patient: 'Karthik S', dateTime: '24 Nov, 12:00 PM', mode: 'In-Person', reason: 'Consultation' },
      { id: 'req-3', patient: 'Priya R', dateTime: '24 Nov, 02:30 PM', mode: 'Online', reason: 'Review Report' },
      { id: 'req-4', patient: 'Meena M', dateTime: '24 Nov, 04:00 PM', mode: 'In-Person', reason: 'Routine Check' }
    ];
  });

  const [confirmedCount, setConfirmedCount] = useState(() => {
    const val = localStorage.getItem('medibridge_doctor_confirmed_count');
    return val ? parseInt(val, 10) : 6;
  });

  const [cancellationCount, setCancellationCount] = useState(() => {
    const val = localStorage.getItem('medibridge_doctor_cancelled_count');
    return val ? parseInt(val, 10) : 2;
  });

  const handleAcceptRequest = (req) => {
    const updated = pendingRequests.filter((r) => r.id !== req.id);
    setPendingRequests(updated);
    localStorage.setItem('medibridge_doctor_pending_requests', JSON.stringify(updated));

    const newConfirmed = confirmedCount + 1;
    setConfirmedCount(newConfirmed);
    localStorage.setItem('medibridge_doctor_confirmed_count', String(newConfirmed));

    // Also add to appointments queue
    const newApt = {
      id: `apt-${Date.now()}`,
      time: req.dateTime.split(', ')[1] || '11:00 AM',
      patient: req.patient,
      mode: req.mode,
      reason: req.reason,
      status: 'Confirmed',
      actionType: req.mode === 'Online' ? 'consult' : 'view',
      sub: 'upcoming'
    };
    setScreen5Appointments((prev) => [newApt, ...prev]);

    setMsg({ type: 'success', text: `Appointment confirmed for ${req.patient} (${req.dateTime}).` });
  };

  const handleRejectRequest = (req) => {
    const updated = pendingRequests.filter((r) => r.id !== req.id);
    setPendingRequests(updated);
    localStorage.setItem('medibridge_doctor_pending_requests', JSON.stringify(updated));

    const newCancelled = cancellationCount + 1;
    setCancellationCount(newCancelled);
    localStorage.setItem('medibridge_doctor_cancelled_count', String(newCancelled));

    setMsg({ type: 'error', text: `Appointment request rejected for ${req.patient}.` });
  };

  const handleResetRequests = () => {
    const initial = [
      { id: 'req-1', patient: 'Anitha K', dateTime: '24 Nov, 11:00 AM', mode: 'Online', reason: 'Follow-up' },
      { id: 'req-2', patient: 'Karthik S', dateTime: '24 Nov, 12:00 PM', mode: 'In-Person', reason: 'Consultation' },
      { id: 'req-3', patient: 'Priya R', dateTime: '24 Nov, 02:30 PM', mode: 'Online', reason: 'Review Report' },
      { id: 'req-4', patient: 'Meena M', dateTime: '24 Nov, 04:00 PM', mode: 'In-Person', reason: 'Routine Check' }
    ];
    setPendingRequests(initial);
    setConfirmedCount(6);
    setCancellationCount(2);
    localStorage.removeItem('medibridge_doctor_pending_requests');
    localStorage.removeItem('medibridge_doctor_confirmed_count');
    localStorage.removeItem('medibridge_doctor_cancelled_count');
    setMsg({ type: 'success', text: 'Reset pending demo appointment requests.' });
  };

  // ==========================================================================
  // 2. UNIFIED APPOINTMENTS & CLINICAL DESK
  // ==========================================================================
  const [apptSubTab, setApptSubTab] = useState('today'); // 'today', 'pending', 'teleconsult', 'history'
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

  // Active Patient for Clinical Consultation Desk (Room 204)
  const [activeDeskPatient, setActiveDeskPatient] = useState(null);

  // ==========================================================================
  // 3. AVAILABILITY & DUTY SCHEDULE DEMO DATA (Persisted in localStorage)
  // ==========================================================================
  const [isDoctorAvailable, setIsDoctorAvailable] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_leave_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'l-1', dates: '24-25 Dec 2026', type: 'CME Conference Leave', duration: '2 Days', reason: 'Annual Cardiological Society CME Conference', status: 'APPROVED', coveringDoctor: 'Dr. K. Sundaram (Cardiology)' },
      { id: 'l-2', dates: '02-03 Jan 2027', type: 'Personal Leave', duration: '2 Days', reason: 'Family engagement & travel', status: 'PENDING', coveringDoctor: 'Dr. Prakash R (Orthopedics)' }
    ];
  });

  const [leaveBalances, setLeaveBalances] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_leave_balances');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { casual: 6, sick: 10, cme: 4 };
  });

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual / Personal Leave');
  const [leaveStartDate, setLeaveStartDate] = useState('2026-12-28');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-12-29');
  const [coveringDoctor, setCoveringDoctor] = useState('Dr. K. Sundaram (Consultant Cardiologist)');
  const [leaveReason, setLeaveReason] = useState('');
  const [emergencyLeaveContact, setEmergencyLeaveContact] = useState('+91 98421 99887');

  const calculateLeaveDays = (start, end) => {
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.max(0, d2 - d1);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleRequestLeave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      setMsg({ type: 'error', text: 'Please select both start date and end date.' });
      return;
    }

    const durationDays = calculateLeaveDays(leaveStartDate, leaveEndDate);
    const newLeave = {
      id: `l-${Date.now()}`,
      dates: `${leaveStartDate} to ${leaveEndDate}`,
      duration: `${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}`,
      type: leaveType || 'Casual / Personal Leave',
      reason: leaveReason || 'Planned medical specialist out-of-office leave',
      status: 'PENDING',
      coveringDoctor: coveringDoctor || 'Dr. K. Sundaram (Consultant Cardiologist)',
      emergencyContact: emergencyLeaveContact || '+91 98421 99887'
    };

    const updated = [newLeave, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem('medibridge_doctor_leave_requests', JSON.stringify(updated));

    // Update quota
    const newBal = { ...leaveBalances };
    if (leaveType.includes('Casual')) {
      newBal.casual = Math.max(0, newBal.casual - durationDays);
    } else if (leaveType.includes('Sick')) {
      newBal.sick = Math.max(0, newBal.sick - durationDays);
    } else if (leaveType.includes('CME')) {
      newBal.cme = Math.max(0, newBal.cme - durationDays);
    }
    setLeaveBalances(newBal);
    localStorage.setItem('medibridge_doctor_leave_balances', JSON.stringify(newBal));

    setShowLeaveModal(false);
    setLeaveReason('');
    setMsg({
      type: 'success',
      text: `Leave request for ${leaveStartDate} to ${leaveEndDate} (${durationDays} days) submitted successfully to KMCH Medical Administration.`
    });
  };

  // ==========================================================================
  // 4. PRESCRIPTIONS DEMO DATA
  // ==========================================================================
  const [prescriptionsList, setPrescriptionsList] = useState([
    {
      id: 'rx-1',
      rxNumber: 'RX-202611-0491',
      patientName: 'Priya R',
      patientAge: '42 / Female',
      date: '24 Nov 2026',
      diagnosis: 'Coronary Artery Disease & Essential Hypertension',
      status: 'Signed & Sent to Vault',
      medications: [
        { name: 'Tab Atorvastatin', dose: '20mg', freq: '0-0-1 (Night)', duration: '30 Days' },
        { name: 'Tab Metoprolol Succinate', dose: '25mg', freq: '1-0-0 (Morning)', duration: '30 Days' },
        { name: 'Tab Ecosprin', dose: '75mg', freq: '0-1-0 (After Lunch)', duration: '30 Days' }
      ]
    },
    {
      id: 'rx-2',
      rxNumber: 'RX-202611-0490',
      patientName: 'Arun K',
      patientAge: '55 / Male',
      date: '24 Nov 2026',
      diagnosis: 'Post-PTCA Drug-Eluting Stent Recovery',
      status: 'Signed & Sent to Vault',
      medications: [
        { name: 'Tab Clopidogrel', dose: '75mg', freq: '1-0-0 (Morning)', duration: '30 Days' },
        { name: 'Tab Rosuvastatin', dose: '10mg', freq: '0-0-1 (Night)', duration: '30 Days' },
        { name: 'Tab Ramipril', dose: '2.5mg', freq: '1-0-0 (Morning)', duration: '30 Days' }
      ]
    },
    {
      id: 'rx-3',
      rxNumber: 'RX-202611-0482',
      patientName: 'Deepa N',
      patientAge: '36 / Female',
      date: '23 Nov 2026',
      diagnosis: 'Paroxysmal Supraventricular Tachycardia (PSVT)',
      status: 'Signed & Sent to Vault',
      medications: [
        { name: 'Tab Propranolol', dose: '20mg', freq: '1-0-1 (Twice Daily)', duration: '15 Days' },
        { name: 'Cap CoQ10', dose: '100mg', freq: '1-0-0 (Morning)', duration: '30 Days' }
      ]
    },
    {
      id: 'rx-4',
      rxNumber: 'RX-202611-0475',
      patientName: 'Rajesh M',
      patientAge: '61 / Male',
      date: '22 Nov 2026',
      diagnosis: 'Dilated Cardiomyopathy with Reduced Ejection Fraction',
      status: 'Signed & Sent to Vault',
      medications: [
        { name: 'Tab Sacubitril / Valsartan', dose: '50mg', freq: '1-0-1 (Twice Daily)', duration: '30 Days' },
        { name: 'Tab Furosemide', dose: '20mg', freq: '1-0-0 (Morning)', duration: '15 Days' }
      ]
    }
  ]);
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [newRxPatient, setNewRxPatient] = useState('');
  const [newRxDiagnosis, setNewRxDiagnosis] = useState('');
  const [newRxDrug, setNewRxDrug] = useState('');

  // ==========================================================================
  // 5. FOLLOW-UPS DEMO DATA
  // ==========================================================================
  const [followupsList, setFollowupsList] = useState([
    {
      id: 'fol-1',
      patientName: 'Anitha K',
      age: '38 / Female',
      title: 'Post-Angioplasty Stent Recovery Review',
      date: '28 Nov 2026, 10:30 AM',
      mode: 'Online',
      priority: 'High Priority',
      status: 'Scheduled',
      notes: 'BP log monitoring (<130/80 mmHg). Review tolerance to dual antiplatelets.'
    },
    {
      id: 'fol-2',
      patientName: 'Karthik S',
      age: '45 / Male',
      title: 'Hypertension & Lipid Titration Review',
      date: '05 Dec 2026, 11:15 AM',
      mode: 'In-Person',
      priority: 'Routine',
      status: 'Upcoming',
      notes: 'Fasting lipid panel to be completed 24 hrs prior at KMCH Central Lab.'
    },
    {
      id: 'fol-3',
      patientName: 'Suresh V',
      age: '52 / Male',
      title: '3-Month Post-CABG Review',
      date: '12 Dec 2026, 02:00 PM',
      mode: 'Online',
      priority: 'Routine',
      status: 'Scheduled',
      notes: 'Review sternal healing and echo ejection fraction parameters.'
    },
    {
      id: 'fol-4',
      patientName: 'Meena M',
      age: '49 / Female',
      title: 'Cardiovascular Risk Stratification',
      date: '18 Nov 2026',
      mode: 'In-Person',
      priority: 'Routine',
      status: 'Completed',
      notes: 'Full recovery score logged. Dietary compliance excellent.'
    }
  ]);

  // ==========================================================================
  // 6. REFERRALS DEMO DATA
  // ==========================================================================
  const [referralsList, setReferralsList] = useState([
    {
      id: 'ref-1',
      referralNo: 'REF-KMCH-202611-0982',
      patientName: 'Rajesh Kumar (58 M)',
      fromHospital: 'Sri Ramakrishna Hospital, Coimbatore',
      toHospital: 'Kovai Medical Center & Hospital (KMCH)',
      specialty: 'Interventional Cardiology',
      priority: 'URGENT',
      slaCountdown: '3h 14m left',
      status: 'Accepted'
    },
    {
      id: 'ref-2',
      referralNo: 'REF-KMCH-202611-0975',
      patientName: 'Priya Dharshini (44 F)',
      fromHospital: 'Kovai Medical Center & Hospital (KMCH)',
      toHospital: 'Ganga Medical Center (Cardio-Thoracic Surgery)',
      specialty: 'Cardio-Thoracic Surgery (Mitral Valve)',
      priority: 'ROUTINE',
      slaCountdown: '22h 40m left',
      status: 'Handover Confirmed'
    },
    {
      id: 'ref-3',
      referralNo: 'REF-KMCH-202611-0968',
      patientName: 'Balasubramanian (67 M)',
      fromHospital: 'Coimbatore Medical College Hospital (CMCH)',
      toHospital: 'Kovai Medical Center & Hospital (KMCH)',
      specialty: 'Critical Care Cardiology (Trauma ICU)',
      priority: 'CRITICAL',
      slaCountdown: 'Immediate Handover',
      status: 'Admitted to Bed C-ICU-04'
    }
  ]);
  const [showCreateRefModal, setShowCreateRefModal] = useState(false);
  const [refPatientName, setRefPatientName] = useState('');
  const [refDestination, setRefDestination] = useState('Ganga Hospital');
  const [refSpecialty, setRefSpecialty] = useState('Cardiology');
  const [refPriority, setRefPriority] = useState('ROUTINE');

  // ==========================================================================
  // 7. NOTIFICATIONS DEMO DATA
  // ==========================================================================
  const [notifFilter, setNotifFilter] = useState('all');
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 'notif-1',
      type: 'CRITICAL',
      title: 'Level 1 Trauma Emergency Divert - 108 Ambulance En Route',
      time: '5 mins ago',
      message: 'Patient with severe cardiac trauma diverted to KMCH Casualty. Trauma ICU team on alert.',
      read: false
    },
    {
      id: 'notif-2',
      type: 'URGENT',
      title: 'New Inter-Hospital Referral: Sri Ramakrishna Hospital',
      time: '20 mins ago',
      message: 'Patient Rajesh Kumar (58 M) referred for refractory angina evaluation by Dr. Sundar M.',
      read: false
    },
    {
      id: 'notif-3',
      type: 'APPOINTMENT',
      title: 'New Teleconsultation Booked',
      time: '1 hour ago',
      message: 'Anitha K confirmed online video consultation slot for 28 Nov 2026 at 10:30 AM.',
      read: true
    },
    {
      id: 'notif-4',
      type: 'LAB_ALERT',
      title: 'Siemens 3T MRI Brain Scan Report Available',
      time: '3 hours ago',
      message: 'Axial scan report uploaded for patient Inpatient #KMCH-8921. SHA-256 verified.',
      read: true
    },
    {
      id: 'notif-5',
      type: 'SYSTEM',
      title: 'Weekly Clinical Schedule Finalized',
      time: 'Yesterday',
      message: 'OPD consultation slots for next week have been broadcast across MediBridge network.',
      read: true
    }
  ]);

  // ==========================================================================
  // 8. DOCTOR PROFILE & SETTINGS (Unified Module as Requested)
  // ==========================================================================
  const [doctorSettings, setDoctorSettings] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      fullName: 'Dr. Sundar M',
      regNumber: 'TNMC-123456',
      councilName: 'Tamil Nadu Medical Council',
      qualifications: 'MBBS, MD (Gen Med), DM (Cardiology), FACC',
      specialty: 'Cardiology',
      subSpecialty: 'Interventional Cardiology',
      hospitalName: 'Kovai Medical Center & Hospital (KMCH)',
      department: 'Cardiology OPD (Room 204)',
      inPersonFee: '800',
      teleconsultFee: '600',
      slotDuration: '15 mins',
      maxDailyPatients: '25',
      officialEmail: 'dr.sundar@kmch-health.org',
      deskPhone: '+91 422 4323800 Ext: 204',
      emergencyPhone: '+91 98421 99887',
      smsAlerts: true,
      whatsappLinks: true,
      emergencyTriageAlerts: true,
      twoFactorAuth: true
    };
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('identity'); // 'identity', 'fees', 'contact', 'alerts'

  const handleSaveDoctorSettings = (e) => {
    e.preventDefault();
    setSavingSettings(true);
    localStorage.setItem('medibridge_doctor_settings', JSON.stringify(doctorSettings));
    setTimeout(() => {
      setSavingSettings(false);
      setMsg({ type: 'success', text: 'Doctor profile, practice settings, and consultation fees updated successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  // ==========================================================================
  // 9. CREDENTIALS & VERIFICATION (Dedicated Verification Details Page)
  // ==========================================================================
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docUploadType, setDocUploadType] = useState('registration_certificate');

  const filteredNotifications = notificationsList.filter((n) => {
    if (notifFilter === 'critical') return n.type === 'CRITICAL' || n.type === 'URGENT';
    if (notifFilter === 'unread') return !n.read;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Toast Alert Banner */}
      {msg && (
        <div
          role="alert"
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: msg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-critical-bg)',
            color: msg.type === 'success' ? 'var(--status-success-text)' : 'var(--status-critical-text)',
            border: `1px solid ${msg.type === 'success' ? 'var(--status-success-accent)' : 'var(--status-critical-solid)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ================================================================
          1. DOCTOR DASHBOARD (SCREEN 4)
          ================================================================ */}
      {currentTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Welcome Header */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '18px',
              padding: '28px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Welcome, {doctorSettings.fullName}
                </h1>
                <span className="badge badge-pill badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} strokeWidth={2.5} /> Verified Doctor
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                {doctorSettings.specialty} &bull; {doctorSettings.hospitalName} &bull; {doctorSettings.department}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Calendar size={14} />
                <span>Request Leave</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreateRefModal(true)}
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={14} />
                <span>Dispatch Referral</span>
              </button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px 26px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>8</span>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--color-blush-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <Calendar size={18} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Today's Appointments
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px 26px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: pendingRequests.length > 0 ? '#B77A32' : 'var(--color-heading)' }}>
                  {pendingRequests.length}
                </span>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B77A32' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Pending Requests
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px 26px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {confirmedCount}
                </span>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success-solid)' }}>
                  <CheckCircle size={18} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Confirmed Appointments
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px 26px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {cancellationCount}
                </span>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--color-pale-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <RefreshCw size={18} />
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '6px' }}>
                Cancellation Requests
              </div>
            </div>
          </div>

          {/* Pending Appointment Requests Section (SCREEN 4) */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Pending Appointment Requests ({pendingRequests.length})
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Review and confirm or decline incoming patient consultation requests
                </p>
              </div>

              {pendingRequests.length === 0 ? (
                <button
                  type="button"
                  onClick={handleResetRequests}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  Reload Demo Requests
                </button>
              ) : (
                <Link
                  to="/doctor-portal?tab=desk"
                  style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  View All &rarr;
                </Link>
              )}
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
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        All pending consultation requests have been accepted or processed.
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((req) => (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--color-heading)' }}>
                          {req.patient}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>
                          {req.dateTime}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: req.mode === 'Online' ? '#F8DDE3' : '#F3F4F6',
                              color: req.mode === 'Online' ? 'var(--color-primary)' : 'var(--text)'
                            }}
                          >
                            {req.mode}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                          {req.reason}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(req)}
                              className="btn btn-sm btn-primary"
                              style={{ padding: '5px 14px', fontSize: '0.75rem' }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(req)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '5px 14px', fontSize: '0.75rem', color: '#C44752', borderColor: '#C44752' }}
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
          2. UNIFIED APPOINTMENTS & CLINICAL DESK (Merged Module)
          ================================================================ */}
      {(currentTab === 'desk' || currentTab === 'appointments') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Appointments & Clinical Desk
                </h1>
                <span className="badge badge-pill badge-primary">Unified Clinical Desk</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Integrated patient consultation queue, clinical consultation management, and appointment scheduler.
              </p>
            </div>
          </div>

          {/* Sub-tabs pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'today', label: `Today's Queue (${screen5Appointments.length})` },
              { id: 'pending', label: `Pending Requests (${pendingRequests.length})` },
              { id: 'teleconsult', label: 'Online Teleconsultations (4)' },
              { id: 'history', label: 'Past Consultations (12)' }
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
                  color: apptSubTab === tab.id ? '#FFFFFF' : 'var(--color-heading)',
                  boxShadow: apptSubTab === tab.id ? '0 2px 6px rgba(184, 61, 131, 0.25)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1 & Tab 3: Appointments List Table */}
          {(apptSubTab === 'today' || apptSubTab === 'teleconsult' || apptSubTab === 'history') && (
            <div
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '16px',
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
                    {screen5Appointments
                      .filter((apt) => {
                        if (apptSubTab === 'teleconsult') return apt.mode === 'Online';
                        if (apptSubTab === 'history') return apt.status === 'Completed';
                        return true;
                      })
                      .map((apt) => (
                        <tr key={apt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                            {apt.time}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                            {apt.patient}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: apt.mode === 'Online' ? '#F8DDE3' : '#F3F4F6',
                                color: apt.mode === 'Online' ? 'var(--color-primary)' : 'var(--text)'
                              }}
                            >
                              {apt.mode}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                            {apt.reason}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span
                              className={`badge badge-pill ${apt.status === 'Completed' ? 'badge-success' : apt.status === 'In Progress' ? 'badge-primary' : 'badge-neutral'}`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {apt.mode === 'Online' ? (
                              <Link
                                to={`/teleconsult/room/${apt.id}`}
                                className="btn btn-sm btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                              >
                                <Video size={13} />
                                <span>Join Video Consult</span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveDeskPatient(apt)}
                                className="btn btn-sm btn-outline"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              >
                                <Stethoscope size={13} />
                                <span>Open Desk</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Pending Requests */}
          {apptSubTab === 'pending' && (
            <div
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
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
                        <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No pending requests at this time.
                        </td>
                      </tr>
                    ) : (
                      pendingRequests.map((req) => (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--color-heading)' }}>
                            {req.patient}
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>
                            {req.dateTime}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: req.mode === 'Online' ? '#F8DDE3' : '#F3F4F6',
                                color: req.mode === 'Online' ? 'var(--color-primary)' : 'var(--text)'
                              }}
                            >
                              {req.mode}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                            {req.reason}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleAcceptRequest(req)}
                                className="btn btn-sm btn-primary"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(req)}
                                className="btn btn-sm btn-outline"
                                style={{ color: '#C44752', borderColor: '#C44752' }}
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
          )}
        </div>
      )}

      {/* ================================================================
          3. AVAILABILITY & DUTY SCHEDULE (Demo Data)
          ================================================================ */}
      {(currentTab === 'availability' || currentTab === 'leave') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Clinical Availability & Duty Schedule
                </h1>
                <span className={`badge badge-pill ${isDoctorAvailable ? 'badge-success' : 'badge-danger'}`}>
                  {isDoctorAvailable ? 'Available on Duty' : 'Off Duty / On Leave'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Configure OPD hospital timings, telemedicine consultation windows, and leave requests.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsDoctorAvailable(!isDoctorAvailable)}
                className="btn btn-sm btn-outline"
              >
                Toggle Duty Status
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="btn btn-sm btn-primary"
              >
                + Request Leave
              </button>
            </div>
          </div>

          {/* Weekly Schedule Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { day: 'Monday to Friday (Morning)', time: '09:00 AM - 01:00 PM', loc: 'KMCH Cardiology OPD (Room 204)', type: 'In-Person Consultation (16 Slots)', status: 'Active' },
              { day: 'Monday to Friday (Afternoon)', time: '02:30 PM - 05:00 PM', loc: 'MediBridge WebRTC Bridge', type: 'Online Teleconsultation (8 Slots)', status: 'Active' },
              { day: 'Saturday (Morning)', time: '09:00 AM - 01:00 PM', loc: 'Trauma & Special Clinics', type: 'Post-Op Follow-up Clinic (10 Slots)', status: 'Active' },
              { day: 'Sunday', time: 'All Day', loc: 'Emergency Call Roster', type: 'Level 1 Trauma Triage On-Call', status: 'On-Call' }
            ].map((sched, idx) => (
              <div
                key={idx}
                className="card"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-card)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: 'var(--color-heading)', fontSize: '0.9375rem' }}>{sched.day}</span>
                  <span className="badge badge-pill badge-primary">{sched.status}</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-primary)', marginTop: '8px' }}>
                  {sched.time}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text)', fontWeight: '600', marginTop: '4px' }}>
                  {sched.loc}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {sched.type}
                </div>
              </div>
            ))}
          </div>

          {/* Leave History Table */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Scheduled Leaves & Out-of-Office Records
              </h3>
            </div>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Dates</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Duration</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Leave Type</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Handover Physician</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Reason & Justification</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--color-heading)' }}>{l.dates}</td>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--color-primary)' }}>{l.duration || '2 Days'}</td>
                      <td style={{ padding: '14px 20px' }}>{l.type}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>{l.coveringDoctor || 'Dr. K. Sundaram (Cardiology)'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>{l.reason}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge badge-pill ${l.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                          {l.status}
                        </span>
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
          4. PRESCRIPTIONS DEMO DATA
          ================================================================ */}
      {currentTab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Digital Prescriptions & Medication Orders ({prescriptionsList.length})
                </h1>
                <span className="badge badge-pill badge-success">ABDM Signed</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Certified e-Prescriptions cryptographically bound and synced with patient private health vaults.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddRxModal(true)}
              className="btn btn-primary"
            >
              + Write New Prescription
            </button>
          </div>

          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Rx Reference</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Patient Details</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Diagnosis</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Medications List</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionsList.map((rx) => (
                    <tr key={rx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {rx.rxNumber}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--color-heading)' }}>{rx.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rx.patientAge} &bull; {rx.date}</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                        {rx.diagnosis}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {rx.medications.map((m, idx) => (
                            <span key={idx} style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                              &bull; {m.name} ({m.dose}) - {m.freq}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-pill badge-success">{rx.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            generatePrescriptionPDF(rx, doctorSettings);
                            setMsg({ type: 'success', text: `Generated & downloaded official prescription PDF for ${rx.rxNumber} (${rx.patientName}).` });
                          }}
                          className="btn btn-sm btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={13} />
                          <span>PDF</span>
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
          5. FOLLOW-UPS DEMO DATA
          ================================================================ */}
      {currentTab === 'followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Doctor's Patient Follow-up Tracker ({followupsList.length})
                </h1>
                <span className="badge badge-pill badge-primary">Active Care Plans</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Track recovery milestones, vital parameter logs, and scheduled clinical re-evaluations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {followupsList.map((fol) => (
              <div
                key={fol.id}
                className="card"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {fol.patientName} ({fol.age})
                    </h3>
                    <span className={`badge badge-pill ${fol.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>
                      {fol.status}
                    </span>
                    {fol.priority === 'High Priority' && (
                      <span className="badge badge-pill badge-danger">High Priority</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px' }}>
                    {fol.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {fol.notes}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {fol.date}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Mode: {fol.mode}
                    </span>
                  </div>

                  {fol.mode === 'Online' && fol.status === 'Scheduled' && (
                    <Link
                      to={`/teleconsult/room/${fol.id}`}
                      className="btn btn-sm btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                      <Video size={14} />
                      <span>Start Video Consult</span>
                    </Link>
                  )}
                  {fol.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFollowupsList(followupsList.map(f => f.id === fol.id ? { ...f, status: 'Completed' } : f));
                        setMsg({ type: 'success', text: `Marked follow-up completed for ${fol.patientName}.` });
                      }}
                      className="btn btn-sm btn-outline"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          6. REFERRALS DEMO DATA
          ================================================================ */}
      {currentTab === 'referrals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Inter-Hospital Specialty Referrals ({referralsList.length})
                </h1>
                <span className="badge badge-pill badge-primary">SLA Enforced</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Cross-hospital patient handovers with statutory turnaround time tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateRefModal(true)}
              className="btn btn-primary"
            >
              + Dispatch Referral
            </button>
          </div>

          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Referral No</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Patient</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Referring Facility</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Destination</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Priority & SLA</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referralsList.map((ref) => (
                    <tr key={ref.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {ref.referralNo}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '700' }}>
                        {ref.patientName}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                        {ref.fromHospital}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>
                        {ref.toHospital}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge badge-pill ${ref.priority === 'CRITICAL' ? 'badge-danger' : ref.priority === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}>
                          {ref.priority} ({ref.slaCountdown})
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-pill badge-success">{ref.status}</span>
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
          7. NOTIFICATIONS DEMO DATA
          ================================================================ */}
      {currentTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Clinical Notifications & Urgent Alerts ({notificationsList.length})
                </h1>
                <span className="badge badge-pill badge-danger">Real-time Feed</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Urgent hospital trauma diverts, diagnostic report arrivals, and teleconsultation updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNotificationsList(notificationsList.map(n => ({ ...n, read: true })));
                setMsg({ type: 'success', text: 'All clinical alerts marked as acknowledged.' });
              }}
              className="btn btn-sm btn-outline"
            >
              Mark All as Read
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'critical', 'unread'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setNotifFilter(f)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: notifFilter === f ? 'var(--color-primary)' : 'var(--border)',
                  backgroundColor: notifFilter === f ? 'var(--color-primary)' : '#FFFFFF',
                  color: notifFilter === f ? '#FFFFFF' : 'var(--color-heading)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {f} Alerts
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="card"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: notif.type === 'CRITICAL' ? '2px solid #C44752' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px 22px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: notif.type === 'CRITICAL' ? '#FEE2E2' : 'var(--color-blush-pink)',
                      color: notif.type === 'CRITICAL' ? '#C44752' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                        {notif.title}
                      </span>
                      <span className={`badge badge-pill ${notif.type === 'CRITICAL' ? 'badge-danger' : notif.type === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}>
                        {notif.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {notif.message}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {notif.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          8. CREDENTIALS & VERIFICATION (Dedicated Verification Details Page)
          ================================================================ */}
      {currentTab === 'credentials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Doctor Credentials & Verification
                </h1>
                <span className="badge badge-pill badge-success">Verified Medical Practitioner</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Medical council certifications, university degree documents, and hospital clinical privileges.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploadDocModal(true)}
              className="btn btn-primary"
            >
              + Upload Credential Document
            </button>
          </div>

          {/* Stepper Progress Bar (Screen 6) */}
          <div className="ref-stepper" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
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

            <div className="ref-step done">
              <div className="ref-step-circle">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <span className="ref-step-label">Council Verified</span>
              <div className="ref-step-line" />
            </div>

            <div className="ref-step done">
              <div className="ref-step-circle">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <span className="ref-step-label">Verified & Privileged</span>
            </div>
          </div>

          {/* Verification Details & Documents Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Card 1: Official Verification Details */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                Medical Council Verification Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registration Number:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--color-heading)' }}>TNMC-123456</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registered Council:</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-heading)' }}>Tamil Nadu Medical Council</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recognized Qualifications:</span>
                  <span style={{ fontWeight: '600' }}>MBBS, MD (Gen Med), DM (Cardiology), FACC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Clinical Verification Status:</span>
                  <span className="badge badge-pill badge-success">Verified Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Verification Hash:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary)' }}>SHA256: 8a7c6e5d4b3a2f1e...</span>
                </div>
              </div>
            </div>

            {/* Card 2: Uploaded Certificates Table */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                Uploaded Certificates & Accreditation Letters
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Medical Registration Certificate (TNMC)', date: 'Verified 2024', file: 'TNMC_Registration_Certificate.pdf' },
                  { name: 'MBBS Degree Certificate', date: 'MGR University Verified', file: 'Degree_Certificate_MBBS.pdf' },
                  { name: 'DM (Cardiology) Specialization Certificate', date: 'Verified Specialty', file: 'Specialization_DM_Cardio.pdf' },
                  { name: 'Hospital Clinical Privileges Accreditation Letter', date: 'KMCH Hospital Privilege 2026', file: 'KMCH_Clinical_Privileges.pdf' }
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#FAF6F7',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--status-success-solid)', fontWeight: '600' }}>
                        &bull; {doc.date}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMsg({ type: 'success', text: `Downloading verified file "${doc.file}"...` })}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          9. DOCTOR PROFILE & SETTINGS (Unified Module as Requested)
          ================================================================ */}
      {(currentTab === 'profile' || currentTab === 'settings') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Doctor Hero Card */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-blush-pink)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  border: '2px solid var(--border)',
                  position: 'relative'
                }}
              >
                {doctorSettings.fullName?.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'DR'}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-success-solid)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    {doctorSettings.fullName}
                  </h1>
                  <span className="badge badge-pill badge-primary">Consultant Specialist</span>
                  <span className="badge badge-pill badge-success">Verified Active</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--color-heading)', fontWeight: '600' }}>
                  {doctorSettings.specialty} ({doctorSettings.subSpecialty || 'Interventional Cardiology'}) &bull; {doctorSettings.hospitalName}
                </p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span><strong>Council Reg:</strong> {doctorSettings.regNumber} ({doctorSettings.councilName})</span>
                  <span><strong>Qualifications:</strong> {doctorSettings.qualifications}</span>
                  <span><strong>Clinic:</strong> {doctorSettings.department}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDoctorSettings}
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
            >
              <Save size={16} />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Profile & Settings'}</span>
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-pale-rose)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Clinical Experience</span>
                <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>14+ Years</div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-pale-rose)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Consultations</span>
                <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>1,850+ Verified</div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-pale-rose)', color: 'var(--status-success-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Council Standing</span>
                <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--status-success-solid)' }}>Good Standing (NDHM)</div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-pale-rose)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>OPD Location</span>
                <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>Room 204, KMCH</div>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'identity', label: '1. Professional Identity & Credentials' },
              { id: 'fees', label: '2. Consultation Fees & OPD Rules' },
              { id: 'contact', label: '3. Hospital Extensions & Communications' },
              { id: 'alerts', label: '4. Practice Alerts & Security' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsTab(tab.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: settingsTab === tab.id ? 'var(--color-primary)' : 'var(--border)',
                  backgroundColor: settingsTab === tab.id ? 'var(--color-primary)' : '#FFFFFF',
                  color: settingsTab === tab.id ? '#FFFFFF' : 'var(--color-heading)',
                  boxShadow: settingsTab === tab.id ? '0 2px 6px rgba(184, 61, 131, 0.25)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveDoctorSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* SUB-TAB 1: PROFESSIONAL IDENTITY */}
            {settingsTab === 'identity' && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  Professional Medical Credentials
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Doctor Full Name & Honorific</label>
                    <input
                      type="text"
                      value={doctorSettings.fullName}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, fullName: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>State Medical Council Registration No.</label>
                    <input
                      type="text"
                      value={doctorSettings.regNumber}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, regNumber: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>State Medical Council</label>
                    <input
                      type="text"
                      value={doctorSettings.councilName}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, councilName: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Clinical Qualifications & Fellowships</label>
                    <input
                      type="text"
                      value={doctorSettings.qualifications}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, qualifications: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Primary Specialty</label>
                    <input
                      type="text"
                      value={doctorSettings.specialty}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, specialty: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Sub-Specialty / Super-Specialization</label>
                    <input
                      type="text"
                      value={doctorSettings.subSpecialty}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, subSpecialty: e.target.value })}
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Affiliated Hospital Network</label>
                    <input
                      type="text"
                      value={doctorSettings.hospitalName}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, hospitalName: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Hospital Department & OPD Room</label>
                    <input
                      type="text"
                      value={doctorSettings.department}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, department: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: CONSULTATION FEES & PRICING */}
            {settingsTab === 'fees' && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  Consultation Pricing & Slot Rules
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>In-Person OPD Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={doctorSettings.inPersonFee}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, inPersonFee: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Online HD Teleconsultation Fee (₹)</label>
                    <input
                      type="number"
                      value={doctorSettings.teleconsultFee}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, teleconsultFee: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>OPD Consultation Slot Duration</label>
                    <select
                      className="form-select"
                      value={doctorSettings.slotDuration}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, slotDuration: e.target.value })}
                      style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                    >
                      <option value="15 mins">15 Minutes (Fast-Track / Follow-up)</option>
                      <option value="20 mins">20 Minutes (Standard Review)</option>
                      <option value="30 mins">30 Minutes (Comprehensive Cardiac Evaluation)</option>
                      <option value="45 mins">45 Minutes (Initial Super-Specialty Workup)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Maximum Daily OPD Patient Quota</label>
                    <input
                      type="number"
                      value={doctorSettings.maxDailyPatients}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, maxDailyPatients: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: HOSPITAL EXTENSIONS & COMMUNICATIONS */}
            {settingsTab === 'contact' && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  Hospital Internal Communications & Extensions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Official Clinical Email</label>
                    <input
                      type="email"
                      value={doctorSettings.officialEmail}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, officialEmail: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Clinical Desk Phone (EPABX)</label>
                    <input
                      type="text"
                      value={doctorSettings.deskPhone}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, deskPhone: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Emergency On-Call Mobile (Physician Handset)</label>
                    <input
                      type="text"
                      value={doctorSettings.emergencyPhone}
                      onChange={(e) => setDoctorSettings({ ...doctorSettings, emergencyPhone: e.target.value })}
                      required
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>Hospital Emergency Pager ID</label>
                    <input
                      type="text"
                      defaultValue="PGR-KMCH-CARDIO-04"
                      readOnly
                      style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.875rem', backgroundColor: '#FAF6F7' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: PRACTICE ALERTS & SECURITY */}
            {settingsTab === 'alerts' && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  Practice Notifications & Clinical Safety Alerts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: '#FAF6F7', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>SMS Notifications for Urgent OPD Bookings</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive immediate SMS alerts on doctor handset when high-priority slots are requested</div>
                    </div>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={doctorSettings.smsAlerts}
                        onChange={(e) => setDoctorSettings({ ...doctorSettings, smsAlerts: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: doctorSettings.smsAlerts ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                        {doctorSettings.smsAlerts ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: '#FAF6F7', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>WhatsApp Direct Teleconsultation Room Link</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive direct encrypted WebRTC room bridge link on WhatsApp 10 minutes prior to online appointments</div>
                    </div>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={doctorSettings.whatsappLinks}
                        onChange={(e) => setDoctorSettings({ ...doctorSettings, whatsappLinks: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: doctorSettings.whatsappLinks ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                        {doctorSettings.whatsappLinks ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: '#FAF6F7', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>Critical Diagnostic Lab Panic Value Escalations</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate push notification when high-risk laboratory reports (Troponin-I, Serum K+) are validated</div>
                    </div>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={doctorSettings.emergencyTriageAlerts}
                        onChange={(e) => setDoctorSettings({ ...doctorSettings, emergencyTriageAlerts: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: doctorSettings.emergencyTriageAlerts ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                        {doctorSettings.emergencyTriageAlerts ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', backgroundColor: 'var(--color-pale-rose)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>108 Emergency Divert Casualty Broadcasts</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mandatory statutory alerts for inbound Level 1 cardiac trauma triage (Hospital Policy: Always Active)</div>
                    </div>
                    <span className="badge badge-pill badge-primary">Active</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="submit"
                disabled={savingSettings}
                className="btn btn-primary"
                style={{ minWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Save size={16} />
                <span>{savingSettings ? 'Saving Settings...' : 'Save Profile & Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: REQUEST LEAVE (Enhanced with Persistence, Validation & Handover) */}
      {showLeaveModal && (
        <Modal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title="Request Out-of-Office Leave"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Leave allowance summary */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-pale-rose)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Annual Leave Allowance</span>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                    Casual: <strong style={{ color: 'var(--color-primary)' }}>{leaveBalances.casual}</strong> Days
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                    Sick: <strong style={{ color: 'var(--color-primary)' }}>{leaveBalances.sick}</strong> Days
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                    CME: <strong style={{ color: 'var(--color-primary)' }}>{leaveBalances.cme}</strong> Days
                  </span>
                </div>
              </div>
              <span className="badge badge-pill badge-primary">KMCH Medical Staff</span>
            </div>

            <form
              onSubmit={handleRequestLeave}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                  required
                >
                  <option value="Casual / Personal Leave">Casual / Personal Leave (Remaining: {leaveBalances.casual} days)</option>
                  <option value="Sick / Medical Leave">Sick / Medical Leave (Remaining: {leaveBalances.sick} days)</option>
                  <option value="CME Conference Leave">CME & Academic Conference Leave (Remaining: {leaveBalances.cme} days)</option>
                  <option value="Academic & Clinical Training">Academic & Clinical Training Duty</option>
                  <option value="Emergency Personal Leave">Emergency Personal Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Calculated duration preview badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FAF6F7', borderRadius: '8px' }}>
                <Clock size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                  Calculated Duration: {calculateLeaveDays(leaveStartDate, leaveEndDate)} Days
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                  Covering / Relieving Physician (OPD Handover)
                </label>
                <select
                  value={coveringDoctor}
                  onChange={(e) => setCoveringDoctor(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                >
                  <option value="Dr. K. Sundaram (Consultant Cardiologist)">Dr. K. Sundaram (Consultant Cardiologist)</option>
                  <option value="Dr. M. Revathi (Interventional Cardiology)">Dr. M. Revathi (Interventional Cardiology)</option>
                  <option value="Dr. Prakash R (Orthopedics & Trauma)">Dr. Prakash R (Orthopedics & Trauma)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                  Reason & Clinical Justification
                </label>
                <textarea
                  rows="3"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State reason for absence or conference participation..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                  Emergency Contact During Leave
                </label>
                <input
                  type="text"
                  value={emergencyLeaveContact}
                  onChange={(e) => setEmergencyLeaveContact(e.target.value)}
                  placeholder="+91 98421 99887"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button type="button" variant="outline" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleRequestLeave}
                >
                  Submit Leave Request
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL: OPD CLINICAL CONSULTATION DESK (Room 204 Workstation) */}
      {activeDeskPatient && (
        <Modal
          isOpen={Boolean(activeDeskPatient)}
          onClose={() => setActiveDeskPatient(null)}
          title={`Clinical Consultation Desk • ${activeDeskPatient.patient} (Room 204)`}
          maxWidth="840px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Patient Demographic Banner */}
            <div
              style={{
                backgroundColor: 'var(--color-pale-rose)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-blush-pink)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1.125rem'
                  }}
                >
                  {activeDeskPatient.patient?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {activeDeskPatient.patient}
                    </h3>
                    <span className="badge badge-pill badge-primary">OPD Token #04</span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    42 Yrs &bull; Female &bull; UHID: KMCH-UHID-884920 &bull; {activeDeskPatient.time} &bull; {activeDeskPatient.mode}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge badge-pill ${activeDeskPatient.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>
                  {activeDeskPatient.status}
                </span>
              </div>
            </div>

            {/* Vitals Strip */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                textAlign: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Blood Pressure</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>122/80 mmHg</div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heart Rate</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-primary)', marginTop: '2px' }}>72 bpm</div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SpO2</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--status-success-solid)', marginTop: '2px' }}>99%</div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temp</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>98.4 °F</div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weight / BMI</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>64 kg (24.2)</div>
              </div>
            </div>

            {/* Clinical Evaluation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                  Chief Complaints & Clinical Presentation
                </label>
                <textarea
                  rows="3"
                  defaultValue="Patient presents for follow-up review. Reports mild exertional dyspnea on ascending 2 flights of stairs. Zero chest pain at rest. Regular compliance with morning cardiac medications."
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px' }}>
                  Provisional Diagnosis (ICD-10)
                </label>
                <input
                  type="text"
                  defaultValue="I25.10 - Atherosclerotic heart disease of native coronary artery & Essential Hypertension"
                  style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8125rem', fontWeight: '600' }}
                />
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>
                    Physical Examination Findings
                  </label>
                  <input
                    type="text"
                    defaultValue="S1 S2 heard normal. Chest clear bilaterally. No peripheral ankle edema."
                    style={{ width: '100%', height: '36px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Prescriptions Section in Desk */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Stethoscope size={16} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>Prescribed Medications (Rx Pad)</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Issued under Dr. M. Revathi (TNMC/2018/09283)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Tab Atorvastatin', dose: '20mg', freq: '0-0-1 (Night, After Food)', duration: '30 Days' },
                  { name: 'Tab Metoprolol Succinate', dose: '25mg', freq: '1-0-0 (Morning, Empty Stomach)', duration: '30 Days' },
                  { name: 'Tab Ecosprin', dose: '75mg', freq: '0-1-0 (After Lunch)', duration: '30 Days' }
                ].map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#FAF6F7',
                      borderRadius: '8px',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <span style={{ fontWeight: '700', color: 'var(--color-heading)' }}>{idx + 1}. {m.name} ({m.dose})</span>
                    <span style={{ color: 'var(--text)' }}>{m.freq}</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{m.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  generatePrescriptionPDF(
                    {
                      id: activeDeskPatient.id,
                      rxNumber: `RX-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-0491`,
                      patientName: activeDeskPatient.patient,
                      patientAge: '42 / Female',
                      date: new Date().toLocaleDateString('en-GB'),
                      diagnosis: 'Coronary Artery Disease & Essential Hypertension',
                      medications: [
                        { name: 'Tab Atorvastatin', dose: '20mg', freq: '0-0-1 (Night, After Food)', duration: '30 Days' },
                        { name: 'Tab Metoprolol Succinate', dose: '25mg', freq: '1-0-0 (Morning, Empty Stomach)', duration: '30 Days' },
                        { name: 'Tab Ecosprin', dose: '75mg', freq: '0-1-0 (After Lunch)', duration: '30 Days' }
                      ]
                    },
                    doctorSettings
                  );
                }}
                icon={Download}
              >
                Download Prescription PDF
              </Button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="button" variant="tertiary" onClick={() => setActiveDeskPatient(null)}>
                  Close Desk
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={CheckCircle}
                  onClick={() => {
                    // Mark appointment completed
                    const updated = screen5Appointments.map((a) =>
                      a.id === activeDeskPatient.id ? { ...a, status: 'Completed' } : a
                    );
                    setScreen5Appointments(updated);

                    // Generate Rx in list
                    const newRx = {
                      id: `rx-${Date.now()}`,
                      rxNumber: `RX-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-049${Math.floor(Math.random() * 80 + 10)}`,
                      patientName: activeDeskPatient.patient,
                      patientAge: '42 / Female',
                      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                      diagnosis: 'Coronary Artery Disease & Essential Hypertension',
                      status: 'Signed & Sent to Vault',
                      medications: [
                        { name: 'Tab Atorvastatin', dose: '20mg', freq: '0-0-1 (Night)', duration: '30 Days' },
                        { name: 'Tab Metoprolol Succinate', dose: '25mg', freq: '1-0-0 (Morning)', duration: '30 Days' },
                        { name: 'Tab Ecosprin', dose: '75mg', freq: '0-1-0 (After Lunch)', duration: '30 Days' }
                      ]
                    };
                    setPrescriptionsList([newRx, ...prescriptionsList]);

                    // Auto download PDF
                    generatePrescriptionPDF(newRx, doctorSettings);

                    setActiveDeskPatient(null);
                    setMsg({
                      type: 'success',
                      text: `Consultation completed for ${activeDeskPatient.patient}. Medical prescription issued and certified PDF downloaded.`
                    });
                  }}
                >
                  Complete Visit & Issue Rx
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: DISPATCH REFERRAL */}
      {showCreateRefModal && (
        <Modal
          isOpen={showCreateRefModal}
          onClose={() => setShowCreateRefModal(false)}
          title="Dispatch Inter-Hospital Referral"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const newRef = {
                id: `ref-${Date.now()}`,
                referralNo: `REF-KMCH-202611-${Math.floor(1000 + Math.random() * 9000)}`,
                patientName: refPatientName || 'Anitha K (38 F)',
                fromHospital: 'Kovai Medical Center & Hospital (KMCH)',
                toHospital: refDestination,
                specialty: refSpecialty,
                priority: refPriority,
                slaCountdown: '4h SLA Timer Started',
                status: 'Dispatched'
              };
              setReferralsList([newRef, ...referralsList]);
              setShowCreateRefModal(false);
              setRefPatientName('');
              setMsg({ type: 'success', text: `Referral ${newRef.referralNo} dispatched to ${refDestination}.` });
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Patient Name</label>
              <Input
                type="text"
                placeholder="e.g. Anitha K"
                value={refPatientName}
                onChange={(e) => setRefPatientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Destination Hospital</label>
              <select
                className="form-select"
                value={refDestination}
                onChange={(e) => setRefDestination(e.target.value)}
                style={{ width: '100%', height: '40px', borderRadius: '10px' }}
              >
                <option value="Ganga Medical Center (Orthopedics & Spine)">Ganga Medical Center</option>
                <option value="Sri Ramakrishna Hospital">Sri Ramakrishna Hospital</option>
                <option value="PSG Institute of Medical Sciences">PSG Hospitals</option>
                <option value="Aravind Eye Hospital">Aravind Eye Hospital</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Target Specialty</label>
                <Input type="text" value={refSpecialty} onChange={(e) => setRefSpecialty(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Priority</label>
                <select
                  className="form-select"
                  value={refPriority}
                  onChange={(e) => setRefPriority(e.target.value)}
                  style={{ width: '100%', height: '40px', borderRadius: '10px' }}
                >
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="URGENT">URGENT</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary">Dispatch Referral Handover</Button>
          </form>
        </Modal>
      )}

      {/* MODAL 3: WRITE NEW PRESCRIPTION */}
      {showAddRxModal && (
        <Modal
          isOpen={showAddRxModal}
          onClose={() => setShowAddRxModal(false)}
          title="Write Digital e-Prescription"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const newPrescription = {
                id: `rx-${Date.now()}`,
                rxNumber: `RX-202611-${Math.floor(1000 + Math.random() * 9000)}`,
                patientName: newRxPatient,
                patientAge: '45 / Adult',
                date: '24 Nov 2026',
                diagnosis: newRxDiagnosis,
                status: 'Signed & Sent to Vault',
                medications: [
                  { name: newRxDrug, dose: '10mg', freq: '1-0-1 (Morning & Night)', duration: '30 Days' }
                ]
              };
              setPrescriptionsList([newPrescription, ...prescriptionsList]);
              setShowAddRxModal(false);
              setNewRxPatient('');
              setNewRxDiagnosis('');
              setNewRxDrug('');
              setMsg({ type: 'success', text: `e-Prescription created and transferred to ${newRxPatient}'s vault.` });
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Patient Name</label>
              <Input
                type="text"
                placeholder="e.g. Suresh V"
                value={newRxPatient}
                onChange={(e) => setNewRxPatient(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Clinical Diagnosis</label>
              <Input
                type="text"
                placeholder="e.g. Acute Coronary Syndrome"
                value={newRxDiagnosis}
                onChange={(e) => setNewRxDiagnosis(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Primary Medication</label>
              <Input
                type="text"
                placeholder="e.g. Tab Atorvastatin 20mg"
                value={newRxDrug}
                onChange={(e) => setNewRxDrug(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary">Sign & Transmit e-Prescription</Button>
          </form>
        </Modal>
      )}

      {/* MODAL 4: UPLOAD CREDENTIAL DOCUMENT */}
      {showUploadDocModal && (
        <Modal
          isOpen={showUploadDocModal}
          onClose={() => setShowUploadDocModal(false)}
          title="Upload Medical Credential Document"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Document Category</label>
              <select
                className="form-select"
                value={docUploadType}
                onChange={(e) => setDocUploadType(e.target.value)}
                style={{ width: '100%', height: '40px', borderRadius: '10px' }}
              >
                <option value="registration_certificate">State Medical Council Registration Certificate</option>
                <option value="degree_certificate">MBBS Degree Certificate</option>
                <option value="specialization_certificate">Postgraduate Super-Specialty Degree</option>
                <option value="hospital_privilege">Hospital Privilege / Clinical Fellowship</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '4px' }}>Select PDF or Scanned Certificate</label>
              <input type="file" accept=".pdf,.png,.jpg" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '10px' }} />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setShowUploadDocModal(false);
                setMsg({ type: 'success', text: 'Document uploaded for hospital credential verification.' });
              }}
            >
              Upload Certificate
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
