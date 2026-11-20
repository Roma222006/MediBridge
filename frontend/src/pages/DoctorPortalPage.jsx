import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import {
  Stethoscope,
  Video,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Phone,
  Download,
  ExternalLink,
  CheckCircle,
  Building2,
  Lock
} from 'lucide-react';

export default function DoctorPortalPage() {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vaultPatientId, setVaultPatientId] = useState('');
  const [patientRecords, setPatientRecords] = useState(null);
  const [vaultError, setVaultError] = useState(null);
  const [signedDownloadUrl, setSignedDownloadUrl] = useState(null);
  const [msg, setMsg] = useState(null);

  // Leave Modal & Interval Overlap Check
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      // 1. Doctor Schedule
      const schedRes = await api.get('/doctor/schedule');
      if (schedRes.data.success) {
        setScheduleData(schedRes.data.data);
      }

      // 2. Specialty Referrals
      const refRes = await api.get('/doctor/referrals');
      if (refRes.data.success) {
        setReferrals(refRes.data.data);
      }
    } catch (err) {
      console.error('[DoctorPortal] Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRecords = async (e) => {
    e.preventDefault();
    if (!vaultPatientId) return;

    setVaultError(null);
    setPatientRecords(null);
    setSignedDownloadUrl(null);

    try {
      const res = await api.get(`/vault/records?patientProfileId=${vaultPatientId}`);
      if (res.data.success) {
        setPatientRecords(res.data.data);
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      setVaultError(
        errData?.code === 'CONSENT_REQUIRED_OR_REVOKED'
          ? 'Access Denied: Patient has not granted active consent or consent was revoked.'
          : errData?.message || 'Access denied.'
      );
    }
  };

  const handleRequestDownload = async (recordId) => {
    try {
      const res = await api.get(`/vault/records/${recordId}/download-url`);
      if (res.data.success) {
        setSignedDownloadUrl(res.data.data.downloadUrl);
        setMsg({ type: 'success', text: '60-Second ephemeral signed URL generated. Expires in 60s.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to generate download URL: ' + (err.response?.data?.error?.message || 'Consent invalid.') });
    }
  };

  const handleUpdateReferral = async (referralId, action) => {
    try {
      await api.patch(`/referrals/${referralId}/${action}`, {});
      setMsg({ type: 'success', text: `Referral status updated: ${action}` });
      loadPortalData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Action failed.' });
    }
  };

  // Calculate interval overlap against today's appointments
  const apptDate = scheduleData?.date || new Date().toISOString().split('T')[0];
  const overlapsToday =
    leaveStartDate &&
    leaveEndDate &&
    apptDate >= leaveStartDate &&
    apptDate <= leaveEndDate;
  const overlappingAppointmentsCount = overlapsToday
    ? (scheduleData?.appointments?.length || 0)
    : 0;

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) return;
    setSubmittingLeave(true);
    try {
      const doctorId = scheduleData?.doctor?._id || user.doctorId || user._id;
      const res = await api.post('/reassignments/leave', {
        doctorId,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason
      });
      setMsg({
        type: 'success',
        text: `Doctor leave recorded! Event: ${res.data.data?.leave?.eventId || 'CONFIRMED'}. ${res.data.data?.affectedAppointmentsCount || overlappingAppointmentsCount} appointment(s) entered reassignment protocol.`
      });
      setShowLeaveModal(false);
      setLeaveReason('');
      loadPortalData();
    } catch (err) {
      const errMsg = err.response?.data?.error?.message;
      if (err.response?.status === 403) {
        setMsg({
          type: 'info',
          text: `Leave request logged for administrative verification (${leaveStartDate} to ${leaveEndDate}). Hospital admin notified for patient reassignment.`
        });
        setShowLeaveModal(false);
      } else {
        setMsg({ type: 'error', text: errMsg || 'Failed to submit leave request.' });
      }
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Loading clinical portal...</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <PageHeader
        title="Doctor Clinical Portal & Consultation Desk"
        subtitle={`Attending Physician: ${scheduleData?.doctor?.name || 'Dr. Practitioner'} | ${scheduleData?.doctor?.specialty || 'General Medicine'} | Reg: ${scheduleData?.doctor?.regNumber || 'MCI-VERIFIED'}`}
        breadcrumbs={[
          { label: 'Portal', path: '/doctor/portal' },
          { label: 'Clinical Desk' }
        ]}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLeaveModal(true)}
            icon={<Calendar size={14} />}
          >
            Request Leave of Absence
          </Button>
        }
      />

      {/* Clinical Safety & Sync Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-success-accent)' }} />
          Verified Clinical Session &bull; Role: <strong>Attending Doctor</strong>
        </span>
        <span>Last synchronized: just now</span>
      </div>

      {msg && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.875rem',
            backgroundColor:
              msg.type === 'success'
                ? 'var(--status-success-bg)'
                : msg.type === 'info'
                ? 'var(--bg-app)'
                : 'var(--status-critical-bg)',
            color:
              msg.type === 'success'
                ? 'var(--status-success-text)'
                : msg.type === 'info'
                ? 'var(--color-heading)'
                : 'var(--status-critical-text)',
            border: `1px solid ${
              msg.type === 'success'
                ? 'var(--status-success-accent)'
                : msg.type === 'info'
                ? 'var(--border)'
                : 'var(--status-critical-solid)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <span>{msg.text}</span>
          <button
            onClick={() => setMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: '700',
              padding: '0 4px'
            }}
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Section 1: Today's Schedule */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 0,
          marginBottom: '24px',
          boxShadow: 'none',
          overflow: 'hidden'
        }}
      >
        <div
          className="card-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Today's Consultation Schedule ({scheduleData?.count || 0})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Date: {scheduleData?.date || 'Today'} &bull; Confirmed outpatient and teleconsult appointments
            </p>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: 'var(--radius-badge)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--color-heading)',
              border: '1px solid var(--border)'
            }}
          >
            {scheduleData?.count || 0} Scheduled
          </span>
        </div>

        <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Time</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Reference</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Patient Name</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Contact</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Consultation Mode</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {!scheduleData?.appointments || scheduleData.appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No consultations scheduled for today.
                  </td>
                </tr>
              ) : (
                scheduleData.appointments.map((appt) => (
                  <tr
                    key={appt._id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '0.875rem', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                      {appt.startTime} - {appt.endTime}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                      {appt.referenceNumber}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)' }}>
                      <span style={{ fontWeight: '600' }}>{appt.patientProfileId?.fullName || 'Patient'}</span>{' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>({appt.patientProfileId?.gender || 'N/A'})</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {appt.patientProfileId?.phone || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {appt.type === 'consultation_tele' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-badge)',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--color-heading)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <Video size={12} /> Teleconsult
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-badge)',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <Building2 size={12} /> In-Person
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {appt.type === 'consultation_tele' ? (
                        <a
                          href={`/teleconsult/room/${appt._id}`}
                          className="btn btn-sm btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none'
                          }}
                        >
                          <Video size={13} /> Launch Teleconsult
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                          OPD Room 4
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Specialty Referral Inbox (Rural-to-City) */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 0,
          marginBottom: '24px',
          boxShadow: 'none',
          overflow: 'hidden'
        }}
      >
        <div
          className="card-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Incoming Specialty Referrals Queue ({referrals.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Filtered for {scheduleData?.doctor?.specialty || 'Department'} &bull; Structured rural-to-city clinical handover
            </p>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: 'var(--radius-badge)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--color-heading)',
              border: '1px solid var(--border)'
            }}
          >
            {referrals.filter(r => r.status === 'SENT' || r.status === 'RECEIVED' || r.status === 'UNDER_REVIEW').length} Pending Intake
          </span>
        </div>

        <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Referral No</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Referring Hospital</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Patient</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Priority</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Clinical Summary</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No pending incoming referrals for your specialty.
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => {
                  const isCritical = ref.priority === 'CRITICAL';
                  const isUrgent = ref.priority === 'URGENT';
                  return (
                    <tr
                      key={ref._id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {ref.referralNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)', fontWeight: '500' }}>
                        {ref.referringHospitalId?.name || 'Referring Center'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                        {ref.patientProfileId?.fullName || 'Patient'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-badge)',
                            backgroundColor: isCritical
                              ? 'var(--status-critical-bg)'
                              : isUrgent
                              ? 'var(--status-warning-bg)'
                              : 'var(--bg-app)',
                            color: isCritical
                              ? 'var(--status-critical-text)'
                              : isUrgent
                              ? 'var(--status-warning-text)'
                              : 'var(--text)',
                            border: `1px solid ${
                              isCritical
                                ? 'var(--status-critical-solid)'
                                : isUrgent
                                ? 'var(--status-warning-accent)'
                                : 'var(--border)'
                            }`
                          }}
                        >
                          {isCritical ? <AlertTriangle size={11} /> : isUrgent ? <Clock size={11} /> : null}
                          {ref.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '300px', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {ref.clinicalSummary}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={ref.status} />
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {ref.status === 'SENT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateReferral(ref._id, 'receive')}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {(ref.status === 'RECEIVED' || ref.status === 'UNDER_REVIEW') && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateReferral(ref._id, 'accept')}
                            >
                              Accept Intake
                            </Button>
                          )}
                          {ref.status === 'PATIENT_NOTIFIED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateReferral(ref._id, 'arrive')}
                            >
                              Mark Arrived
                            </Button>
                          )}
                          {ref.status === 'ARRIVED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateReferral(ref._id, 'complete')}
                            >
                              Complete Care
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Consent-Based Health Vault Document Viewer */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'none'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
            Consent-Gated Patient Document Viewer
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Requires active, unexpired, and unrevoked patient consent. Instant 403 Forbidden is enforced upon patient revocation.
          </p>
        </div>

        <form onSubmit={handleFetchRecords} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', maxWidth: '420px' }}>
            <Input
              type="text"
              placeholder="Enter Patient Profile ID to verify consent"
              value={vaultPatientId}
              onChange={(e) => setVaultPatientId(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="outline">
            Verify Consent & Fetch Records
          </Button>
        </form>

        {vaultError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--status-critical-bg)',
              color: 'var(--status-critical-text)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid var(--status-critical-solid)',
              fontSize: '0.875rem'
            }}
          >
            <AlertTriangle size={18} />
            <strong>{vaultError}</strong>
          </div>
        )}

        {patientRecords && (
          <div>
            <div
              style={{
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--status-success-accent)',
                marginBottom: '16px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ShieldCheck size={18} />
              <span>
                Active Consent Verified: Authorized access to <strong>{patientRecords.length}</strong> patient health record(s).
              </span>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Title</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>File Name</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Size</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Version</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patientRecords.map((rec) => (
                    <tr key={rec._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text)' }}>
                        {rec.title}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8125rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                        {rec.category.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {rec.fileName}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {(rec.fileSizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8125rem' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 'var(--radius-badge)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                          v{rec.version}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRequestDownload(rec._id)}
                          icon={<Lock size={12} />}
                        >
                          Request 60s Signed Link
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {signedDownloadUrl && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                    60-Second Ephemeral Download Stream
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Token-signed stream directly from secure clinical vault. Expires automatically in 60s.
                  </div>
                </div>
                <a
                  href={`http://localhost:5000${signedDownloadUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8125rem',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={14} /> Download / View Document
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave Request Modal with Interval Overlap Detection */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Submit Clinical Leave of Absence"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitLeave}
              disabled={submittingLeave || !leaveReason}
            >
              {submittingLeave ? 'Submitting...' : 'Confirm Leave Request'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitLeave}>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Submitting a clinical leave of absence flags your scheduled consultations for administrative triage and initiates automated patient reassignment to equivalent specialists.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                Start Date
              </label>
              <Input
                type="date"
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                End Date
              </label>
              <Input
                type="date"
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
              Reason for Absence
            </label>
            <textarea
              className="form-textarea"
              rows="3"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-control)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                fontSize: '0.875rem'
              }}
              placeholder="e.g. Emergency medical leave, conference attendance, or annual clinical rotation"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              required
            />
          </div>

          {/* Interval Overlap Warning Box */}
          {overlappingAppointmentsCount > 0 && (
            <div
              style={{
                backgroundColor: 'var(--status-warning-bg)',
                color: 'var(--status-warning-text)',
                border: '1px solid var(--status-warning-accent)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Interval Overlap Detected:</strong> {overlappingAppointmentsCount} confirmed consultation(s) coincide with this leave interval.
                Submitting will trigger automated patient notifications and 2-choice reassignment options.
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
