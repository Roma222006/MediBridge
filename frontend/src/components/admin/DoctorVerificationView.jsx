import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Check,
  X,
  ExternalLink,
  Eye,
  Building2,
  Stethoscope,
  Info
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function DoctorVerificationView({ onToast, onDoctorUpdated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [verificationQueue, setVerificationQueue] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_verifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'ver-1',
        doctorName: 'Dr. Lavanya S',
        specialty: 'Neurology',
        department: 'Neurology',
        regNumber: 'TNMC/2017/09841',
        medicalCouncil: 'Tamil Nadu Medical Council',
        qualification: 'MBBS, MD (General Medicine), DM (Neurology)',
        experienceYears: 9,
        status: 'Under Verification',
        currentStep: 3,
        submissionDate: '21 Nov 2026',
        documents: [
          { name: 'State_Medical_Council_Registration.pdf', type: 'Registration Certificate', status: 'Verified', hash: '8f4c2e1a9b3d5f7e6a1c2b3d4e5f6a7b8c9d0e1f' },
          { name: 'DM_Neurology_Degree_Certificate.pdf', type: 'Super Specialty Degree', status: 'Pending Review', hash: '3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d' },
          { name: 'Medical_Council_Good_Standing.pdf', type: 'Good Standing Certificate', status: 'Verified', hash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b' }
        ],
        adminNotes: 'Reviewing clinical fellowship documentation from NIMHANS Bangalore.'
      },
      {
        id: 'ver-2',
        doctorName: 'Dr. Priya Dharshini',
        specialty: 'Pediatrics',
        department: 'Pediatrics',
        regNumber: 'TNMC/2019/11234',
        medicalCouncil: 'Tamil Nadu Medical Council',
        qualification: 'MBBS, MD (Pediatrics), DNB',
        experienceYears: 6,
        status: 'Under Verification',
        currentStep: 3,
        submissionDate: '22 Nov 2026',
        documents: [
          { name: 'TNMC_Medical_Council_Reg.pdf', type: 'Registration Certificate', status: 'Verified', hash: '5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c' },
          { name: 'MD_Pediatrics_Degree.pdf', type: 'Degree Certificate', status: 'Pending Review', hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' }
        ],
        adminNotes: 'Verification of state council registration active.'
      },
      {
        id: 'ver-3',
        doctorName: 'Dr. Karthik Raja',
        specialty: 'General Surgery',
        department: 'General Surgery',
        regNumber: 'TNMC/2014/05678',
        medicalCouncil: 'Tamil Nadu Medical Council',
        qualification: 'MBBS, MS (General Surgery), FMAS',
        experienceYears: 12,
        status: 'Info Requested',
        currentStep: 2,
        submissionDate: '19 Nov 2026',
        documents: [
          { name: 'TNMC_Medical_Registration.pdf', type: 'Registration Certificate', status: 'Verified', hash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e' },
          { name: 'Laparoscopic_Fellowship_Cert.pdf', type: 'Fellowship Certificate', status: 'Clarification Needed', hash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c' }
        ],
        adminNotes: 'Requested updated certificate of good standing from surgical board.'
      },
      {
        id: 'ver-4',
        doctorName: 'Dr. Sundar M',
        specialty: 'Cardiology',
        department: 'Cardiology',
        regNumber: 'TNMC/2012/04818',
        medicalCouncil: 'Tamil Nadu Medical Council',
        qualification: 'MBBS, MD (General Medicine), DM (Cardiology), FACC',
        experienceYears: 14,
        status: 'Verified',
        currentStep: 4,
        submissionDate: '10 Nov 2026',
        documents: [
          { name: 'TNMC_Permanent_Registration.pdf', type: 'Registration Certificate', status: 'Verified', hash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e' },
          { name: 'DM_Cardiology_Gold_Medal_Degree.pdf', type: 'Super Specialty Degree', status: 'Verified', hash: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c' }
        ],
        adminNotes: 'Fully accredited with interventional cardiology catheterization privileges.'
      }
    ];
  });

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const filteredQueue = verificationQueue.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenReview = (doc) => {
    setSelectedDoc(doc);
    setShowReviewModal(true);
  };

  const handleApprove = (docId) => {
    const updated = verificationQueue.map((item) => {
      if (item.id === docId) {
        return {
          ...item,
          status: 'Verified',
          currentStep: 4,
          adminNotes: 'Approved by Hospital Medical Administration Board.'
        };
      }
      return item;
    });

    setVerificationQueue(updated);
    localStorage.setItem('medibridge_doctor_verifications', JSON.stringify(updated));

    // Also update doctors list if handler provided
    if (onDoctorUpdated && selectedDoc) {
      onDoctorUpdated(selectedDoc.doctorName, 'Verified');
    }

    setShowReviewModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `${selectedDoc?.doctorName} credential verified. Institutional OPD practicing privileges granted.`
      });
    }
  };

  const handleRequestInfoSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    const updated = verificationQueue.map((item) => {
      if (item.id === selectedDoc.id) {
        return {
          ...item,
          status: 'Info Requested',
          adminNotes: actionReason || 'Additional documentation requested by Medical Superintendent.'
        };
      }
      return item;
    });

    setVerificationQueue(updated);
    localStorage.setItem('medibridge_doctor_verifications', JSON.stringify(updated));
    setShowInfoModal(false);
    setShowReviewModal(false);
    setActionReason('');

    if (onToast) {
      onToast({
        type: 'success',
        text: `Information request notification dispatched to ${selectedDoc.doctorName}.`
      });
    }
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    const updated = verificationQueue.map((item) => {
      if (item.id === selectedDoc.id) {
        return {
          ...item,
          status: 'Rejected',
          adminNotes: actionReason || 'Credential application declined due to documentation mismatch.'
        };
      }
      return item;
    });

    setVerificationQueue(updated);
    localStorage.setItem('medibridge_doctor_verifications', JSON.stringify(updated));
    setShowRejectModal(false);
    setShowReviewModal(false);
    setActionReason('');

    if (onToast) {
      onToast({
        type: 'error',
        text: `Credential application for ${selectedDoc.doctorName} has been declined.`
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Doctor Credentials & Verification Hub
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Review state medical council registrations, post-graduate degrees, and grant hospital practicing privileges.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
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
            <Clock size={14} /> {verificationQueue.filter((v) => v.status === 'Under Verification').length} Pending Review
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
            placeholder="Search by doctor name, specialty, or TNMC registration number..."
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
          <option value="All">All Verification Statuses ▾</option>
          <option value="Under Verification">Under Verification</option>
          <option value="Info Requested">Info Requested</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Verification Queue Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Doctor & Specialty</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Medical Council Reg #</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Qualifications</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Verification Stage</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {item.doctorName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.specialty} &bull; {item.experienceYears} Years Exp
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {item.regNumber}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.medicalCouncil}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                    {item.qualification}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4].map((step) => (
                        <span
                          key={step}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                              step < item.currentStep || item.status === 'Verified'
                                ? 'var(--color-primary)'
                                : step === item.currentStep
                                ? '#F2B9CA'
                                : '#E8E3E5',
                            color:
                              step < item.currentStep || item.status === 'Verified'
                                ? '#FFFFFF'
                                : 'var(--color-heading)'
                          }}
                        >
                          {step < item.currentStep || item.status === 'Verified' ? '✓' : step}
                        </span>
                      ))}
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
                        backgroundColor:
                          item.status === 'Verified'
                            ? '#DCFCE7'
                            : item.status === 'Under Verification'
                            ? '#FEF3C7'
                            : item.status === 'Info Requested'
                            ? '#E0E7FF'
                            : '#FEE2E2',
                        color:
                          item.status === 'Verified'
                            ? '#15803D'
                            : item.status === 'Under Verification'
                            ? '#B77A32'
                            : item.status === 'Info Requested'
                            ? '#4338CA'
                            : '#B83245'
                      }}
                    >
                      {item.status === 'Verified' ? <Check size={12} strokeWidth={2.5} /> : '●'} {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      className="btn-action-view"
                      onClick={() => handleOpenReview(item)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal with 4-Stage Stepper & Certificate Inspection */}
      {showReviewModal && selectedDoc && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title={`Doctor Credential Verification: ${selectedDoc.doctorName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 4-Stage Stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: '#FAF6F7',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)'
              }}
            >
              {[
                { step: 1, label: 'Profile Completed' },
                { step: 2, label: 'Documents Uploaded' },
                { step: 3, label: 'Under Verification' },
                { step: 4, label: 'Verified' }
              ].map((s, idx) => {
                const isPassed = s.step < selectedDoc.currentStep || selectedDoc.status === 'Verified';
                const isCurrent = s.step === selectedDoc.currentStep && selectedDoc.status !== 'Verified';
                return (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? 'var(--color-primary)' : isCurrent ? '#F8DDE3' : '#FFFFFF',
                        border: isPassed ? 'none' : isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                        color: isPassed ? '#FFFFFF' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.8125rem'
                      }}
                    >
                      {isPassed ? <Check size={14} strokeWidth={3} /> : s.step}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? '800' : '600', color: 'var(--color-heading)' }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Doctor Info Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '16px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Doctor & Department</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>{selectedDoc.doctorName}</span>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>{selectedDoc.specialty} ({selectedDoc.department})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Council Registration #</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>{selectedDoc.regNumber}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedDoc.medicalCouncil}</div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Uploaded Credential Documents & Integrity Checks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedDoc.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                          {doc.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                        SHA-256: {doc.hash}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: doc.status === 'Verified' ? '#DCFCE7' : '#FEF3C7',
                        color: doc.status === 'Verified' ? '#15803D' : '#B77A32'
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Instructions */}
            <div style={{ padding: '12px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
              <strong>Internal Verification Note:</strong> {selectedDoc.adminNotes}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '1px solid #FCA5A5',
                  backgroundColor: '#FFFFFF',
                  color: '#B83245',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-heading)',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Request Additional Info
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedDoc.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
                }}
              >
                ✓ Approve Verification
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Info Modal */}
      {showInfoModal && selectedDoc && (
        <Modal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          title={`Request Clarification from ${selectedDoc.doctorName}`}
        >
          <form onSubmit={handleRequestInfoSubmit}>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Specify the clarification or missing document required from the doctor before hospital credentials can be approved.
            </p>
            <textarea
              rows={4}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Please provide an updated Medical Council Good Standing certificate or latest fellowship completion log..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Send Request to Doctor
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDoc && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title={`Reject Verification: ${selectedDoc.doctorName}`}
        >
          <form onSubmit={handleRejectSubmit}>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#B83245' }}>
              Are you sure you want to decline this doctor credential application? Please provide an institutional reason.
            </p>
            <textarea
              rows={4}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Expired council registration, credential mismatch with hospital clinical guidelines..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #FCA5A5',
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: '#B83245', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
