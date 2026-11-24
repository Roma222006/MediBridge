import React, { useState } from 'react';
import {
  Send,
  Search,
  Check,
  X,
  Clock,
  AlertTriangle,
  Building2,
  Stethoscope,
  Bed,
  CheckCircle,
  FileText
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function ReferralManagementView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');

  const [referrals, setReferrals] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_referrals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'REF-2026-089',
        patientName: 'Muthusamy K',
        age: 62,
        gender: 'Male',
        referringHospital: 'Annur Primary Health Center (PHC)',
        referringDoctor: 'Dr. R. Selvan (Medical Officer)',
        department: 'Cardiology',
        urgency: 'Emergency (Red)',
        clinicalBrief: 'Acute ST-elevation myocardial infarction (STEMI). Thrombolysis completed at PHC, referred for primary PCI and Cath Lab rescue.',
        status: 'Received',
        date: '35 mins ago',
        assignedWard: 'Pending'
      },
      {
        id: 'REF-2026-088',
        patientName: 'Lakshmi V',
        age: 45,
        gender: 'Female',
        referringHospital: 'Pollachi Taluk Headquarters Hospital',
        referringDoctor: 'Dr. M. Sangeetha (Civil Surgeon)',
        department: 'Neurology',
        urgency: 'Urgent (Amber)',
        clinicalBrief: 'Sudden onset left-sided hemiparesis and dysarthria. CT brain suggests acute ischemic stroke. Candidate for advanced neuro-intervention.',
        status: 'Accepted',
        date: '1 hour ago',
        assignedWard: 'ICU Bed 04'
      },
      {
        id: 'REF-2026-087',
        patientName: 'Praveen Kumar',
        age: 28,
        gender: 'Male',
        referringHospital: 'Mettupalayam Government Hospital',
        referringDoctor: 'Dr. K. Vignesh',
        department: 'Orthopedics',
        urgency: 'Routine (Green)',
        clinicalBrief: 'Complex compound tibia-fibula fracture with soft tissue loss. Reconstructed splinting applied, referred for definitive joint fixation.',
        status: 'Patient Arrived',
        date: '3 hours ago',
        assignedWard: 'General Ward 2'
      },
      {
        id: 'REF-2026-086',
        patientName: 'Saradha M',
        age: 58,
        gender: 'Female',
        referringHospital: 'Valparai Estate Health Center',
        referringDoctor: 'Dr. T. James',
        department: 'Cardiology',
        urgency: 'Urgent (Amber)',
        clinicalBrief: 'Severe decompensated heart failure with bilateral pulmonary edema. Refractory to oral diuretics.',
        status: 'Completed',
        date: 'Yesterday',
        assignedWard: 'CCU Bed 02'
      }
    ];
  });

  const [selectedRef, setSelectedRef] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [targetDept, setTargetDept] = useState('Cardiology');
  const [reserveBedType, setReserveBedType] = useState('ICU Bed');

  const persistReferrals = (updated) => {
    setReferrals(updated);
    localStorage.setItem('medibridge_hospital_referrals', JSON.stringify(updated));
  };

  const handleOpenAccept = (ref) => {
    setSelectedRef(ref);
    setTargetDept(ref.department);
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = (e) => {
    e.preventDefault();
    if (!selectedRef) return;

    const updated = referrals.map((r) => {
      if (r.id === selectedRef.id) {
        return {
          ...r,
          status: 'Accepted',
          assignedWard: reserveBedType,
          department: targetDept
        };
      }
      return r;
    });

    persistReferrals(updated);
    setShowAcceptModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Referral ${selectedRef.id} accepted. Assigned to ${targetDept} triage with ${reserveBedType} held.`
      });
    }
  };

  const handleMarkTransitArrived = (id) => {
    const updated = referrals.map((r) => {
      if (r.id === id) {
        return { ...r, status: 'Patient Arrived' };
      }
      return r;
    });
    persistReferrals(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Patient transit confirmed. Case handed over to Emergency Trauma Triage.'
      });
    }
  };

  const filtered = referrals.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referringHospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clinicalBrief.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'All' || r.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Cross-Hospital & Rural Referral Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Coordinate rural-to-city referrals, triage acute cases, reserve emergency beds, and monitor inbound ambulance transit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FEE2E2',
              color: '#B83245',
              fontSize: '0.8125rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertTriangle size={14} /> {referrals.filter((r) => r.status === 'Received').length} New Referrals Awaiting Triage
          </span>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search referral ID, patient, referring hospital, or clinical diagnosis..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <option value="All">All Referral Statuses ▾</option>
          <option value="Received">Received / New</option>
          <option value="Accepted">Accepted</option>
          <option value="Patient Arrived">Patient Arrived</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
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
          <option value="All">All Triage Tiers ▾</option>
          <option value="Emergency (Red)">Emergency (Red)</option>
          <option value="Urgent (Amber)">Urgent (Amber)</option>
          <option value="Routine (Green)">Routine (Green)</option>
        </select>
      </div>

      {/* Referral Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Referral ID & Patient</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Referring Facility</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Triage Urgency</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Clinical Summary</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Bed Allocation</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {r.patientName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <strong>{r.id}</strong> &bull; {r.age} Yrs &bull; {r.gender}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                      {r.referringHospital}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.referringDoctor}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor:
                          r.urgency.includes('Red') ? '#FEE2E2' : r.urgency.includes('Amber') ? '#FEF3C7' : '#DCFCE7',
                        color:
                          r.urgency.includes('Red') ? '#B83245' : r.urgency.includes('Amber') ? '#B77A32' : '#15803D'
                      }}
                    >
                      {r.urgency}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)', maxWidth: '300px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-heading)', marginBottom: '2px' }}>{r.department}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.clinicalBrief}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                    {r.assignedWard}
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
                          r.status === 'Completed' ? '#DCFCE7' : r.status === 'Accepted' || r.status === 'Patient Arrived' ? '#CFFAFE' : '#FEF3C7',
                        color:
                          r.status === 'Completed' ? '#15803D' : r.status === 'Accepted' || r.status === 'Patient Arrived' ? '#0369A1' : '#B77A32'
                      }}
                    >
                      {r.status === 'Completed' ? <Check size={12} strokeWidth={2.5} /> : '●'} {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.status === 'Received' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAccept(r)}
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
                          Accept Case
                        </button>
                      )}
                      {r.status === 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => handleMarkTransitArrived(r.id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--color-heading)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Arrived
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

      {/* Accept & Bed Hold Modal */}
      {showAcceptModal && selectedRef && (
        <Modal
          isOpen={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          title={`Accept Referral Case: ${selectedRef.id}`}
        >
          <form onSubmit={handleConfirmAccept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                {selectedRef.patientName} &bull; {selectedRef.age} Yrs &bull; {selectedRef.urgency}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                From: {selectedRef.referringHospital} ({selectedRef.referringDoctor})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: '4px' }}>
                Diagnosis: {selectedRef.clinicalBrief}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Receiving Department</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="Cardiology">Cardiology (Cath Lab)</option>
                  <option value="Neurology">Neurology (Stroke Triage)</option>
                  <option value="Orthopedics">Orthopedics (Trauma Fixation)</option>
                  <option value="General Surgery">General Surgery</option>
                  <option value="Emergency & Trauma">Emergency Resuscitation</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Reserve Bed Allocation</label>
                <select
                  value={reserveBedType}
                  onChange={(e) => setReserveBedType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="ICU Bed">ICU Bed (Critical Care)</option>
                  <option value="CCU Bed">CCU Bed (Cardiac Care)</option>
                  <option value="Emergency Trauma Bay">Emergency Trauma Bay</option>
                  <option value="General Ward Bed">General Ward Bed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Accept & Hold Bed
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
