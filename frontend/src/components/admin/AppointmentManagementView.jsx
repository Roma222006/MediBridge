import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Check,
  X,
  Stethoscope,
  Video,
  UserCheck,
  Filter,
  Download,
  AlertCircle,
  Eye,
  User,
  Phone,
  FileText
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function AppointmentManagementView({ onToast, defaultPendingOnly = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultPendingOnly ? 'Pending' : 'All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'apt-001', token: 'T-101', patientName: 'Priya R', age: 34, gender: 'Female', phone: '+91 98401 23456', doctor: 'Dr. Sundar M', department: 'Cardiology', date: 'Today, 24 Nov', time: '09:00 AM', mode: 'In-Person', status: 'Completed', reason: 'Routine Cardiac Follow-up' },
      { id: 'apt-002', token: 'T-102', patientName: 'Arun K', age: 48, gender: 'Male', phone: '+91 97890 11223', doctor: 'Dr. Sundar M', department: 'Cardiology', date: 'Today, 24 Nov', time: '10:00 AM', mode: 'Online', status: 'In Consultation', reason: 'Hypertension Review' },
      { id: 'apt-003', token: 'T-103', patientName: 'Anitha K', age: 29, gender: 'Female', phone: '+91 94432 44556', doctor: 'Dr. Lavanya S', department: 'Neurology', date: 'Today, 24 Nov', time: '11:00 AM', mode: 'Online', status: 'Pending', reason: 'Migraine Assessment' },
      { id: 'apt-004', token: 'T-104', patientName: 'Karthik S', age: 42, gender: 'Male', phone: '+91 98421 66778', doctor: 'Dr. Prakash R', department: 'Orthopedics', date: 'Today, 24 Nov', time: '12:00 PM', mode: 'In-Person', status: 'Confirmed', reason: 'Knee Joint Pain Review' },
      { id: 'apt-005', token: 'T-105', patientName: 'Suresh V', age: 56, gender: 'Male', phone: '+91 97890 88990', doctor: 'Dr. M. Revathi', department: 'Cardiology', date: 'Today, 24 Nov', time: '02:00 PM', mode: 'Online', status: 'Confirmed', reason: 'Post-Angioplasty Follow-up' },
      { id: 'apt-006', token: 'T-106', patientName: 'Deepa N', age: 38, gender: 'Female', phone: '+91 98401 55443', doctor: 'Dr. Anand K', department: 'General Medicine', date: 'Today, 24 Nov', time: '03:30 PM', mode: 'In-Person', status: 'Confirmed', reason: 'Diabetes Management' },
      { id: 'apt-007', token: 'T-107', patientName: 'Rajesh M', age: 52, gender: 'Male', phone: '+91 94432 99881', doctor: 'Dr. Prakash R', department: 'Orthopedics', date: 'Today, 24 Nov', time: '04:30 PM', mode: 'In-Person', status: 'Confirmed', reason: 'Post-Operative Check' },
      { id: 'apt-008', token: 'T-108', patientName: 'Kavitha S', age: 31, gender: 'Female', phone: '+91 97890 33221', doctor: 'Dr. Priya Dharshini', department: 'Pediatrics', date: 'Today, 24 Nov', time: '05:15 PM', mode: 'Online', status: 'Pending', reason: 'Child Vaccination Follow-up' }
    ];
  });

  const [selectedApt, setSelectedApt] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newDate, setNewDate] = useState('2026-11-25');
  const [newTime, setNewTime] = useState('10:30 AM');

  useEffect(() => {
    if (!localStorage.getItem('medibridge_hospital_appointments')) {
      localStorage.setItem('medibridge_hospital_appointments', JSON.stringify(appointments));
    }
    const handleSync = () => {
      const saved = localStorage.getItem('medibridge_hospital_appointments');
      if (saved) {
        try { setAppointments(JSON.parse(saved)); } catch (e) {}
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const persistAppointments = (updated) => {
    setAppointments(updated);
    localStorage.setItem('medibridge_hospital_appointments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleConfirmPending = (id) => {
    const updated = appointments.map((a) => {
      if (a.id === id) {
        return { ...a, status: 'Confirmed' };
      }
      return a;
    });
    persistAppointments(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Appointment confirmed and slot locked. Notification sent to patient.'
      });
    }
  };

  const handleMarkArrived = (id) => {
    const updated = appointments.map((a) => {
      if (a.id === id) {
        return { ...a, status: 'Arrived at Clinic' };
      }
      return a;
    });
    persistAppointments(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Patient marked as Arrived. Token added to active OPD waiting room.'
      });
    }
  };

  const handleOpenReschedule = (apt) => {
    setSelectedApt(apt);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!selectedApt) return;
    const updated = appointments.map((a) => {
      if (a.id === selectedApt.id) {
        return { ...a, date: newDate, time: newTime, status: 'Rescheduled' };
      }
      return a;
    });
    persistAppointments(updated);
    setShowRescheduleModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Appointment for ${selectedApt.patientName} rescheduled to ${newDate} at ${newTime}.`
      });
    }
  };

  const handleCancelApt = (id) => {
    const updated = appointments.map((a) => {
      if (a.id === id) {
        return { ...a, status: 'Cancelled' };
      }
      return a;
    });
    persistAppointments(updated);
    if (onToast) {
      onToast({
        type: 'error',
        text: 'Appointment cancelled. Cancellation alert dispatched.'
      });
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone && a.phone.includes(searchQuery));
    const matchesDept = deptFilter === 'All' || a.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesMode = modeFilter === 'All' || a.mode === modeFilter;
    return matchesSearch && matchesDept && matchesStatus && matchesMode;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            {defaultPendingOnly ? 'Pending Appointment Confirmations' : 'Central Hospital Appointment Register'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time outpatient consultation registry, patient arrival tracking, and slot coordination.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              if (onToast) onToast({ type: 'success', text: 'Appointment register exported to CSV.' });
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> Export Register (CSV)
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="ref-metric-card" style={{ padding: '16px' }}>
          <div className="ref-metric-icon pink" style={{ width: '42px', height: '42px' }}>
            <Calendar size={18} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value" style={{ fontSize: '1.35rem' }}>{appointments.length}</span>
            <span className="ref-metric-label">Total Scheduled</span>
          </div>
        </div>

        <div className="ref-metric-card" style={{ padding: '16px' }}>
          <div className="ref-metric-icon pink" style={{ width: '42px', height: '42px' }}>
            <Stethoscope size={18} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value" style={{ fontSize: '1.35rem' }}>{appointments.filter((a) => a.mode === 'In-Person').length}</span>
            <span className="ref-metric-label">In-Person OPD</span>
          </div>
        </div>

        <div className="ref-metric-card" style={{ padding: '16px' }}>
          <div className="ref-metric-icon pink" style={{ width: '42px', height: '42px' }}>
            <Video size={18} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value" style={{ fontSize: '1.35rem' }}>{appointments.filter((a) => a.mode === 'Online').length}</span>
            <span className="ref-metric-label">Teleconsultations</span>
          </div>
        </div>

        <div className="ref-metric-card" style={{ padding: '16px' }}>
          <div className="ref-metric-icon pink" style={{ width: '42px', height: '42px' }}>
            <Clock size={18} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value" style={{ fontSize: '1.35rem' }}>{appointments.filter((a) => a.status === 'Pending').length}</span>
            <span className="ref-metric-label">Pending Requests</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs / Quick Counts */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'All', label: `All (${appointments.length})` },
          { key: 'Pending', label: `Pending Requests (${appointments.filter((a) => a.status === 'Pending').length})` },
          { key: 'Confirmed', label: `Confirmed (${appointments.filter((a) => a.status === 'Confirmed').length})` },
          { key: 'In Consultation', label: `In Consultation (${appointments.filter((a) => a.status === 'In Consultation').length})` },
          { key: 'Completed', label: `Completed (${appointments.filter((a) => a.status === 'Completed').length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: statusFilter === tab.key ? 'var(--color-primary)' : '#FFFFFF',
              color: statusFilter === tab.key ? '#FFFFFF' : 'var(--color-heading)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: statusFilter === tab.key ? '0 2px 4px rgba(184, 61, 131, 0.2)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, token number, doctor, or department..."
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
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
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
          <option value="Pediatrics">Pediatrics</option>
        </select>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
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
          <option value="All">All Modes ▾</option>
          <option value="In-Person">In-Person OPD</option>
          <option value="Online">Online Video Teleconsult</option>
        </select>
      </div>

      {/* Spacious, Highly Readable Table */}
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
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '220px' }}>Token & Patient</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '190px' }}>Doctor & Department</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '150px' }}>Date & Slot</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '120px' }}>Mode</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '200px' }}>Chief Complaint</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '150px' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--surface-subtle)',
                          fontSize: '0.8125rem',
                          fontWeight: '800',
                          color: 'var(--color-primary)',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {a.token}
                      </span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)', whiteSpace: 'nowrap' }}>
                          {a.patientName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          {a.age} Yrs &bull; {a.gender} {a.phone ? `• ${a.phone}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)', whiteSpace: 'nowrap' }}>
                      {a.doctor}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap' }}>
                      {a.department}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {a.time}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {a.date}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: a.mode === 'Online' ? '#F3E8FF' : '#FCEFED',
                        color: a.mode === 'Online' ? '#7E22CE' : 'var(--color-primary)'
                      }}
                    >
                      {a.mode === 'Online' ? <Video size={13} /> : <Stethoscope size={13} />}
                      {a.mode}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                    <div style={{ fontWeight: '500', lineHeight: '1.4' }}>
                      {a.reason}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor:
                          a.status === 'Completed' || a.status === 'Confirmed'
                            ? '#DCFCE7'
                            : a.status === 'Pending'
                            ? '#FEF3C7'
                            : a.status === 'In Consultation'
                            ? '#E0E7FF'
                            : a.status === 'Arrived at Clinic'
                            ? '#CFFAFE'
                            : '#FEE2E2',
                        color:
                          a.status === 'Completed' || a.status === 'Confirmed'
                            ? '#15803D'
                            : a.status === 'Pending'
                            ? '#B77A32'
                            : a.status === 'In Consultation'
                            ? '#4338CA'
                            : a.status === 'Arrived at Clinic'
                            ? '#0369A1'
                            : '#B83245'
                      }}
                    >
                      {a.status === 'Confirmed' || a.status === 'Completed' ? <Check size={12} strokeWidth={2.5} /> : '●'} {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {a.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmPending(a.id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: 'var(--color-primary)',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(184, 61, 131, 0.2)'
                          }}
                        >
                          Confirm
                        </button>
                      )}
                      {a.status === 'Confirmed' && a.mode === 'In-Person' && (
                        <button
                          type="button"
                          onClick={() => handleMarkArrived(a.id)}
                          style={{
                            padding: '5px 11px',
                            borderRadius: '9999px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--color-heading)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Arrived
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenReschedule(a)}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--color-heading)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Reschedule
                      </button>
                      {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => handleCancelApt(a.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '9999px',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FFFFFF',
                            color: '#B83245',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
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

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedApt && (
        <Modal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          title={`Reschedule Consultation: ${selectedApt.patientName}`}
        >
          <form onSubmit={handleConfirmReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                {selectedApt.patientName} &bull; {selectedApt.token}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Doctor: {selectedApt.doctor} ({selectedApt.department})
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>New Slot Window</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:45 AM">11:45 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Confirm Rescheduled Slot
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
