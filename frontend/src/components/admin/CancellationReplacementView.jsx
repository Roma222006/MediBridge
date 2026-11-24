import React, { useState, useEffect } from 'react';
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
  PlusCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function CancellationReplacementView({ onToast, defaultTab = 'cancellations' }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Replacements pairing: Who is replaced by whom!
  const [replacements, setReplacements] = useState(() => {
    const saved = localStorage.getItem('medibridge_active_doctor_replacements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'rep-pair-1',
        absentDoctor: 'Dr. Lavanya S',
        absentSpecialty: 'Neurology',
        coveringDoctor: 'Dr. Anand K',
        coveringSpecialty: 'General Medicine & Neuro Triage',
        patientName: 'Anitha K',
        token: 'T-103',
        slot: '11:00 AM (Today, 24 Nov)',
        reason: 'Doctor Emergency Leave',
        status: 'Active Coverage',
        patientNotified: true,
        dateAssigned: 'Today, 09:15 AM'
      },
      {
        id: 'rep-pair-2',
        absentDoctor: 'Dr. Prakash R',
        absentSpecialty: 'Orthopedics',
        coveringDoctor: 'Dr. Sundar M',
        coveringSpecialty: 'Cardiology & Trauma Surgery Backup',
        patientName: 'Karthik S',
        token: 'T-104',
        slot: '12:00 PM (Today, 24 Nov)',
        reason: 'Called to Emergency Trauma Surgery',
        status: 'Active Coverage',
        patientNotified: true,
        dateAssigned: 'Today, 09:30 AM'
      },
      {
        id: 'rep-pair-3',
        absentDoctor: 'Dr. M. Revathi',
        absentSpecialty: 'Cardiology',
        coveringDoctor: 'Dr. Sundar M',
        coveringSpecialty: 'Cardiology (Senior Consultant)',
        patientName: 'Deepak V',
        token: 'T-098',
        slot: '09:30 AM (Today, 24 Nov)',
        reason: 'CME Conference Out-of-Office',
        status: 'Coverage Completed',
        patientNotified: true,
        dateAssigned: 'Today, 08:00 AM'
      }
    ];
  });

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
        reason: 'Doctor Emergency Leave',
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
  const [availableReplacements, setAvailableReplacements] = useState(() => {
    let list = [
      { id: 'rep-1', name: 'Dr. Sundar M', specialty: 'Cardiology', department: 'Cardiology', experience: '14 Yrs', verified: true, availableSlots: 6, dutyStatus: 'On Duty (Room 204)' },
      { id: 'rep-2', name: 'Dr. Anand K', specialty: 'General Medicine', department: 'General Medicine', experience: '11 Yrs', verified: true, availableSlots: 8, dutyStatus: 'On Duty (Room 102)' },
      { id: 'rep-3', name: 'Dr. Prakash R', specialty: 'Orthopedics', department: 'Orthopedics', experience: '15 Yrs', verified: true, availableSlots: 4, dutyStatus: 'On Duty (Room 108)' },
      { id: 'rep-4', name: 'Dr. Priya Dharshini', specialty: 'Pediatrics', department: 'Pediatrics', experience: '6 Yrs', verified: true, availableSlots: 10, dutyStatus: 'On Duty (Room 115)' }
    ];
    const saved = localStorage.getItem('medibridge_hospital_doctors');
    if (saved) {
      try {
        const stored = JSON.parse(saved);
        stored.forEach((d) => {
          if (!list.some((existing) => existing.name === d.name)) {
            list.push({
              id: d.id,
              name: d.name,
              specialty: d.specialty || 'General Medicine',
              department: d.department || d.specialty || 'General Medicine',
              experience: '5 Yrs',
              verified: d.verification === 'Verified',
              availableSlots: 6,
              dutyStatus: 'Available'
            });
          }
        });
      } catch (e) {}
    }
    return list;
  });

  useEffect(() => {
    if (!localStorage.getItem('medibridge_cancellation_requests')) {
      localStorage.setItem('medibridge_cancellation_requests', JSON.stringify(cancellations));
    }
    if (!localStorage.getItem('medibridge_active_doctor_replacements')) {
      localStorage.setItem('medibridge_active_doctor_replacements', JSON.stringify(replacements));
    }
    const handleSync = () => {
      const savedCan = localStorage.getItem('medibridge_cancellation_requests');
      if (savedCan) {
        try { setCancellations(JSON.parse(savedCan)); } catch (e) {}
      }
      const savedRep = localStorage.getItem('medibridge_active_doctor_replacements');
      if (savedRep) {
        try { setReplacements(JSON.parse(savedRep)); } catch (e) {}
      }
      const savedDocs = localStorage.getItem('medibridge_hospital_doctors');
      if (savedDocs) {
        try {
          const stored = JSON.parse(savedDocs);
          setAvailableReplacements((prev) => {
            const nextList = [...prev];
            stored.forEach((d) => {
              if (!nextList.some((existing) => existing.name === d.name)) {
                nextList.push({
                  id: d.id,
                  name: d.name,
                  specialty: d.specialty || 'General Medicine',
                  department: d.department || d.specialty || 'General Medicine',
                  experience: '5 Yrs',
                  verified: d.verification === 'Verified',
                  availableSlots: 6,
                  dutyStatus: 'Available'
                });
              }
            });
            return nextList;
          });
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const [selectedCan, setSelectedCan] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showNewPairModal, setShowNewPairModal] = useState(false);
  const [chosenReplacementDoctor, setChosenReplacementDoctor] = useState('Dr. Sundar M');
  const [replacementNote, setReplacementNote] = useState('Patient informed via SMS. No consultation fee difference charged.');

  // New Replacement Pair Form
  const [newPairForm, setNewPairForm] = useState({
    absentDoctor: 'Dr. Lavanya S (Neurology)',
    coveringDoctor: 'Dr. Anand K (General Medicine)',
    patientName: 'Anitha K',
    token: 'T-103',
    slot: '11:00 AM (Today)',
    reason: 'Specialist Emergency Leave'
  });

  const persistCancellations = (updated) => {
    setCancellations(updated);
    localStorage.setItem('medibridge_cancellation_requests', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const persistReplacements = (updated) => {
    setReplacements(updated);
    localStorage.setItem('medibridge_active_doctor_replacements', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleOpenMatch = (can) => {
    setSelectedCan(can);
    const match = availableReplacements.find((r) => r.department === can.department) || availableReplacements[0];
    setChosenReplacementDoctor(match.name);
    setShowMatchModal(true);
  };

  const handleConfirmReplacement = (e) => {
    e.preventDefault();
    if (!selectedCan) return;

    // Update cancellation record
    const updatedCans = cancellations.map((c) => {
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
    persistCancellations(updatedCans);

    // Create explicit doctor replacement pairing
    const newPairing = {
      id: `rep-pair-${Date.now()}`,
      absentDoctor: selectedCan.originalDoctor,
      absentSpecialty: selectedCan.department,
      coveringDoctor: chosenReplacementDoctor,
      coveringSpecialty: 'Certified Clinical Specialist',
      patientName: selectedCan.patientName,
      token: selectedCan.token,
      slot: selectedCan.scheduledTime,
      reason: selectedCan.reason,
      status: 'Active Coverage',
      patientNotified: true,
      dateAssigned: 'Just now'
    };
    persistReplacements([newPairing, ...replacements]);

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
              status: `Reassigned to ${chosenReplacementDoctor}`
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
        text: `Doctor replacement confirmed: ${selectedCan.originalDoctor} is now replaced by ${chosenReplacementDoctor} for patient ${selectedCan.patientName}.`
      });
    }
  };

  const handleCreateNewPair = (e) => {
    e.preventDefault();
    const entry = {
      id: `rep-pair-${Date.now()}`,
      absentDoctor: newPairForm.absentDoctor.split('(')[0].trim(),
      absentSpecialty: newPairForm.absentDoctor.includes('(') ? newPairForm.absentDoctor.split('(')[1].replace(')', '') : 'Specialist',
      coveringDoctor: newPairForm.coveringDoctor.split('(')[0].trim(),
      coveringSpecialty: newPairForm.coveringDoctor.includes('(') ? newPairForm.coveringDoctor.split('(')[1].replace(')', '') : 'Specialist',
      patientName: newPairForm.patientName,
      token: newPairForm.token,
      slot: newPairForm.slot,
      reason: newPairForm.reason,
      status: 'Active Coverage',
      patientNotified: true,
      dateAssigned: 'Just now'
    };
    persistReplacements([entry, ...replacements]);
    setShowNewPairModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Doctor coverage pairing recorded: ${entry.absentDoctor} replaced by ${entry.coveringDoctor}.`
      });
    }
  };

  const handleCompleteCoverage = (id) => {
    const updated = replacements.map((r) => (r.id === id ? { ...r, status: 'Coverage Completed' } : r));
    persistReplacements(updated);
    if (onToast) onToast({ type: 'success', text: 'Clinical replacement coverage marked as Completed.' });
  };

  const filteredCancellations = cancellations.filter((c) => {
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
            Coordinate doctor emergency absences, match replacement specialists, and view active coverage pairings.
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
          Replacement Doctor Engine & Pairings ({replacements.length})
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
                {filteredCancellations.map((c) => (
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
                            color: '#B83245',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {c.token}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
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

      {/* TAB 2: REPLACEMENT DOCTOR ENGINE & PAIRINGS (Explicit who is replaced by whom!) */}
      {activeSubTab === 'replacements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Active Doctor Replacements (Who replaces whom!) */}
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
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Active Doctor Replacements & Coverage Register
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Detailed record of which absent doctor is being covered by which replacement specialist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPairModal(true)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={15} /> + Assign Replacement Pairing
              </button>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '180px' }}>Absent Doctor</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}></th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '200px' }}>Replaced By (Covering Doctor)</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '180px' }}>Patient & Token Covered</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '160px' }}>Absence Reason</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '130px' }}>Coverage Status</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '110px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {replacements.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.875rem', color: '#B83245' }}>
                          {r.absentDoctor}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.absentSpecialty}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <ArrowRight size={18} style={{ color: 'var(--color-primary)' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.875rem', color: '#15803D' }}>
                          {r.coveringDoctor}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.coveringSpecialty}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--surface-subtle)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '800', fontFamily: 'monospace' }}>
                            {r.token}
                          </span>
                          <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                            {r.patientName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {r.slot}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                        {r.reason}
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
                            backgroundColor: r.status === 'Active Coverage' ? '#DCFCE7' : '#FAF6F7',
                            color: r.status === 'Active Coverage' ? '#15803D' : 'var(--text-muted)',
                            border: r.status === 'Active Coverage' ? 'none' : '1px solid var(--border)'
                          }}
                        >
                          {r.status === 'Active Coverage' ? <Check size={12} strokeWidth={2.5} /> : '●'} {r.status}
                        </span>
                        {r.patientNotified && (
                          <div style={{ fontSize: '0.7rem', color: '#0369A1', marginTop: '2px' }}>
                            SMS Notification Sent
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {r.status === 'Active Coverage' ? (
                          <button
                            type="button"
                            onClick={() => handleCompleteCoverage(r.id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              border: '1px solid var(--border)',
                              backgroundColor: '#FFFFFF',
                              color: 'var(--color-heading)',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Mark Done
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Certified On-Duty Replacement Pool */}
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Certified On-Duty Replacement Pool
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Verified specialists currently in clinic with open outpatient slot buffers available for immediate failover.
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
                      <span style={{ color: 'var(--text-muted)' }}>Duty Station:</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{doc.dutyStatus}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Available Buffer:</span>
                      <span style={{ fontWeight: '700', color: '#15803D' }}>{doc.availableSlots} Open Slots</span>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text)' }}>
                    Ready for cross-specialty coverage.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: MATCH & REASSIGN FROM CANCELLATION */}
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
                Absent Doctor: <strong>{selectedCan.originalDoctor}</strong> ({selectedCan.department})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#B83245', marginTop: '4px' }}>
                Reason: {selectedCan.reason}
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

      {/* MODAL 2: MANUAL ASSIGN REPLACEMENT PAIRING */}
      {showNewPairModal && (
        <Modal
          isOpen={showNewPairModal}
          onClose={() => setShowNewPairModal(false)}
          title="Create Doctor Coverage Replacement Pairing"
        >
          <form onSubmit={handleCreateNewPair} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Absent Doctor</label>
                <select
                  value={newPairForm.absentDoctor}
                  onChange={(e) => setNewPairForm({ ...newPairForm, absentDoctor: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                >
                  <option value="Dr. Lavanya S (Neurology)">Dr. Lavanya S (Neurology)</option>
                  <option value="Dr. Prakash R (Orthopedics)">Dr. Prakash R (Orthopedics)</option>
                  <option value="Dr. M. Revathi (Cardiology)">Dr. M. Revathi (Cardiology)</option>
                  <option value="Dr. Sundar M (Cardiology)">Dr. Sundar M (Cardiology)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Covering Replacement Doctor</label>
                <select
                  value={newPairForm.coveringDoctor}
                  onChange={(e) => setNewPairForm({ ...newPairForm, coveringDoctor: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                >
                  <option value="Dr. Sundar M (Cardiology)">Dr. Sundar M (Cardiology)</option>
                  <option value="Dr. Anand K (General Medicine)">Dr. Anand K (General Medicine)</option>
                  <option value="Dr. Prakash R (Orthopedics)">Dr. Prakash R (Orthopedics)</option>
                  <option value="Dr. Priya Dharshini (Pediatrics)">Dr. Priya Dharshini (Pediatrics)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Patient Name</label>
                <input
                  type="text"
                  value={newPairForm.patientName}
                  onChange={(e) => setNewPairForm({ ...newPairForm, patientName: e.target.value })}
                  placeholder="e.g. Anitha K"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Token #</label>
                <input
                  type="text"
                  value={newPairForm.token}
                  onChange={(e) => setNewPairForm({ ...newPairForm, token: e.target.value })}
                  placeholder="e.g. T-103"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Slot Time</label>
                <input
                  type="text"
                  value={newPairForm.slot}
                  onChange={(e) => setNewPairForm({ ...newPairForm, slot: e.target.value })}
                  placeholder="e.g. 11:00 AM (Today)"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Reason</label>
                <input
                  type="text"
                  value={newPairForm.reason}
                  onChange={(e) => setNewPairForm({ ...newPairForm, reason: e.target.value })}
                  placeholder="e.g. Specialist Out-of-Office"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowNewPairModal(false)}
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
                  cursor: 'pointer'
                }}
              >
                Confirm Replacement Pairing
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
