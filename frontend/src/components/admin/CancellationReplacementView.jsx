import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Search,
  Check,
  X,
  Stethoscope,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function CancellationReplacementView({ onToast, defaultTab = 'cancellations' }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');

  const [cancellations, setCancellations] = useState(() => {
    const saved = localStorage.getItem('medibridge_cancellation_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'can-1',
        token: 'T-103',
        patientName: 'Anitha K',
        phone: '+91 98401 23456',
        originalDoctor: 'Dr. Lavanya S',
        department: 'Neurology',
        specialty: 'Neurology',
        scheduledTime: '24 Nov, 11:00 AM',
        reason: 'Doctor Emergency Leave (Hospital Duty Reassignment)',
        requestDate: '10 mins ago',
        status: 'Action Required',
        suggestedReplacement: 'Dr. Anand K (General Medicine & Neurology Triage)'
      },
      {
        id: 'can-2',
        token: 'T-104',
        patientName: 'Karthik S',
        phone: '+91 97890 54321',
        originalDoctor: 'Dr. Prakash R',
        department: 'Orthopedics',
        specialty: 'Orthopedics',
        scheduledTime: '24 Nov, 12:00 PM',
        reason: 'Specialist Called to Emergency Trauma Surgery',
        requestDate: '25 mins ago',
        status: 'Action Required',
        suggestedReplacement: 'Dr. Sundar M (Cardiothoracic / Trauma Backup)'
      },
      {
        id: 'can-3',
        token: 'T-098',
        patientName: 'Deepak V',
        phone: '+91 94432 88776',
        originalDoctor: 'Dr. M. Revathi',
        department: 'Cardiology',
        specialty: 'Cardiology',
        scheduledTime: '24 Nov, 09:30 AM',
        reason: 'Doctor CME Conference Out-of-Office',
        requestDate: '1 hour ago',
        status: 'Replaced',
        assignedReplacement: 'Dr. Sundar M (Cardiology)'
      }
    ];
  });

  // Certified, verified doctors available for replacement
  const availableReplacements = [
    { id: 'rep-1', name: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', experience: '14 Yrs', verified: true, availableSlots: 6, dutyStatus: 'On Duty (Room 204)' },
    { id: 'rep-2', name: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', experience: '11 Yrs', verified: true, availableSlots: 8, dutyStatus: 'On Duty (Room 102)' },
    { id: 'rep-3', name: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', experience: '15 Yrs', verified: true, availableSlots: 4, dutyStatus: 'On Duty (Room 108)' },
    { id: 'rep-4', name: 'Dr. Priya Dharshini', specialty: 'Pediatrics', department: 'Pediatrics', experience: '6 Yrs', verified: true, availableSlots: 10, dutyStatus: 'On Duty (Room 115)' }
  ];

  const [selectedCan, setSelectedCan] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [chosenReplacementDoctor, setChosenReplacementDoctor] = useState('Dr. Sundar M');
  const [replacementNote, setReplacementNote] = useState('Patient informed via SMS. No consultation fee difference charged.');

  const persistCancellations = (updated) => {
    setCancellations(updated);
    localStorage.setItem('medibridge_cancellation_requests', JSON.stringify(updated));
  };

  const handleOpenMatch = (can) => {
    setSelectedCan(can);
    // Auto-select best replacement by department match if available
    const match = availableReplacements.find((r) => r.department === can.department) || availableReplacements[0];
    setChosenReplacementDoctor(match.name);
    setShowMatchModal(true);
  };

  const handleConfirmReplacement = (e) => {
    e.preventDefault();
    if (!selectedCan) return;

    const updated = cancellations.map((c) => {
      if (c.id === selectedCan.id) {
        return {
          ...c,
          status: 'Replaced',
          assignedReplacement: chosenReplacementDoctor,
          replacementNote
        };
      }
      return c;
    });

    persistCancellations(updated);

    // Also update appointments in localStorage if exists
    const aptsSaved = localStorage.getItem('medibridge_hospital_appointments');
    if (aptsSaved) {
      try {
        const apts = JSON.parse(aptsSaved);
        const updatedApts = apts.map((a) => {
          if (a.token === selectedCan.token) {
            return {
              ...a,
              doctor: chosenReplacementDoctor,
              status: 'Reassigned to ' + chosenReplacementDoctor
            };
          }
          return a;
        });
        localStorage.setItem('medibridge_hospital_appointments', JSON.stringify(updatedApts));
      } catch (err) {}
    }

    setShowMatchModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Replacement doctor ${chosenReplacementDoctor} successfully assigned to ${selectedCan.patientName}. Patient notification dispatched.`
      });
    }
  };

  const filtered = cancellations.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originalDoctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Cancellation & Replacement Doctor Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Coordinate doctor emergency absences, identify verified clinical replacements, and preserve patient care continuity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FEF3C7',
              color: '#B77A32',
              fontSize: '0.8125rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertTriangle size={14} /> {cancellations.filter((c) => c.status === 'Action Required').length} Pending Reassignments
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('cancellations')}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: activeSubTab === 'cancellations' ? 'var(--color-primary)' : '#FFFFFF',
            color: activeSubTab === 'cancellations' ? '#FFFFFF' : 'var(--color-heading)',
            fontSize: '0.8125rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Cancellation Requests ({cancellations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('replacements')}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: activeSubTab === 'replacements' ? 'var(--color-primary)' : '#FFFFFF',
            color: activeSubTab === 'replacements' ? '#FFFFFF' : 'var(--color-heading)',
            fontSize: '0.8125rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Replacement Doctor Engine
        </button>
      </div>

      {/* TAB 1: CANCELLATION REQUESTS */}
      {activeSubTab === 'cancellations' && (
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
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Original Doctor</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Scheduled Slot</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Cancellation Reason</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#FEE2E2',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            color: '#B83245'
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
                        {c.originalDoctor}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.department}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {c.scheduledTime}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Reported {c.requestDate}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: '#B83245', fontWeight: '600' }}>
                      {c.reason}
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
                          backgroundColor: c.status === 'Replaced' ? '#DCFCE7' : '#FEF3C7',
                          color: c.status === 'Replaced' ? '#15803D' : '#B77A32'
                        }}
                      >
                        {c.status === 'Replaced' ? <Check size={12} strokeWidth={2.5} /> : '●'} {c.status}
                      </span>
                      {c.assignedReplacement && (
                        <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: '700', marginTop: '4px' }}>
                          Reassigned to {c.assignedReplacement}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {c.status === 'Action Required' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenMatch(c)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: 'var(--color-primary)',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <RefreshCw size={12} /> Assign Replacement
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REPLACEMENT DOCTOR ENGINE */}
      {activeSubTab === 'replacements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Certified On-Duty Replacement Specialists
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Eligible specialists with verified medical council credentials and open outpatient slot buffers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {availableReplacements.map((doc) => (
              <div
                key={doc.id}
                className="card"
                style={{
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {doc.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.specialty} &bull; {doc.experience}</span>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D'
                    }}
                  >
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Duty Status:</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{doc.dutyStatus}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Available Buffer:</span>
                    <span style={{ fontWeight: '700', color: '#15803D' }}>{doc.availableSlots} Open Slots</span>
                  </div>
                </div>

                <div style={{ padding: '8px 12px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text)' }}>
                  Automatic appointment failover ready.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match & Assign Modal */}
      {showMatchModal && selectedCan && (
        <Modal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          title={`Assign Replacement Doctor for Token ${selectedCan.token}`}
        >
          <form onSubmit={handleConfirmReplacement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Patient & Incident Info */}
            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                  Patient: {selectedCan.patientName} ({selectedCan.phone})
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#B83245' }}>
                  Slot: {selectedCan.scheduledTime}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Original Doctor: <strong>{selectedCan.originalDoctor}</strong> ({selectedCan.department})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#B83245', marginTop: '4px' }}>
                Disruption: {selectedCan.reason}
              </div>
            </div>

            {/* Select Replacement Doctor */}
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Select Covering Replacement Specialist
              </label>
              <select
                value={chosenReplacementDoctor}
                onChange={(e) => setChosenReplacementDoctor(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                {availableReplacements.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} ({doc.specialty} - {doc.availableSlots} buffer slots available)
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Note */}
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Automated SMS & WhatsApp Notification to Patient
              </label>
              <textarea
                rows={2}
                value={replacementNote}
                onChange={(e) => setReplacementNote(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowMatchModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
                }}
              >
                Confirm & Reassign Patient
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
