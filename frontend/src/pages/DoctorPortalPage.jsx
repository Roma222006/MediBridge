import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { StethoscopeIcon, VideoIcon, FileTextIcon, ShieldCheckIcon, AlertTriangleIcon } from '../components/Icons';

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

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>Loading clinical portal...</div>;
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StethoscopeIcon size={24} />
          <h2>Doctor Clinical Portal & Consultation Desk</h2>
        </div>
        <p style={{ marginTop: '4px' }}>
          Attending Physician: <strong>{scheduleData?.doctor?.name}</strong> &bull; {scheduleData?.doctor?.specialty} &bull; Reg: {scheduleData?.doctor?.regNumber}
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '0.875rem',
            backgroundColor: msg.type === 'success' ? '#E8F5EE' : '#FDEEEE',
            color: msg.type === 'success' ? '#1C744F' : '#A32828',
            border: `1px solid ${msg.type === 'success' ? '#1C744F' : '#A32828'}`
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Today's Schedule */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h4>Today's Patient Schedule ({scheduleData?.count || 0})</h4>
          <span style={{ fontSize: '0.8125rem', color: '#72848D' }}>Date: {scheduleData?.date}</span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Reference</th>
                <th>Patient Name</th>
                <th>Contact</th>
                <th>Consultation Mode</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!scheduleData?.appointments || scheduleData.appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No consultations scheduled for today.</td>
                </tr>
              ) : (
                scheduleData.appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td style={{ fontWeight: '700' }}>{appt.startTime} - {appt.endTime}</td>
                    <td style={{ color: '#102D3A', fontWeight: '600' }}>{appt.referenceNumber}</td>
                    <td>{appt.patientProfileId?.fullName} ({appt.patientProfileId?.gender})</td>
                    <td>{appt.patientProfileId?.phone}</td>
                    <td>
                      <span className={`badge ${appt.type === 'consultation_tele' ? 'badge-info' : 'badge-neutral'}`}>
                        {appt.type === 'consultation_tele' ? 'Teleconsult' : 'In-Person'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td>
                      {appt.type === 'consultation_tele' ? (
                        <a
                          href={`/teleconsult/room/${appt._id}`}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                        >
                          <VideoIcon size={14} /> Launch Teleconsult
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#72848D' }}>OPD Room 4</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specialty Referral Inbox (Rural-to-City) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h4>Incoming Specialty Referrals Queue ({referrals.length})</h4>
          <span style={{ fontSize: '0.8125rem', color: '#72848D' }}>Filtered for {scheduleData?.doctor?.specialty}</span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Referral No</th>
                <th>Referring Hospital</th>
                <th>Patient</th>
                <th>Priority</th>
                <th>Clinical Summary</th>
                <th>Status</th>
                <th>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No pending incoming referrals.</td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref._id}>
                    <td style={{ fontWeight: '700' }}>{ref.referralNumber}</td>
                    <td>{ref.referringHospitalId?.name}</td>
                    <td>{ref.patientProfileId?.fullName}</td>
                    <td>
                      <span className={`badge ${ref.priority === 'CRITICAL' ? 'badge-danger' : ref.priority === 'URGENT' ? 'badge-warning' : 'badge-neutral'}`}>
                        {ref.priority}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.8125rem' }}>{ref.clinicalSummary}</td>
                    <td>
                      <StatusBadge status={ref.status} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {ref.status === 'SENT' && (
                        <button onClick={() => handleUpdateReferral(ref._id, 'receive')} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
                          Acknowledge
                        </button>
                      )}
                      {(ref.status === 'RECEIVED' || ref.status === 'UNDER_REVIEW') && (
                        <button onClick={() => handleUpdateReferral(ref._id, 'accept')} className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }}>
                          Accept Intake
                        </button>
                      )}
                      {ref.status === 'PATIENT_NOTIFIED' && (
                        <button onClick={() => handleUpdateReferral(ref._id, 'arrive')} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
                          Mark Arrived
                        </button>
                      )}
                      {ref.status === 'ARRIVED' && (
                        <button onClick={() => handleUpdateReferral(ref._id, 'complete')} className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }}>
                          Complete Care
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consent-Based Health Vault Document Viewer */}
      <div className="card">
        <div className="card-header">
          <div>
            <h4>Consent-Gated Patient Document Viewer</h4>
            <p style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
              Requires active, unexpired, and unrevoked patient consent. Instant 403 Forbidden is enforced upon patient revocation.
            </p>
          </div>
        </div>

        <form onSubmit={handleFetchRecords} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '400px' }}
            placeholder="Enter Patient Profile ID to verify consent"
            value={vaultPatientId}
            onChange={(e) => setVaultPatientId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-secondary">
            Verify Consent & Fetch Records
          </button>
        </form>

        {vaultError && (
          <div
            style={{
              backgroundColor: '#FDEEEE',
              color: '#A32828',
              padding: '12px 16px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #A32828'
            }}
          >
            <AlertTriangleIcon size={20} />
            <strong>{vaultError}</strong>
          </div>
        )}

        {patientRecords && (
          <div>
            <div style={{ backgroundColor: '#E8F5EE', padding: '10px 14px', borderRadius: '4px', color: '#1C744F', marginBottom: '14px', fontSize: '0.875rem' }}>
              <ShieldCheckIcon size={16} /> Active Consent Verified: Viewing {patientRecords.length} authorized document(s).
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Version</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patientRecords.map((rec) => (
                    <tr key={rec._id}>
                      <td style={{ fontWeight: '600' }}>{rec.title}</td>
                      <td style={{ textTransform: 'capitalize' }}>{rec.category.replace('_', ' ')}</td>
                      <td>{rec.fileName}</td>
                      <td>{(rec.fileSizeBytes / 1024).toFixed(1)} KB</td>
                      <td>v{rec.version}</td>
                      <td>
                        <button
                          onClick={() => handleRequestDownload(rec._id)}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          Request 60s Signed Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {signedDownloadUrl && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#EDF5F3', borderRadius: '6px', border: '1px solid #147D78' }}>
                <span style={{ fontSize: '0.8125rem', color: '#102D3A', fontWeight: '600' }}>
                  60-Second Ephemeral Download Stream:
                </span>{' '}
                <a
                  href={`http://localhost:5000${signedDownloadUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-secondary"
                  style={{ marginLeft: '10px' }}
                >
                  Download / View PDF File (60s Token)
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
