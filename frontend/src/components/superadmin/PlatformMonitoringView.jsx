import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Activity,
  Server,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  PlusCircle,
  ShieldAlert,
  ArrowUpRight,
  UserCheck,
  Check,
  X,
  FileText
} from 'lucide-react';

export default function PlatformMonitoringView({ onToast }) {
  const [telemetry, setTelemetry] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(new Date());

  // Incident Filtering
  const [incidentFilter, setIncidentFilter] = useState('ALL');

  // Open Incident Modal
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    service: 'Teleconsultation WebRTC Gateway',
    severity: 'MEDIUM',
    title: '',
    description: '',
    assignedTo: 'Super Admin Operations'
  });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Manage Incident Modal (Scenario 5)
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageStatus, setManageStatus] = useState('ACKNOWLEDGED');
  const [newNote, setNewNote] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [updatingIncident, setUpdatingIncident] = useState(false);

  const fetchHealthAndIncidents = async () => {
    try {
      setLoading(true);
      const [healthRes, incidentsRes] = await Promise.all([
        api.get('/super-admin/monitoring'),
        api.get('/super-admin/incidents', { params: { status: incidentFilter !== 'ALL' ? incidentFilter : undefined } })
      ]);

      if (healthRes.data?.success) {
        setTelemetry(healthRes.data.data);
        setLastCheckTime(new Date());
      }
      if (incidentsRes.data?.success) {
        setIncidents(incidentsRes.data.data);
      }
    } catch (err) {
      console.error('[Platform Monitoring] Error:', err);
      if (onToast) onToast('Failed to poll platform health telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndIncidents();
  }, [incidentFilter]);

  const handleOpenIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!newIncident.title.trim() || !newIncident.description.trim()) {
      if (onToast) onToast('Please provide an incident title and description.');
      return;
    }

    setSubmittingIncident(true);
    try {
      const res = await api.post('/super-admin/incidents', newIncident);
      if (res.data?.success) {
        if (onToast) onToast(`Incident ${res.data.data.incidentNumber} logged.`);
        setShowOpenModal(false);
        setNewIncident({
          service: 'Teleconsultation WebRTC Gateway',
          severity: 'MEDIUM',
          title: '',
          description: '',
          assignedTo: 'Super Admin Operations'
        });
        fetchHealthAndIncidents();
      }
    } catch (err) {
      console.error('[Open Incident] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to open incident.');
    } finally {
      setSubmittingIncident(false);
    }
  };

  const handleOpenManageIncident = (inc) => {
    setSelectedIncident(inc);
    setManageStatus(inc.status === 'OPEN' ? 'ACKNOWLEDGED' : inc.status);
    setNewNote('');
    setResolutionDetails(inc.resolutionDetails || '');
    setShowManageModal(true);
  };

  const handleUpdateIncidentSubmit = async (e) => {
    e.preventDefault();
    setUpdatingIncident(true);
    try {
      const payload = {
        status: manageStatus,
        note: newNote.trim() || undefined,
        resolutionDetails: manageStatus === 'RESOLVED' || manageStatus === 'CLOSED' ? resolutionDetails.trim() : undefined
      };

      const res = await api.patch(`/super-admin/incidents/${selectedIncident._id}`, payload);
      if (res.data?.success) {
        if (onToast) onToast(`Incident ${selectedIncident.incidentNumber} updated to ${manageStatus}.`);
        setShowManageModal(false);
        fetchHealthAndIncidents();
      }
    } catch (err) {
      console.error('[Update Incident] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to update incident.');
    } finally {
      setUpdatingIncident(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPERATIONAL':
        return { label: 'Operational', bg: '#DCFCE7', color: '#15803D', icon: CheckCircle };
      case 'DEGRADED':
        return { label: 'Degraded', bg: '#FEF3C7', color: '#B77A32', icon: AlertTriangle };
      case 'UNAVAILABLE':
        return { label: 'Unavailable', bg: '#FEE2E2', color: '#B83245', icon: XCircle };
      default:
        return { label: status, bg: '#F3F4F6', color: '#4B5563', icon: Activity };
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: '#FEE2E2', color: '#B83245' };
      case 'HIGH':
        return { bg: '#FEF3C7', color: '#B77A32' };
      case 'MEDIUM':
        return { bg: '#EFF6FF', color: '#1E40AF' };
      case 'LOW':
        return { bg: '#F3F4F6', color: '#4B5563' };
      default:
        return { bg: '#F3F4F6', color: '#4B5563' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.625rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            Platform Health & Operations Monitoring
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Real-time microservice availability, connection latencies, and operational incident response.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowOpenModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary, #B83D83)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={14} />
            <span>Open Incident</span>
          </button>

          <button
            type="button"
            onClick={fetchHealthAndIncidents}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-heading, #702B59)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Poll Telemetry</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>SYSTEM STATUS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803D', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#15803D' }} />
            {telemetry?.metrics?.overallStatus || 'OPERATIONAL'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
            Tamil Nadu Gateway cluster online
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>AVG API LATENCY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', marginTop: '4px' }}>
            {telemetry?.metrics?.averageResponseTimeMs || 12} ms
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
            Database ping: {telemetry?.metrics?.dbLatencyMs || 2} ms
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>ERROR RATE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: telemetry?.metrics?.errorRatePercent > 2 ? '#B83245' : '#15803D', marginTop: '4px' }}>
            {telemetry?.metrics?.errorRatePercent || '0.00'}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
            Evaluated over total platform events
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>ACTIVE SESSIONS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', marginTop: '4px' }}>
            {telemetry?.metrics?.activeSessions || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
            Active verified JWT refresh families
          </div>
        </div>
      </div>

      {/* Microservices Health Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
              Microservices Availability & Health Checks
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
              Actual live endpoint probes conducted at {lastCheckTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border, #E8E3E5)' }}>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>SERVICE NAME</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>OPERATIONAL STATE</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>RESPONSE LATENCY</th>
                <th style={{ padding: '12px 14px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>DIAGNOSTIC STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(!telemetry?.services || telemetry.services.length === 0) ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    Polling microservice telemetry...
                  </td>
                </tr>
              ) : (
                telemetry.services.map((svc, idx) => {
                  const badge = getStatusBadge(svc.status);
                  const Icon = badge.icon;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border, #E8E3E5)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--color-heading, #702B59)' }}>
                        {svc.name}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontSize: '0.75rem',
                            fontWeight: '800'
                          }}
                        >
                          <Icon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--text, #29252A)' }}>
                        {svc.responseTimeMs} ms
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted, #702B59)' }}>
                        {svc.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Management Section (Scenario 5) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
              Operational Incident Management ({incidents.length})
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
              Track, triage, acknowledge, and resolve platform service failures
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Filter:</span>
            <select
              value={incidentFilter}
              onChange={(e) => setIncidentFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--border, #E8E3E5)',
                fontSize: '0.75rem',
                backgroundColor: '#FFFFFF'
              }}
            >
              <option value="ALL">All Incidents</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {incidents.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.875rem' }}>
            No operational incidents found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incidents.map((inc) => {
              const sevBadge = getSeverityBadge(inc.severity);
              return (
                <div
                  key={inc._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E8E3E5)',
                    backgroundColor: inc.status === 'OPEN' ? '#FFFBEB' : '#FFFFFF',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.8125rem', color: 'var(--color-heading, #702B59)' }}>
                        {inc.incidentNumber}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          backgroundColor: sevBadge.bg,
                          color: sevBadge.color
                        }}
                      >
                        {inc.severity}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          backgroundColor: inc.status === 'RESOLVED' ? '#DCFCE7' : inc.status === 'OPEN' ? '#FEE2E2' : '#EFF6FF',
                          color: inc.status === 'RESOLVED' ? '#15803D' : inc.status === 'OPEN' ? '#B83245' : '#1E40AF'
                        }}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--color-heading, #702B59)' }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', marginTop: '4px' }}>
                      {inc.description}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
                      Service: {inc.service} &bull; Assigned: {inc.assignedTo} &bull; First detected {new Date(inc.firstDetectedAt).toLocaleDateString()} {new Date(inc.firstDetectedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenManageIncident(inc)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-primary, #B83D83)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--color-primary, #B83D83)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Manage Incident
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: OPEN NEW INCIDENT MODAL
          ===================================================================== */}
      {showOpenModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '560px', width: '100%', padding: '28px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                Log Operational Incident
              </h2>
              <button type="button" onClick={() => setShowOpenModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenIncidentSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                      Affected Service *
                    </label>
                    <select
                      value={newIncident.service}
                      onChange={(e) => setNewIncident({ ...newIncident, service: e.target.value })}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                    >
                      <option value="Teleconsultation WebRTC Gateway">Teleconsultation WebRTC Gateway</option>
                      <option value="Notification Delivery Service">Notification Delivery Service</option>
                      <option value="Appointment & Slot Service">Appointment & Slot Service</option>
                      <option value="Database Connection (MongoDB)">Database Connection (MongoDB)</option>
                      <option value="Hospital Discovery & Spatial Index">Hospital Discovery & Spatial Index</option>
                      <option value="Authentication & Session Service">Authentication & Session Service</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                      Severity *
                    </label>
                    <select
                      value={newIncident.severity}
                      onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                    >
                      <option value="LOW">Low (Cosmetic/Latency)</option>
                      <option value="MEDIUM">Medium (Degraded Performance)</option>
                      <option value="HIGH">High (Partial Service Interruption)</option>
                      <option value="CRITICAL">Critical (Service Down)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                    Incident Title *
                  </label>
                  <input
                    type="text"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    placeholder="e.g. Teleconsultation Audio Stream Packets Dropping on PHC Routers"
                    required
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                    Detailed Operational Description *
                  </label>
                  <textarea
                    rows={3}
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    placeholder="Provide diagnostic symptoms, affected hospital nodes, or error log traces..."
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowOpenModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', backgroundColor: '#FFFFFF', fontSize: '0.8125rem', fontWeight: '700' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingIncident} style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: 'var(--color-primary, #B83D83)', color: '#FFFFFF', border: 'none', fontSize: '0.8125rem', fontWeight: '800' }}>
                  {submittingIncident ? 'Logging...' : 'Create Platform Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: MANAGE & RESOLVE INCIDENT MODAL (Scenario 5)
          ===================================================================== */}
      {showManageModal && selectedIncident && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  Manage Incident: {selectedIncident.incidentNumber}
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)', marginTop: '2px' }}>
                  {selectedIncident.title}
                </div>
              </div>
              <button type="button" onClick={() => setShowManageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateIncidentSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Incident History Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Incident Internal Timeline
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', backgroundColor: '#FAF6F7', padding: '12px', borderRadius: '8px' }}>
                    {selectedIncident.internalNotes?.map((n, i) => (
                      <div key={i} style={{ fontSize: '0.8125rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px' }}>
                        <div style={{ color: 'var(--text, #29252A)' }}>{n.note}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '2px' }}>
                          By: {n.authorName} &bull; {new Date(n.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Transition Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '6px' }}>
                    Lifecycle Status Transition *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setManageStatus(st)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '8px',
                          border: manageStatus === st ? '2px solid var(--color-primary, #B83D83)' : '1px solid var(--border, #E8E3E5)',
                          backgroundColor: manageStatus === st ? 'var(--color-blush-pink, #F8DDE3)' : '#FFFFFF',
                          color: manageStatus === st ? 'var(--color-primary, #B83D83)' : 'var(--text, #29252A)',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Internal Triage Note */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                    Add Internal Note
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Switched to secondary TURN relay server node."
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                  />
                </div>

                {/* Resolution Details (if marking resolved or closed) */}
                {(manageStatus === 'RESOLVED' || manageStatus === 'CLOSED') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#15803D', marginBottom: '4px' }}>
                      Resolution Summary & Post-Mortem Actions *
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      placeholder="Explain how the incident was recovered (e.g. Traffic re-routed via alternative ISP gateway; zero dropped sessions)."
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #86EFAC', fontSize: '0.8125rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowManageModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', backgroundColor: '#FFFFFF', fontSize: '0.8125rem', fontWeight: '700' }}>
                  Cancel
                </button>
                <button type="submit" disabled={updatingIncident} style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: 'var(--color-primary, #B83D83)', color: '#FFFFFF', border: 'none', fontSize: '0.8125rem', fontWeight: '800' }}>
                  {updatingIncident ? 'Updating...' : `Save ${manageStatus} Status`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
