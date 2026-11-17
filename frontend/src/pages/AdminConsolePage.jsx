import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { BedIcon, CalendarIcon, AlertTriangleIcon, CheckCircleIcon } from '../components/Icons';

export default function AdminConsolePage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beds'); // beds, leave, slots, audit
  const [genTotal, setGenTotal] = useState(0);
  const [genAvail, setGenAvail] = useState(0);
  const [icuTotal, setIcuTotal] = useState(0);
  const [icuAvail, setIcuAvail] = useState(0);

  // Leave Form
  const [leaveDoctorId, setLeaveDoctorId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Slots & Services
  const [doctorsList, setDoctorsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('09:30');
  const [slotDoctorId, setSlotDoctorId] = useState('');
  const [slotServiceId, setSlotServiceId] = useState('');
  const [slotsTable, setSlotsTable] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      if (res.data.success) {
        const d = res.data.data;
        setOverview(d);
        setGenTotal(d.hospital.bedCapacity.general.total);
        setGenAvail(d.hospital.bedCapacity.general.available);
        setIcuTotal(d.hospital.bedCapacity.icu.total);
        setIcuAvail(d.hospital.bedCapacity.icu.available);
      }

      const srvRes = await api.get('/admin/services');
      if (srvRes.data.success) {
        setServicesList(srvRes.data.data);
        if (srvRes.data.data.length > 0) setSlotServiceId(srvRes.data.data[0]._id);
      }

      const slRes = await api.get('/admin/slots');
      if (slRes.data.success) setSlotsTable(slRes.data.data);

      const audRes = await api.get('/admin/audit-logs');
      if (audRes.data.success) setAuditLogs(audRes.data.data);
    } catch (err) {
      console.error('[AdminConsole] Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/search/hospitals/${user.hospitalId}/bed-capacity`, {
        general: { total: Number(genTotal), available: Number(genAvail) },
        icu: { total: Number(icuTotal), available: Number(icuAvail) }
      });
      setMsg({ type: 'success', text: 'Bed and ICU capacity updated and broadcast live via Socket.IO.' });
      loadOverview();
    } catch (err) {
      setMsg({ type: 'error', text: 'Update failed: ' + err.message });
    }
  };

  const handleRecordLeave = async (e) => {
    e.preventDefault();
    if (!leaveDoctorId || !leaveReason) return;

    try {
      const res = await api.post('/reassignments/leave', {
        doctorId: leaveDoctorId,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason
      });

      setMsg({
        type: 'success',
        text: `Doctor leave recorded! Event: ${res.data.data.leave.eventId}. ${res.data.data.affectedAppointmentsCount} appointment(s) placed into REASSIGNMENT_PENDING.`
      });
      setLeaveReason('');
      loadOverview();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Failed to record leave.' });
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/slots', {
        serviceId: slotServiceId,
        doctorId: slotDoctorId || null,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime
      });
      setMsg({ type: 'success', text: 'Slot scheduled successfully.' });
      loadOverview();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Slot creation failed.' });
    }
  };

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>Loading operations console...</div>;
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h2>Hospital Operations Console</h2>
        <p style={{ marginTop: '4px' }}>
          Facility: <strong>{overview?.hospital?.name}</strong> &bull; Multi-tenant isolated administrative control plane.
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

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>General Beds Open</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#102D3A', marginTop: '4px' }}>
            {overview?.hospital?.bedCapacity?.general?.available} <span style={{ fontSize: '1rem', color: '#72848D' }}>/ {overview?.hospital?.bedCapacity?.general?.total}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>ICU Beds Open</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: overview?.hospital?.bedCapacity?.icu?.available > 0 ? '#1C744F' : '#A32828', marginTop: '4px' }}>
            {overview?.hospital?.bedCapacity?.icu?.available} <span style={{ fontSize: '1rem', color: '#72848D' }}>/ {overview?.hospital?.bedCapacity?.icu?.total}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>Today's Slots Booked</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#147D78', marginTop: '4px' }}>
            {overview?.slots?.booked} <span style={{ fontSize: '1rem', color: '#72848D' }}>/ {overview?.slots?.total}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>Pending Referrals</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#D5A45B', marginTop: '4px' }}>
            {overview?.pendingReferrals}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #DCE3E1', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('beds')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'beds' ? '#102D3A' : 'transparent',
            color: activeTab === 'beds' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Bed & ICU Capacity
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'leave' ? '#102D3A' : 'transparent',
            color: activeTab === 'leave' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Doctor Leave & Reassignment
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'slots' ? '#102D3A' : 'transparent',
            color: activeTab === 'slots' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Slot Scheduler ({slotsTable.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'audit' ? '#102D3A' : 'transparent',
            color: activeTab === 'audit' ? '#FFFFFF' : '#4A5B63',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Operations Audit Trail
        </button>
      </div>

      {/* Tab 1: Live Bed Capacity Updater */}
      {activeTab === 'beds' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h4 style={{ marginBottom: '16px' }}>Update Live Bed Availability</h4>
          <form onSubmit={handleUpdateBeds}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">General Ward Total Beds</label>
                <input
                  type="number"
                  className="form-input"
                  value={genTotal}
                  onChange={(e) => setGenTotal(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">General Ward Available Beds</label>
                <input
                  type="number"
                  className="form-input"
                  value={genAvail}
                  onChange={(e) => setGenAvail(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ICU Total Beds</label>
                <input
                  type="number"
                  className="form-input"
                  value={icuTotal}
                  onChange={(e) => setIcuTotal(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ICU Available Beds</label>
                <input
                  type="number"
                  className="form-input"
                  value={icuAvail}
                  onChange={(e) => setIcuAvail(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                Update Capacity & Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Doctor Leave Announcer */}
      {activeTab === 'leave' && (
        <div className="card" style={{ maxWidth: '650px' }}>
          <h4 style={{ marginBottom: '8px' }}>Announce Doctor Leave</h4>
          <p style={{ fontSize: '0.8125rem', marginBottom: '16px', color: '#72848D' }}>
            Recording leave triggers interval-overlap detection on confirmed appointments and opens the two-choice resolution flow for affected patients.
          </p>

          <form onSubmit={handleRecordLeave}>
            <div className="form-group">
              <label className="form-label">Physician ID / Reference</label>
              <input
                type="text"
                className="form-input"
                placeholder="Doctor Mongo ID or select"
                value={leaveDoctorId}
                onChange={(e) => setLeaveDoctorId(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Leave Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Leave End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Absence</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="e.g. Emergency medical leave or conference attendance"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Announce Leave & Trigger Reassignment Algorithm
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Slots Manager */}
      {activeTab === 'slots' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '12px' }}>Schedule New Appointment Slot</h4>
            <form onSubmit={handleCreateSlot} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Service / Procedure</label>
                <select
                  className="form-select"
                  value={slotServiceId}
                  onChange={(e) => setSlotServiceId(e.target.value)}
                  required
                >
                  {servicesList.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>
                Add Slot
              </button>
            </form>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Interval</th>
                  <th>Service / Doctor</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {slotsTable.map((s) => (
                  <tr key={s._id}>
                    <td>{s.date}</td>
                    <td style={{ fontWeight: '600' }}>{s.startTime} - {s.endTime}</td>
                    <td>{s.serviceId?.name || s.doctorId?.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.type.replace('_', ' ')}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="card">
          <h4 style={{ marginBottom: '12px' }}>Operational Mutation Audit Trail</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Actor Role</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{log.eventType}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{log.actorRole}</td>
                    <td>{log.action}</td>
                    <td>
                      <span className="badge badge-success">{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
