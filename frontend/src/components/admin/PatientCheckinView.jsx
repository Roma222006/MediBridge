import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Check,
  X,
  Clock,
  Printer,
  Activity,
  User,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function PatientCheckinView({ onToast }) {
  const [searchToken, setSearchToken] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [checkins, setCheckins] = useState(() => {
    const saved = localStorage.getItem('medibridge_patient_checkins');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'chk-1', token: 'T-101', patientName: 'Priya R', phone: '+91 98401 23456', doctor: 'Dr. Sundar M', department: 'Cardiology', room: 'OPD 204', slot: '09:00 AM', status: 'Completed', arrivalTime: '08:45 AM', vitals: { bp: '120/80', pulse: '74', spo2: '98%', temp: '98.4 F' } },
      { id: 'chk-2', token: 'T-102', patientName: 'Arun K', phone: '+91 97890 11223', doctor: 'Dr. Sundar M', department: 'Cardiology', room: 'OPD 204', slot: '10:00 AM', status: 'In Consultation', arrivalTime: '09:50 AM', vitals: { bp: '135/88', pulse: '82', spo2: '97%', temp: '98.6 F' } },
      { id: 'chk-3', token: 'T-103', patientName: 'Anitha K', phone: '+91 94432 44556', doctor: 'Dr. Lavanya S', department: 'Neurology', room: 'OPD 310', slot: '11:00 AM', status: 'Waiting Lounge', arrivalTime: '10:40 AM', vitals: { bp: '118/76', pulse: '76', spo2: '99%', temp: '98.2 F' } },
      { id: 'chk-4', token: 'T-104', patientName: 'Karthik S', phone: '+91 98421 66778', doctor: 'Dr. Prakash R', department: 'Orthopedics', room: 'OPD 108', slot: '12:00 PM', status: 'Checked In', arrivalTime: '11:30 AM', vitals: { bp: '124/82', pulse: '78', spo2: '98%', temp: '98.4 F' } },
      { id: 'chk-5', token: 'T-105', patientName: 'Suresh V', phone: '+91 97890 88990', doctor: 'Dr. M. Revathi', department: 'Cardiology', room: 'Virtual Desk', slot: '02:00 PM', status: 'Not Arrived', arrivalTime: '-', vitals: null }
    ];
  });

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState('72');
  const [spo2, setSpo2] = useState('99');
  const [temp, setTemp] = useState('98.4');

  const persistCheckins = (updated) => {
    setCheckins(updated);
    localStorage.setItem('medibridge_patient_checkins', JSON.stringify(updated));
  };

  const handleOpenCheckin = (patient) => {
    setSelectedPatient(patient);
    setShowVitalsModal(true);
  };

  const handleConfirmVitals = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const updated = checkins.map((c) => {
      if (c.id === selectedPatient.id) {
        return {
          ...c,
          status: 'Waiting Lounge',
          arrivalTime: 'Just now',
          vitals: { bp, pulse, spo2: `${spo2}%`, temp: `${temp} F` }
        };
      }
      return c;
    });

    persistCheckins(updated);
    setShowVitalsModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Patient ${selectedPatient.patientName} (${selectedPatient.token}) checked in. Routed to ${selectedPatient.room}.`
      });
    }
  };

  const handleAdvanceStatus = (id, currentStatus) => {
    let nextStatus = currentStatus;
    if (currentStatus === 'Checked In') nextStatus = 'Waiting Lounge';
    else if (currentStatus === 'Waiting Lounge') nextStatus = 'In Consultation';
    else if (currentStatus === 'In Consultation') nextStatus = 'Completed';

    const updated = checkins.map((c) => {
      if (c.id === id) {
        return { ...c, status: nextStatus };
      }
      return c;
    });

    persistCheckins(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Patient status advanced to: ${nextStatus}.`
      });
    }
  };

  const filtered = checkins.filter((c) => {
    const matchesSearch =
      !searchToken ||
      c.token.toLowerCase().includes(searchToken.toLowerCase()) ||
      c.patientName.toLowerCase().includes(searchToken.toLowerCase()) ||
      c.doctor.toLowerCase().includes(searchToken.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Reception Desk Patient Check-in & Triage
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time patient arrival verification, baseline vital signs capture, and OPD clinic room routing.
          </p>
        </div>
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
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            placeholder="Search patient name, token number, or consulting doctor..."
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
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
          <option value="All">All Check-in Statuses ▾</option>
          <option value="Not Arrived">Not Arrived</option>
          <option value="Checked In">Checked In</option>
          <option value="Waiting Lounge">Waiting Lounge</option>
          <option value="In Consultation">In Consultation</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Check-in Queue Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Token & Patient</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Consultant & Room</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Scheduled Slot</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Triage Vitals</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Current Stage</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Reception Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--surface-subtle)',
                          fontSize: '0.8125rem',
                          fontWeight: '800',
                          color: 'var(--color-primary)'
                        }}
                      >
                        {c.token}
                      </span>
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                        {c.patientName}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                      {c.doctor}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                      {c.room} ({c.department})
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {c.slot}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Arrived: {c.arrivalTime}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {c.vitals ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>BP: <strong>{c.vitals.bp}</strong> mmHg</span>
                        <span>Pulse: <strong>{c.vitals.pulse}</strong> bpm &bull; SpO2: <strong>{c.vitals.spo2}</strong></span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Triage</span>
                    )}
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
                        backgroundColor:
                          c.status === 'Completed'
                            ? '#DCFCE7'
                            : c.status === 'In Consultation'
                            ? '#E0E7FF'
                            : c.status === 'Waiting Lounge'
                            ? '#CFFAFE'
                            : c.status === 'Checked In'
                            ? '#FEF3C7'
                            : '#FEE2E2',
                        color:
                          c.status === 'Completed'
                            ? '#15803D'
                            : c.status === 'In Consultation'
                            ? '#4338CA'
                            : c.status === 'Waiting Lounge'
                            ? '#0369A1'
                            : c.status === 'Checked In'
                            ? '#B77A32'
                            : '#B83245'
                      }}
                    >
                      ● {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.status === 'Not Arrived' || !c.vitals ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckin(c)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: 'var(--color-primary)',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Check In & Vitals
                        </button>
                      ) : c.status !== 'Completed' ? (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(c.id, c.status)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--color-heading)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Next Stage <ChevronRight size={13} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: '700' }}>
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vitals Capture Modal */}
      {showVitalsModal && selectedPatient && (
        <Modal
          isOpen={showVitalsModal}
          onClose={() => setShowVitalsModal(false)}
          title={`Patient Arrival Desk: ${selectedPatient.patientName} (${selectedPatient.token})`}
        >
          <form onSubmit={handleConfirmVitals} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                Consultation with {selectedPatient.doctor} ({selectedPatient.department})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Designated Room: <strong>{selectedPatient.room}</strong> &bull; Slot: {selectedPatient.slot}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="e.g. 120/80"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Pulse Rate (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="e.g. 74"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>SpO2 Oxygen (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="e.g. 98"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Temperature (°F)</label>
                <input
                  type="text"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="e.g. 98.4"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Confirm Arrival & Send to Waiting Lounge
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
