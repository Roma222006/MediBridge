import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Lock,
  FileText
} from 'lucide-react';

export default function SuperAdminAuditLogsView({ onToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Audit Detail Modal
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterRole !== 'ALL') params.actorRole = filterRole;
      if (filterStatus !== 'ALL') params.status = filterStatus;

      const res = await api.get('/super-admin/audit-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('[Audit Logs] Error:', err);
      if (onToast) onToast('Failed to load platform audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filterRole, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/super-admin/audit-logs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medibridge_platform_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (onToast) onToast('Platform audit logs exported to CSV.');
    } catch (err) {
      console.error('[Audit Export] Error:', err);
      if (onToast) onToast('Failed to export audit logs.');
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
            Platform-Wide Audit Logs
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Tamper-evident, immutable transaction trail recording all administrative, clinical, and security actions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportCsv}
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
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchAuditLogs}
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #702B59)'
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, event type, resource, or justification..."
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 38px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              fontSize: '0.8125rem',
              color: 'var(--text, #29252A)',
              outline: 'none'
            }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Actor Role:</span>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              fontSize: '0.8125rem',
              color: 'var(--text, #29252A)',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="hospital_admin">Hospital Admin</option>
            <option value="doctor">Doctor</option>
            <option value="patient">Patient</option>
            <option value="system">System Autopilot</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Result:</span>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              fontSize: '0.8125rem',
              color: 'var(--text, #29252A)',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="ALL">All Outcomes</option>
            <option value="EXECUTED">Executed</option>
            <option value="ALLOWED">Allowed</option>
            <option value="DENIED">Denied</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border, #E8E3E5)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>TIMESTAMP</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>EVENT / ACTION</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>ACTOR</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>TENANT</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>RESOURCE TARGET</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)', textAlign: 'right' }}>INSPECT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    style={{
                      borderBottom: '1px solid var(--border, #E8E3E5)',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted, #702B59)' }}>
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.7rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                        {log.action || log.eventType}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', fontFamily: 'monospace' }}>
                        {log.eventType}
                      </div>
                    </td>

                    {/* Actor */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text, #29252A)' }}>
                        {log.actorId?.email || log.actorRole || 'system'}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          backgroundColor: '#F8DDE3',
                          color: '#702B59',
                          marginTop: '2px'
                        }}
                      >
                        {log.actorRole}
                      </span>
                    </td>

                    {/* Tenant */}
                    <td style={{ padding: '14px 16px', color: 'var(--text, #29252A)' }}>
                      {log.hospitalId?.name || 'Global Platform'}
                    </td>

                    {/* Resource Target */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--color-heading, #702B59)' }}>
                        {log.resourceType}
                      </span>
                      {log.resourceId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', fontFamily: 'monospace' }}>
                          ID: {log.resourceId}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          backgroundColor: log.status === 'DENIED' || log.status === 'FAILED' ? '#FEE2E2' : '#DCFCE7',
                          color: log.status === 'DENIED' || log.status === 'FAILED' ? '#B83245' : '#15803D'
                        }}
                      >
                        {log.status}
                      </span>
                    </td>

                    {/* Inspect Action */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAudit(log);
                          setShowDetailModal(true);
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #E8E3E5)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--color-heading, #702B59)',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            backgroundColor: '#FAF6F7',
            borderTop: '1px solid var(--border, #E8E3E5)',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #702B59)'
          }}
        >
          <span>Showing {logs.length} of {totalCount} platform audit records</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border, #E8E3E5)',
                backgroundColor: '#FFFFFF',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontWeight: '700' }}>Page {currentPage}</span>
            <button
              type="button"
              disabled={currentPage * pageSize >= totalCount}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border, #E8E3E5)',
                backgroundColor: '#FFFFFF',
                cursor: currentPage * pageSize >= totalCount ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          AUDIT INSPECTOR DETAIL MODAL (Scenario 6)
          ===================================================================== */}
      {showDetailModal && selectedAudit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  Audit Event Inspection
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)', marginTop: '2px', fontFamily: 'monospace' }}>
                  ID: {selectedAudit._id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#FAF6F7', padding: '14px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>EVENT TYPE:</span>
                  <div style={{ fontWeight: '700', color: 'var(--color-heading, #702B59)' }}>{selectedAudit.eventType}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>ACTION:</span>
                  <div style={{ fontWeight: '700', color: 'var(--text, #29252A)' }}>{selectedAudit.action}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>RESPONSIBLE ACTOR:</span>
                  <div style={{ color: 'var(--text, #29252A)' }}>{selectedAudit.actorId?.email || selectedAudit.actorRole} ({selectedAudit.actorRole})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>HOSPITAL TENANT:</span>
                  <div style={{ color: 'var(--text, #29252A)' }}>{selectedAudit.hospitalId?.name || 'Global Platform'}</div>
                </div>
              </div>

              {selectedAudit.reason && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1E40AF', display: 'block', marginBottom: '4px' }}>FORMAL JUSTIFICATION REASON</span>
                  <div style={{ color: '#1E40AF' }}>{selectedAudit.reason}</div>
                </div>
              )}

              {selectedAudit.metadata && Object.keys(selectedAudit.metadata).length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', display: 'block', marginBottom: '6px' }}>CHANGE METADATA & STATE TRANSITIONS</span>
                  <pre style={{ backgroundColor: '#1E1E1E', color: '#D4D4D4', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto' }}>
                    {JSON.stringify(selectedAudit.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '0.75rem', fontWeight: '700' }}>
                <ShieldCheck size={16} />
                <span>Cryptographically sealed record. Append-only retention enforced under DPDP Act 2023.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
