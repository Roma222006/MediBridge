import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import {
  Calendar,
  FileText,
  Shield,
  Activity,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Video,
  FileCheck,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function PatientDashboardPage() {
  const { user, activeProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pendingReassignments, setPendingReassignments] = useState([]);
  const [vaultRecords, setVaultRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments');
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
      setMsg({ type: 'success', text: `Reassignment resolved: ${choice.replace(/_/g, ' ')}` });
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
      setMsg({ type: 'success', text: 'Consent revoked immediately. Clinical access blocked.' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to revoke consent.' });
    }
  };

  const tabsConfig = [
    { id: 'appointments', label: 'My Appointments', count: appointments.length, icon: Calendar },
    { id: 'vault', label: 'Health Vault', count: vaultRecords.length, icon: FileText },
    { id: 'consents', label: 'Doctor Consents', count: consents.length, icon: Shield },
    { id: 'logs', label: 'Access Audit Logs', count: accessLogs.length, icon: Activity }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Patient Services', href: '/patient-dashboard' }, { label: 'Care Portal' }]}
        title="Patient Care Portal & Health Vault"
        subtitle={`Active Profile: ${activeProfile?.fullName || user?.name} (${activeProfile?.relationship || 'Self'}) • Family ID: ${activeProfile?._id || ''}`}
      />

      {/* Message Banner */}
      {msg && (
        <div
          className={msg.type === 'success' ? 'badge badge-success' : 'badge badge-danger'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            marginBottom: 'var(--space-4)',
            width: '100%',
            fontSize: 'var(--text-body-staff)',
            borderRadius: 'var(--radius-card)'
          }}
        >
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Prominent Doctor Leave & Reassignment Banner */}
      {pendingReassignments.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-accent)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 'var(--space-6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--status-warning-text)' }}>
            <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
            <h3 style={{ fontSize: 'var(--text-card)', color: 'var(--status-warning-text)', margin: 0 }}>
              Action Required: Attending Physician on Leave & Appointment Reassignment
            </h3>
          </div>
          <p style={{ margin: '8px 0 16px 0', fontSize: 'var(--text-body-staff)', color: 'var(--text)' }}>
            Your doctor has an unavoidable medical absence. MediBridge has preserved your slot with two certified options:
          </p>

          {pendingReassignments.map((appt) => (
            <div
              key={appt._id}
              style={{
                backgroundColor: 'var(--surface)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                marginBottom: 'var(--space-3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ color: 'var(--color-heading)' }}>Appointment {appt.referenceNumber}</strong> &bull; {appt.hospitalId?.name}
                  <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--text-muted)' }}>
                    Original Doctor: {appt.doctorId?.name} &bull; Scheduled: {appt.date} at {appt.startTime}
                  </div>
                </div>
                <StatusBadge status="REASSIGNMENT_PENDING" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                {/* Option 1: Suggested Specialist */}
                <div style={{ border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)', padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--color-heading)' }}>
                    Option 1: Suggested Specialist
                  </div>
                  <div style={{ fontSize: 'var(--text-label-md)', marginTop: '4px', color: 'var(--text)' }}>
                    {appt.reassignmentDetails?.suggestedDoctorId?.name || 'Dr. M. Revathi (Cardiology)'}
                  </div>
                  <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>
                    Slot: {appt.date} at 10:30 AM
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      handleResolveReassignment(
                        appt._id,
                        'SUGGESTED_DOCTOR',
                        appt.reassignmentDetails?.suggestedSlotId?._id || appt.reassignmentDetails?.suggestedSlotId
                      )
                    }
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Accept Specialist
                  </Button>
                </div>

                {/* Option 2: Same Doctor Reschedule */}
                <div style={{ border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)', padding: 'var(--space-3)', backgroundColor: 'var(--surface)' }}>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--color-heading)' }}>
                    Option 2: Same Doctor Next Date
                  </div>
                  <div style={{ fontSize: 'var(--text-label-md)', marginTop: '4px', color: 'var(--text)' }}>
                    Keep {appt.doctorId?.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>
                    Rescheduled to next available open OPD
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      handleResolveReassignment(
                        appt._id,
                        'SAME_DOCTOR_NEW_DATE',
                        appt.reassignmentDetails?.suggestedSlotId?._id || appt.reassignmentDetails?.suggestedSlotId
                      )
                    }
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Reschedule Same Doctor
                  </Button>
                </div>

                {/* Option 3: Urgent Emergency */}
                <div style={{ border: '1px solid var(--status-critical-bg)', borderRadius: 'var(--radius-control)', padding: 'var(--space-3)', backgroundColor: 'var(--status-critical-bg)' }}>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--status-critical-text)' }}>
                    Urgent / Emergency Case?
                  </div>
                  <div style={{ fontSize: 'var(--text-label)', marginTop: '4px', color: 'var(--status-critical-text)' }}>
                    Cancel routine visit and route directly to trauma triage.
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleResolveReassignment(appt._id, 'EMERGENCY_REDIRECT')}
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Emergency Redirect (108)
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

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
                  <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <p className="empty-state-message">No appointments booked yet.</p>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td style={{ fontWeight: '700', color: 'var(--color-heading)' }}>{appt.referenceNumber}</td>
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
                        <a
                          href={`/teleconsult/room/${appt._id}`}
                          className="btn btn-dense btn-primary"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Video size={13} strokeWidth={1.75} aria-hidden="true" />
                          <span>Join Teleconsult</span>
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
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-card)', marginBottom: 'var(--space-3)' }}>
              Upload Clinical Document to Health Vault
            </h3>
            <form onSubmit={handleFileUpload} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
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
                  style={{ paddingTop: '6px' }}
                />
              </div>

              <Button type="submit" variant="primary" loading={uploading} disabled={uploading} icon={Upload}>
                {uploading ? 'Validating...' : 'Upload File'}
              </Button>
            </form>
          </div>

          {/* Stored Records */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-card)', marginBottom: 'var(--space-3)' }}>
              Stored Clinical Documents
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document Title</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th>Size</th>
                    <th>SHA-256 Checksum</th>
                    <th>Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                        <p className="empty-state-message">No clinical documents in vault.</p>
                      </td>
                    </tr>
                  ) : (
                    vaultRecords.map((rec) => (
                      <tr key={rec._id}>
                        <td style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{rec.title}</td>
                        <td style={{ textTransform: 'capitalize' }}>{rec.category.replace('_', ' ')}</td>
                        <td>v{rec.version}</td>
                        <td>{(rec.fileSizeBytes / 1024).toFixed(1)} KB</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-label)' }}>
                          {rec.sha256Hash?.substring(0, 16)}...
                        </td>
                        <td>{new Date(rec.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ephemeral Consents */}
      {activeTab === 'consents' && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--text-card)', marginBottom: 'var(--space-3)' }}>
            Active & Ephemeral Doctor Consent Grants (24h Window)
          </h3>
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      <p className="empty-state-message">No active consent records.</p>
                    </td>
                  </tr>
                ) : (
                  consents.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{c.grantedToDoctorId?.name}</td>
                      <td>{c.grantedToHospitalId?.name || 'City Facility'}</td>
                      <td>{c.purpose}</td>
                      <td>{new Date(c.expiresAt).toLocaleString()}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        {c.status === 'ACTIVE' && (
                          <Button
                            variant="danger"
                            size="dense"
                            onClick={() => handleRevokeConsent(c._id)}
                          >
                            Revoke Now
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Patient Access History Log */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 'var(--text-card)', margin: 0 }}>
                Append-Only Patient Access History Log
              </h3>
              <p style={{ fontSize: 'var(--text-label-md)', marginTop: '2px', color: 'var(--text-muted)' }}>
                Complete legal audit trail of health record access events, purpose, exact timestamps, and access authorization decisions.
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
                  <th>Access Decision</th>
                  <th>Clinical Purpose / Denial Reason</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      <p className="empty-state-message">No access log events recorded yet.</p>
                    </td>
                  </tr>
                ) : (
                  accessLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: 'var(--text-label)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: 'var(--text-label)', fontWeight: '600' }}>{log.actorRole}</td>
                      <td style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{log.actorName || 'User'}</td>
                      <td style={{ fontSize: 'var(--text-label)' }}>{log.action}</td>
                      <td>
                        <span className={`badge ${log.accessGranted ? 'badge-success' : 'badge-danger'}`}>
                          {log.accessGranted ? 'ALLOWED' : 'DENIED'}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-label-md)' }}>
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
