import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  PlusCircle,
  Search,
  Check,
  X,
  Stethoscope,
  Video,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function DoctorAvailabilityView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_availability_schedules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'sch-1', doctorName: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', days: 'Monday - Friday', time: '09:00 AM - 01:00 PM', mode: 'In-Person OPD', room: 'OPD 204', maxTokens: 20, booked: 16, status: 'Active' },
      { id: 'sch-2', doctorName: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', days: 'Monday, Wednesday, Friday', time: '02:30 PM - 05:00 PM', mode: 'Teleconsultation', room: 'Virtual Desk', maxTokens: 12, booked: 8, status: 'Active' },
      { id: 'sch-3', doctorName: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology', days: 'Tuesday, Thursday, Saturday', time: '09:00 AM - 01:30 PM', mode: 'In-Person OPD', room: 'OPD 310', maxTokens: 18, booked: 12, status: 'Active' },
      { id: 'sch-4', doctorName: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', days: 'Monday - Saturday', time: '10:00 AM - 02:00 PM', mode: 'In-Person OPD', room: 'OPD 108', maxTokens: 25, booked: 21, status: 'Active' },
      { id: 'sch-5', doctorName: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', days: 'Monday - Saturday', time: '08:30 AM - 12:30 PM', mode: 'In-Person OPD', room: 'OPD 102', maxTokens: 30, booked: 28, status: 'Active' },
      { id: 'sch-6', doctorName: 'Dr. M. Revathi', specialty: 'Cardiology', department: 'Cardiology', days: 'Tuesday, Thursday, Saturday', time: '02:00 PM - 06:00 PM', mode: 'Teleconsultation', room: 'Virtual Desk', maxTokens: 15, booked: 9, status: 'Active' }
    ];
  });

  // Dynamic Doctor list loaded from medibridge_hospital_doctors
  const [availableDoctors, setAvailableDoctors] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_doctors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { name: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology' },
      { name: 'Dr. Lavanya S', specialty: 'Neurology', department: 'Neurology' },
      { name: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics' },
      { name: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine' },
      { name: 'Dr. Priya Dharshini', specialty: 'Pediatrics', department: 'Pediatrics' },
      { name: 'Dr. M. Revathi', specialty: 'Cardiology', department: 'Cardiology' }
    ];
  });

  useEffect(() => {
    if (!localStorage.getItem('medibridge_doctor_availability_schedules')) {
      localStorage.setItem('medibridge_doctor_availability_schedules', JSON.stringify(schedules));
    }
    const handleSync = () => {
      const savedSch = localStorage.getItem('medibridge_doctor_availability_schedules');
      if (savedSch) {
        try { setSchedules(JSON.parse(savedSch)); } catch (e) {}
      }
      const savedDocs = localStorage.getItem('medibridge_hospital_doctors');
      if (savedDocs) {
        try { setAvailableDoctors(JSON.parse(savedDocs)); } catch (e) {}
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    doctorName: 'Dr. Sundar M',
    specialty: 'Cardiology',
    department: 'Cardiology',
    days: 'Monday - Friday',
    time: '09:00 AM - 01:00 PM',
    mode: 'In-Person OPD',
    room: 'OPD 205',
    maxTokens: 20
  });

  const handleToggleStatus = (id) => {
    const updated = schedules.map((s) => {
      if (s.id === id) {
        const nextStatus = s.status === 'Active' ? 'Paused' : 'Active';
        return { ...s, status: nextStatus };
      }
      return s;
    });
    setSchedules(updated);
    localStorage.setItem('medibridge_doctor_availability_schedules', JSON.stringify(updated));
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Doctor duty window status updated successfully.'
      });
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `sch-${Date.now()}`,
      ...newSchedule,
      booked: 0,
      status: 'Active'
    };
    const updated = [entry, ...schedules];
    setSchedules(updated);
    localStorage.setItem('medibridge_doctor_availability_schedules', JSON.stringify(updated));
    setShowAddModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `New OPD availability window added for ${newSchedule.doctorName}.`
      });
    }
  };

  const filtered = schedules.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Doctor Availability & OPD Duty Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure outpatient clinic windows, telemedicine teleconsult sessions, and token capacities across departments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 22px',
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
          }}
        >
          <PlusCircle size={16} /> + Add OPD Slot Window
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, department, or room..."
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
        </select>
      </div>

      {/* Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Doctor & Department</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Days & Timing</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Consultation Mode</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Clinic / Room</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Token Capacity</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {s.doctorName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.specialty}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {s.days}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.time}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: s.mode.includes('Teleconsult') ? '#F3E8FF' : '#FCEFED',
                        color: s.mode.includes('Teleconsult') ? '#7E22CE' : 'var(--color-primary)'
                      }}
                    >
                      {s.mode.includes('Teleconsult') ? <Video size={13} /> : <Stethoscope size={13} />}
                      {s.mode}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)', fontWeight: '600' }}>
                    {s.room}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {s.booked} / {s.maxTokens}
                    </div>
                    <div style={{ width: '80px', height: '5px', backgroundColor: '#E8E3E5', borderRadius: '9999px', marginTop: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(s.booked / s.maxTokens) * 100}%`,
                          height: '100%',
                          backgroundColor: s.booked / s.maxTokens > 0.85 ? '#B83245' : 'var(--color-primary)'
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: s.status === 'Active' ? '#DCFCE7' : '#FEF3C7',
                        color: s.status === 'Active' ? '#15803D' : '#B77A32'
                      }}
                    >
                      ● {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--color-heading)',
                        cursor: 'pointer'
                      }}
                    >
                      {s.status === 'Active' ? 'Pause' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Outpatient Duty Slot Window"
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Consulting Doctor</label>
              <select
                value={newSchedule.doctorName}
                onChange={(e) => {
                  const doc = availableDoctors.find((d) => d.name === e.target.value);
                  setNewSchedule({
                    ...newSchedule,
                    doctorName: e.target.value,
                    specialty: doc?.specialty || 'Cardiology',
                    department: doc?.department || doc?.specialty || 'Cardiology'
                  });
                }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              >
                {availableDoctors.map((doc, idx) => (
                  <option key={idx} value={doc.name}>
                    {doc.name} ({doc.specialty || doc.department})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Days of Week</label>
                <input
                  type="text"
                  value={newSchedule.days}
                  onChange={(e) => setNewSchedule({ ...newSchedule, days: e.target.value })}
                  placeholder="e.g. Monday - Friday"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Time Window</label>
                <input
                  type="text"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  placeholder="e.g. 09:00 AM - 01:00 PM"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Consultation Mode</label>
                <select
                  value={newSchedule.mode}
                  onChange={(e) => setNewSchedule({ ...newSchedule, mode: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="In-Person OPD">In-Person OPD</option>
                  <option value="Teleconsultation">Teleconsultation (WebRTC)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Clinic / OPD Room</label>
                <input
                  type="text"
                  value={newSchedule.room}
                  onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                  placeholder="e.g. OPD Room 204"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Maximum Patient Token Capacity</label>
              <input
                type="number"
                min="5"
                max="50"
                value={newSchedule.maxTokens}
                onChange={(e) => setNewSchedule({ ...newSchedule, maxTokens: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Publish OPD Window
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
