import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { FileTextIcon, AlertTriangleIcon, CheckCircleIcon, ShieldCheckIcon } from '../components/Icons';

export default function PatientDashboardPage() {
  const { user, activeProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pendingReassignments, setPendingReassignments] = useState([]);
  const [vaultRecords, setVaultRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, vault, logs
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('lab_report');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (user && activeProfile) {
      loadData();
    }
  }, [user, activeProfile]);

  const loadData = async () => {
    try {
      // 1. My Bookings
      const apptRes = await api.get('/bookings/my-bookings');
      if (apptRes.data.success) setAppointments(apptRes.data.data);

      // 2. Pending Reassignments
      const reassRes = await api.get('/reassignments/pending');
      if (reassRes.data.success) setPendingReassignments(reassRes.data.data);

      // 3. Vault records
      const vaultRes = await api.get(`/vault/records?patientProfileId=${activeProfile._id}`);
      if (vaultRes.data.success) setVaultRecords(vaultRes.data.data);

      // 4. Consents
      const consentRes = await api.get(`/vault/consents?patientProfileId=${activeProfile._id}`);
      if (consentRes.data.success) setConsents(consentRes.data.data);

      // 5. Access Logs
      const logRes = await api.get(`/vault/access-logs?patientProfileId=${activeProfile._id}`);
      if (logRes.data.success) setAccessLogs(logRes.data.data);
    } catch (err) {
      console.error('[PatientDashboard] Error loading data:', err.message);
    }
  };

  const handleResolveReassignment = async (appointmentId, choice, slotId) => {
    try {
      await api.post(`/reassignments/resolve/${appointmentId}`, {
        choice,
        replacementSlotId: slotId
      });
      setMsg({ type: 'success', text: `Reassignment successfully resolved with choice: ${choice}` });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Resolution failed.' });
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('category', uploadCategory);
    formData.append('patientProfileId', activeProfile._id);

    try {
      await api.post('/vault/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg({ type: 'success', text: 'Document uploaded securely to Health Vault.' });
      setUploadFile(null);
      setUploadTitle('');
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    try {
      await api.patch(`/vault/consent/${consentId}/revoke`, { reason: 'Patient initiated immediate revocation' });
      setMsg({ type: 'success', text: 'Consent revoked immediately. Doctor file access is now blocked.' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to revoke consent.' });
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '20px' }}>
        <h2>Patient Care Portal & Health Vault</h2>
        <p style={{ marginTop: '4px' }}>
          Active Profile: <strong>{activeProfile?.fullName}</strong> ({activeProfile?.relationship}) &bull; Manage appointments, consent permissions, and view append-only access history.
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

      {/* Prominent Doctor Leave & Reassignment Banner */}
      {pendingReassignments.length > 0 && (
        <div
          style={{
            backgroundColor: '#FAF3E6',
            border: '2px solid #D5A45B',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9E6B18' }}>
            <AlertTriangleIcon size={20} />
            <h3 style={{ fontSize: '1.125rem', color: '#9E6B18' }}>
              Action Required: Doctor Leave Announced & Reassignment Pending
            </h3>
          </div>
          <p style={{ margin: '8px 0 16px 0', fontSize: '0.875rem', color: '#102D3A' }}>
            Your attending physician has an unavoidable medical absence. MediBridge has atomically preserved your care schedule with two certified options:
          </p>

          {pendingReassignments.map((appt) => (
            <div key={appt._id} style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid #DCE3E1', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <strong>Appointment {appt.referenceNumber}</strong> &bull; {appt.hospitalId?.name}
                  <div style={{ fontSize: '0.8125rem', color: '#72848D' }}>
                    Original Doctor: {appt.doctorId?.name} &bull; Scheduled: {appt.date} at {appt.startTime}
                  </div>
                </div>
                <StatusBadge status="REASSIGNMENT_PENDING" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {/* Option 1: Suggested Specialist */}
                <div style={{ border: '1px solid #147D78', borderRadius: '6px', padding: '12px', backgroundColor: '#EDF5F3' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#147D78' }}>
                    Option 1: Suggested Specialist
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                    {appt.reassignmentDetails?.suggestedDoctorId?.name || 'Dr. M. Revathi (Cardiology)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>
                    Slot: {appt.date} at 10:30 AM
                  </div>
                  <button
                    onClick={() =>
                      handleResolveReassignment(
                        appt._id,
                        'SUGGESTED_DOCTOR',
                        appt.reassignmentDetails?.suggestedSlotId?._id || appt.reassignmentDetails?.suggestedSlotId
                      )
                    }
                    className="btn btn-sm btn-primary"
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Accept Specialist
                  </button>
                </div>

                {/* Option 2: Same Doctor Reschedule */}
                <div style={{ border: '1px solid #DCE3E1', borderRadius: '6px', padding: '12px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#102D3A' }}>
                    Option 2: Same Doctor Next Date
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                    Keep {appt.doctorId?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>
                    Rescheduled to next available open OPD
                  </div>
                  <button
                    onClick={() =>
                      handleResolveReassignment(
                        appt._id,
                        'SAME_DOCTOR_NEW_DATE',
                        appt.reassignmentDetails?.suggestedSlotId?._id || appt.reassignmentDetails?.suggestedSlotId
                      )
                    }
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Reschedule Same Doctor
                  </button>
                </div>

                {/* Option 3: Urgent Emergency */}
                <div style={{ border: '1px solid #A32828', borderRadius: '6px', padding: '12px', backgroundColor: '#FDEEEE' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#A32828' }}>
                    Emergency Case?
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#4A5B63' }}>
                    For acute symptoms, cancel routine visit and access direct trauma care.
                  </div>
                  <button
                    onClick={() => handleResolveReassignment(appt._id, 'EMERGENCY_REDIRECT')}
                    className="btn btn-sm btn-danger"
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Emergency Redirect (108)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #DCE3E1', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('appointments')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'appointments' ? '#102D3A' : 'transparent',
            color: activeTab === 'appointments' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          My Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'vault' ? '#102D3A' : 'transparent',
            color: activeTab === 'vault' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Health Vault & Consents ({vaultRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'logs' ? '#102D3A' : 'transparent',
            color: activeTab === 'logs' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Patient Access Log ({accessLogs.length})
        </button>
      </div>

      {/* Tab 1: Appointments Table */}
      {activeTab === 'appointments' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Patient</th>
                <th>Hospital / Facility</th>
                <th>Doctor / Procedure</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    No appointments booked yet.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td style={{ fontWeight: '700', color: '#102D3A' }}>{appt.referenceNumber}</td>
                    <td>{appt.patientProfileId?.fullName}</td>
                    <td>{appt.hospitalId?.name}</td>
                    <td>{appt.doctorId?.name || appt.serviceId?.name}</td>
                    <td>{appt.date} at {appt.startTime}</td>
                    <td style={{ textTransform: 'capitalize' }}>{appt.type.replace('_', ' ')}</td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td>
                      {appt.type === 'consultation_tele' && ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(appt.status) && (
                        <a href={`/teleconsult/room/${appt._id}`} className="btn btn-sm btn-primary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                          Join Teleconsult
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Health Vault */}
      {activeTab === 'vault' && (
        <div>
          {/* Upload Widget */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>Upload Clinical Document to Vault</h4>
            <form onSubmit={handleFileUpload} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MRI Brain Scan Report"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                >
                  <option value="radiology_scan">Radiology / MRI Scan</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="prescription">Prescription</option>
                  <option value="discharge_summary">Discharge Summary</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">File (PDF, JPG, PNG &le; 10MB)</label>
                <input
                  type="file"
                  className="form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" disabled={uploading} className="btn btn-primary" style={{ height: '38px' }}>
                {uploading ? 'Validating...' : 'Upload File'}
              </button>
            </form>
          </div>

          {/* Stored Records */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>Stored Clinical Documents</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document Title</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th>Size</th>
                    <th>SHA-256 Hash</th>
                    <th>Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No documents in vault.</td>
                    </tr>
                  ) : (
                    vaultRecords.map((rec) => (
                      <tr key={rec._id}>
                        <td style={{ fontWeight: '600' }}>{rec.title}</td>
                        <td style={{ textTransform: 'capitalize' }}>{rec.category.replace('_', ' ')}</td>
                        <td>v{rec.version}</td>
                        <td>{(rec.fileSizeBytes / 1024).toFixed(1)} KB</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{rec.sha256Hash?.substring(0, 16)}...</td>
                        <td>{new Date(rec.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Consents */}
          <div className="card">
            <h4 style={{ marginBottom: '12px' }}>Active & Ephemeral Doctor Consent Grants</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Hospital</th>
                    <th>Clinical Purpose</th>
                    <th>Expires At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No active consent records.</td>
                    </tr>
                  ) : (
                    consents.map((c) => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: '600' }}>{c.grantedToDoctorId?.name}</td>
                        <td>{c.grantedToHospitalId?.name || 'City Facility'}</td>
                        <td>{c.purpose}</td>
                        <td>{new Date(c.expiresAt).toLocaleString()}</td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td>
                          {c.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleRevokeConsent(c._id)}
                              className="btn btn-sm btn-danger"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            >
                              Revoke Now
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
        </div>
      )}

      {/* Tab 3: Patient Access History Log */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h4>Append-Only Patient Access History Log</h4>
              <p style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
                Complete legal audit trail of who accessed your health records, clinical purpose, exact timestamp, and whether access was granted or denied.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor Role</th>
                  <th>Actor Name</th>
                  <th>Action</th>
                  <th>Access Granted?</th>
                  <th>Clinical Purpose / Denial Reason</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No access log events recorded yet.</td>
                  </tr>
                ) : (
                  accessLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '600' }}>{log.actorRole}</td>
                      <td style={{ fontWeight: '600' }}>{log.actorName || 'User'}</td>
                      <td style={{ fontSize: '0.75rem' }}>{log.action}</td>
                      <td>
                        <span className={`badge ${log.accessGranted ? 'badge-success' : 'badge-danger'}`}>
                          {log.accessGranted ? 'ALLOWED' : 'DENIED'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {log.clinicalPurpose || log.denialReason || 'Standard verification'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
