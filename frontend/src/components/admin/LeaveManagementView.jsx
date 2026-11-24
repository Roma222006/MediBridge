import React, { useState, useEffect } from 'react';
import {
  CalendarX,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  UserPlus,
  Search,
  Check,
  X,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function LeaveManagementView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('medibridge_doctor_leave_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'l-1',
        doctorName: 'Dr. M. Revathi',
        specialty: 'Cardiology',
        dates: '24-25 Dec 2026',
        duration: '2 Days',
        type: 'CME Conference Leave',
        reason: 'Annual Cardiological Society CME Conference',
        status: 'APPROVED',
        coveringDoctor: 'Dr. K. Sundaram (Cardiology)',
        emergencyContact: '+91 98421 99887'
      },
      {
        id: 'l-2',
        doctorName: 'Dr. Lavanya S',
        specialty: 'Neurology',
        dates: '02-03 Jan 2027',
        duration: '2 Days',
        type: 'Personal Leave',
        reason: 'Family engagement & travel',
        status: 'PENDING',
        coveringDoctor: 'Dr. Prakash R (Orthopedics)',
        emergencyContact: '+91 94432 11092'
      },
      {
        id: 'l-3',
        doctorName: 'Dr. Prakash R',
        specialty: 'Orthopedics',
        dates: '28-29 Dec 2026',
        duration: '2 Days',
        type: 'Casual Leave',
        reason: 'Specialist medical conference attendance',
        status: 'PENDING',
        coveringDoctor: 'Dr. Anand K (General Medicine)',
        emergencyContact: '+91 97890 22345'
      }
    ];
  });

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [newCoveringDoctor, setNewCoveringDoctor] = useState('Dr. Sundar M (Cardiology)');
  const [rejectReason, setRejectReason] = useState('');

  // Save changes to localStorage so Doctor Portal reflects updates immediately
  const persistLeaves = (updated) => {
    setLeaveRequests(updated);
    localStorage.setItem('medibridge_doctor_leave_requests', JSON.stringify(updated));
  };

  const handleApprove = (leaveId) => {
    const updated = leaveRequests.map((l) => {
      if (l.id === leaveId) {
        return { ...l, status: 'APPROVED' };
      }
      return l;
    });
    persistLeaves(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Doctor leave request approved. Outpatient slots paused and covering doctor assigned.'
      });
    }
  };

  const handleOpenReject = (leave) => {
    setSelectedLeave(leave);
    setShowRejectModal(true);
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    const updated = leaveRequests.map((l) => {
      if (l.id === selectedLeave.id) {
        return { ...l, status: 'REJECTED', rejectReason: rejectReason || 'Administrative staffing constraint' };
      }
      return l;
    });
    persistLeaves(updated);
    setShowRejectModal(false);
    setRejectReason('');
    if (onToast) {
      onToast({
        type: 'error',
        text: `Leave request for ${selectedLeave.doctorName || 'doctor'} rejected.`
      });
    }
  };

  const handleOpenReassign = (leave) => {
    setSelectedLeave(leave);
    setShowReassignModal(true);
  };

  const handleConfirmReassign = (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    const updated = leaveRequests.map((l) => {
      if (l.id === selectedLeave.id) {
        return { ...l, coveringDoctor: newCoveringDoctor };
      }
      return l;
    });
    persistLeaves(updated);
    setShowReassignModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Covering doctor for ${selectedLeave.doctorName || 'doctor'} reassigned to ${newCoveringDoctor}.`
      });
    }
  };

  const filtered = leaveRequests.filter((l) => {
    const name = l.doctorName || 'Dr. Specialist';
    const matchesSearch =
      !searchQuery ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.coveringDoctor && l.coveringDoctor.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Doctor Leave & Replacement Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Review doctor out-of-office leave applications, verify covering specialists, and protect patient appointment continuity.
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
            <Clock size={14} /> {leaveRequests.filter((l) => l.status === 'PENDING').length} Pending Approvals
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
            placeholder="Search by doctor name, reason, or covering doctor..."
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
          <option value="All">All Leave Statuses ▾</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Doctor</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Leave Dates & Duration</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Type & Stated Reason</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Designated Covering Doctor</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {l.doctorName || 'Dr. Specialist'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {l.specialty || 'Medical Department'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {l.dates}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {l.duration}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {l.type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {l.reason}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                        {l.coveringDoctor || 'Pending Assignment'}
                      </span>
                    </div>
                    {l.emergencyContact && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Emergency: {l.emergencyContact}
                      </div>
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
                          l.status === 'APPROVED' ? '#DCFCE7' : l.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                        color:
                          l.status === 'APPROVED' ? '#15803D' : l.status === 'PENDING' ? '#B77A32' : '#B83245'
                      }}
                    >
                      {l.status === 'APPROVED' ? <Check size={12} strokeWidth={2.5} /> : '●'} {l.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {l.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(l.id)}
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
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReject(l)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '9999px',
                              border: '1px solid #FCA5A5',
                              backgroundColor: '#FFFFFF',
                              color: '#B83245',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenReassign(l)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--color-heading)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Reassign Cover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && selectedLeave && (
        <Modal
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
          title={`Assign Covering Specialist for ${selectedLeave.doctorName || 'Doctor'}`}
        >
          <form onSubmit={handleConfirmReassign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Select a certified specialist available during <strong>{selectedLeave.dates}</strong> to take over pending consultations and clinical triage.
            </p>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Designated Replacement Doctor
              </label>
              <select
                value={newCoveringDoctor}
                onChange={(e) => setNewCoveringDoctor(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              >
                <option value="Dr. Sundar M (Cardiology)">Dr. Sundar M (Cardiology - Senior Consultant)</option>
                <option value="Dr. M. Revathi (Cardiology)">Dr. M. Revathi (Cardiology - Associate Consultant)</option>
                <option value="Dr. Lavanya S (Neurology)">Dr. Lavanya S (Neurology - Consultant)</option>
                <option value="Dr. Prakash R (Orthopedics)">Dr. Prakash R (Orthopedics - Senior Consultant)</option>
                <option value="Dr. Anand K (General Medicine)">Dr. Anand K (General Medicine - Consultant)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Confirm Replacement Coverage
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLeave && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title={`Decline Leave Request: ${selectedLeave.doctorName || 'Doctor'}`}
        >
          <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#B83245' }}>
              Please provide the administrative or clinical reason for rejecting this leave application.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical patient caseload in ICU during this period, or lack of covering specialist..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5' }}
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
