import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import {
  Bed,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  UserCheck,
  Send,
  Layers,
  History,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AdminConsolePage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beds'); // beds, slots, leave, referrals, audit
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
  const [servicesList, setServicesList] = useState([]);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('09:30');
  const [slotDoctorId, setSlotDoctorId] = useState('');
  const [slotServiceId, setSlotServiceId] = useState('');
  const [slotsTable, setSlotsTable] = useState([]);

  // Referrals & Audit
  const [referralsList, setReferralsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [msg, setMsg] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('just now');

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
        setLastUpdated('just now');
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

      // Load referrals queue for hospital admin
      try {
        const refRes = await api.get('/referrals');
        if (refRes.data.success) {
          setReferralsList(refRes.data.data || []);
        }
      } catch (e) {
        // Fallback or empty if not configured
      }
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
      setLastUpdated('just now');
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

  const handleUpdateReferral = async (referralId, action) => {
    try {
      await api.patch(`/referrals/${referralId}/${action}`, {});
      setMsg({ type: 'success', text: `Referral status updated: ${action}` });
      loadOverview();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error?.message || 'Action failed.' });
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Loading operations console...</p>
      </div>
    );
  }

  const tabsConfig = [
    { id: 'beds', label: 'Bed & ICU Capacity' },
    { id: 'slots', label: `Slots & Services (${slotsTable.length})` },
    { id: 'leave', label: 'Doctor Leave & Reassignment' },
    { id: 'referrals', label: `Referral Tracking (${referralsList.length})` },
    { id: 'audit', label: 'Operations Audit Trail' }
  ];

  return (
    <div className="main-content">
      <PageHeader
        title="Hospital Operations Console"
        subtitle={`Facility: ${overview?.hospital?.name || 'Medical Center'} | Multi-tenant isolated administrative control plane`}
        breadcrumbs={[
          { label: 'Administration', path: '/admin/console' },
          { label: 'Operations Console' }
        ]}
      />

      {/* Trust & Safety Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
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
          Verified Administrative Workspace &bull; <strong>Reported Capacity (Self-reported by facility)</strong>
        </span>
        <span>Last updated: {lastUpdated}</span>
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
                : 'var(--status-critical-bg)',
            color:
              msg.type === 'success'
                ? 'var(--status-success-text)'
                : 'var(--status-critical-text)',
            border: `1px solid ${
              msg.type === 'success'
                ? 'var(--status-success-accent)'
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

      {/* Clinical Metrics Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              General Beds Open
            </span>
            <Bed size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-heading)', marginTop: '8px', lineHeight: 1.1 }}>
            {overview?.hospital?.bedCapacity?.general?.available ?? 0}{' '}
            <span style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              / {overview?.hospital?.bedCapacity?.general?.total ?? 0}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Ward Occupancy: {overview?.hospital?.bedCapacity?.general?.total > 0 ? Math.round(((overview.hospital.bedCapacity.general.total - overview.hospital.bedCapacity.general.available) / overview.hospital.bedCapacity.general.total) * 100) : 0}%
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ICU Critical Care Beds
            </span>
            <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginTop: '8px',
              lineHeight: 1.1,
              color:
                (overview?.hospital?.bedCapacity?.icu?.available || 0) > 0
                  ? 'var(--status-success-text)'
                  : 'var(--status-critical-text)'
            }}
          >
            {overview?.hospital?.bedCapacity?.icu?.available ?? 0}{' '}
            <span style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              / {overview?.hospital?.bedCapacity?.icu?.total ?? 0}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Emergency Resuscitation &bull; Real-time
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Slots Booked
            </span>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-heading)', marginTop: '8px', lineHeight: 1.1 }}>
            {overview?.slots?.booked ?? 0}{' '}
            <span style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              / {overview?.slots?.total ?? 0}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Available slots: {overview?.slots?.available ?? 0}
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Referrals
            </span>
            <Send size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-warning-text)', marginTop: '8px', lineHeight: 1.1 }}>
            {overview?.pendingReferrals ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Active Doctor Leaves: {overview?.activeLeaves ?? 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Live Bed & ICU Capacity */}
      {activeTab === 'beds' && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            maxWidth: '680px',
            boxShadow: 'none'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Update Live Bed Availability
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Updates are broadcast in real time to the discovery engine and emergency triage dashboard.
            </p>
          </div>

          <form onSubmit={handleUpdateBeds}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  General Ward Total Beds
                </label>
                <Input
                  type="number"
                  value={genTotal}
                  onChange={(e) => setGenTotal(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  General Ward Available Beds
                </label>
                <Input
                  type="number"
                  value={genAvail}
                  onChange={(e) => setGenAvail(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  ICU Total Beds
                </label>
                <Input
                  type="number"
                  value={icuTotal}
                  onChange={(e) => setIcuTotal(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  ICU Available Beds
                </label>
                <Input
                  type="number"
                  value={icuAvail}
                  onChange={(e) => setIcuAvail(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="submit" variant="primary">
                Update Capacity & Broadcast
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Slots & Services */}
      {activeTab === 'slots' && (
        <div>
          {/* Create Slot Form */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: 'none'
            }}
          >
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Schedule New Appointment Slot
            </h4>
            <form
              onSubmit={handleCreateSlot}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto',
                gap: '12px',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  Service / Procedure
                </label>
                <Select
                  value={slotServiceId}
                  onChange={(e) => setSlotServiceId(e.target.value)}
                  options={servicesList.map((s) => ({ value: s._id, label: `${s.name} (₹${s.price})` }))}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  Date
                </label>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  Start Time
                </label>
                <Input
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  End Time
                </label>
                <Input
                  type="time"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Button type="submit" variant="primary">
                  Add Slot
                </Button>
              </div>
            </form>
          </div>

          {/* Slots Table */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 0,
              boxShadow: 'none',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Configured Appointment Slots ({slotsTable.length})
              </h4>
            </div>

            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Time Interval</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Service / Doctor</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Type</th>
                    <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsTable.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No slots configured. Use the form above to add an appointment window.
                      </td>
                    </tr>
                  ) : (
                    slotsTable.map((s) => (
                      <tr key={s._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)' }}>{s.date}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text)' }}>
                          {s.startTime} - {s.endTime}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)' }}>
                          {s.serviceId?.name || s.doctorId?.name || 'General Outpatient'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                          {s.type.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={s.status} />
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

      {/* Tab 3: Doctor Leave Announcer & Reassignment Monitor */}
      {activeTab === 'leave' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr)', gap: '20px' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              maxWidth: '680px',
              boxShadow: 'none'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Announce Doctor Leave & Trigger Reassignment
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Recording leave triggers interval-overlap detection on confirmed appointments and opens the two-choice resolution flow for affected patients.
              </p>
            </div>

            <form onSubmit={handleRecordLeave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                  Physician ID / Reference
                </label>
                <Input
                  type="text"
                  placeholder="Doctor Mongo ID or select"
                  value={leaveDoctorId}
                  onChange={(e) => setLeaveDoctorId(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                    Leave Start Date
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
                    Leave End Date
                  </label>
                  <Input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
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
                  placeholder="e.g. Emergency medical leave or conference attendance"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%' }}>
                Announce Leave & Trigger Reassignment Algorithm
              </Button>
            </form>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              maxWidth: '680px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-heading)', fontWeight: '700', fontSize: '0.875rem' }}>
              <ShieldAlert size={16} /> Patient Protection & Reassignment Protocol
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              When leave is entered, our atomic reassignment engine scans all scheduled consultations overlapping the start/end interval.
              Affected patients receive immediate portal alerts with options to: (1) Accept an equivalent doctor at the same hospital, or (2) Re-book at another hospital with prioritized booking.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Referral Tracking Queue */}
      {activeTab === 'referrals' && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 0,
            boxShadow: 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Hospital Referral Tracking Queue ({referralsList.length})
            </h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Cross-facility incoming and outgoing patient transfer pipeline
            </p>
          </div>

          <div className="table-container" style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Referral No</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Referring Facility</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patient</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Priority</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Summary</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {referralsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No active referrals recorded for this facility.
                    </td>
                  </tr>
                ) : (
                  referralsList.map((ref) => (
                    <tr key={ref._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {ref.referralNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)' }}>
                        {ref.referringHospitalId?.name || 'External Clinic'}
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
                            backgroundColor:
                              ref.priority === 'CRITICAL'
                                ? 'var(--status-critical-bg)'
                                : ref.priority === 'URGENT'
                                ? 'var(--status-warning-bg)'
                                : 'var(--bg-app)',
                            color:
                              ref.priority === 'CRITICAL'
                                ? 'var(--status-critical-text)'
                                : ref.priority === 'URGENT'
                                ? 'var(--status-warning-text)'
                                : 'var(--text)',
                            border: `1px solid ${
                              ref.priority === 'CRITICAL'
                                ? 'var(--status-critical-solid)'
                                : ref.priority === 'URGENT'
                                ? 'var(--status-warning-accent)'
                                : 'var(--border)'
                            }`
                          }}
                        >
                          {ref.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '280px', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Operations Audit Trail */}
      {activeTab === 'audit' && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 0,
            boxShadow: 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Operational Mutation Audit Trail (Recent 50 Events)
            </h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Append-only immutable record of administrative actions, bed updates, and slot mutations
            </p>
          </div>

          <div className="table-container" style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1, borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Event Type</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actor Role</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {log.eventType}
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.actorRole}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text)' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-badge)',
                            backgroundColor: 'var(--status-success-bg)',
                            color: 'var(--status-success-text)',
                            border: '1px solid var(--status-success-accent)'
                          }}
                        >
                          {log.status}
                        </span>
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
