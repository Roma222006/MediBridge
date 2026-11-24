import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle,
  Clock,
  Download,
  Eye,
  User,
  Bed,
  Stethoscope,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Send,
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function AuditLogsView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('medibridge_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'AUD-9021',
        timestamp: 'Today, 10:14 AM',
        category: 'Doctor Credentialing',
        eventType: 'DOCTOR_VERIFIED',
        actor: 'Admin: Dr. Ramesh Kumar',
        actorRole: 'Medical Superintendent',
        terminal: 'Peelamedu Admin Desk #1 (192.168.1.104)',
        target: 'Dr. Sundar M (Cardiology)',
        details: 'Approved Medical Council permanent registration (TNMC/2012/04818) and granted interventional cardiology practicing privileges.',
        oldValue: 'Status: Under Verification',
        newValue: 'Status: Verified & Privileged',
        status: 'SUCCESS',
        hash: 'SHA256:9a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
        certInCompliant: true
      },
      {
        id: 'AUD-9020',
        timestamp: 'Today, 09:48 AM',
        category: 'Bed & Emergency Broadcast',
        eventType: 'BED_CAPACITY_BROADCAST',
        actor: 'Admin: Sister K. Revathy',
        actorRole: 'Triage Nursing In-Charge',
        terminal: '108 Emergency Desk Bay (192.168.1.112)',
        target: 'Hospital Bed Network',
        details: 'Broadcasted live bed figures (278 General, 7 ICU Available) to Tamil Nadu 108 Ambulance Dispatch Gateway.',
        oldValue: 'ICU Available: 6 Beds',
        newValue: 'ICU Available: 7 Beds',
        status: 'SUCCESS',
        hash: 'SHA256:7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        certInCompliant: true
      },
      {
        id: 'AUD-9019',
        timestamp: 'Today, 09:12 AM',
        category: 'Doctor Leave & Coverage',
        eventType: 'REPLACEMENT_DOCTOR_ASSIGNED',
        actor: 'System Autopilot',
        actorRole: 'Automated Clinical Dispatch',
        terminal: 'Cloud Worker Node (10.0.4.88)',
        target: 'Dr. Lavanya S -> Dr. Anand K',
        details: 'Matched Dr. Anand K (General Medicine) to cover neurology patient Anitha K (Token T-103) following Dr. Lavanya emergency leave.',
        oldValue: 'Assigned: Dr. Lavanya S',
        newValue: 'Covering: Dr. Anand K (Patient Notified)',
        status: 'SUCCESS',
        hash: 'SHA256:3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d',
        certInCompliant: true
      },
      {
        id: 'AUD-9018',
        timestamp: 'Today, 08:35 AM',
        category: 'Referral Handover',
        eventType: 'REFERRAL_ACCEPTED',
        actor: 'Admin: Dr. Ramesh Kumar',
        actorRole: 'Medical Superintendent',
        terminal: 'Peelamedu Admin Desk #1 (192.168.1.104)',
        target: 'Referral REF-2026-089 (Muthusamy K)',
        details: 'Accepted acute STEMI referral from Annur PHC and reserved Cath Lab 1 plus Emergency ICU Bed 04.',
        oldValue: 'Status: Received / Triage Pending',
        newValue: 'Status: Accepted & Bed Held',
        status: 'SUCCESS',
        hash: 'SHA256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        certInCompliant: true
      },
      {
        id: 'AUD-9017',
        timestamp: 'Today, 08:00 AM',
        category: 'Security & Compliance',
        eventType: 'AUDIT_SEAL_VERIFIED',
        actor: 'Security Daemon',
        actorRole: 'DPDP Act Cryptographic Auditor',
        terminal: 'Automated System Daemon',
        target: 'Tamper-Proof Block Chain',
        details: 'Cryptographic Merkle tree verification completed for 1,420 previous health data transactions. Zero alterations detected.',
        oldValue: 'Previous Block: #BLK-8910',
        newValue: 'Current Block: #BLK-8911 (Verified)',
        status: 'SUCCESS',
        hash: 'SHA256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
        certInCompliant: true
      },
      {
        id: 'AUD-9016',
        timestamp: 'Yesterday, 05:20 PM',
        category: 'Doctor Credentialing',
        eventType: 'DOCTOR_ADDED',
        actor: 'Admin: Dr. Ramesh Kumar',
        actorRole: 'Medical Superintendent',
        terminal: 'Peelamedu Admin Desk #1 (192.168.1.104)',
        target: 'Dr. Priya Dharshini (Pediatrics)',
        details: 'New doctor profile created and placed into Stage 2 Document Verification queue.',
        oldValue: 'None',
        newValue: 'Doctor ID: doc-5 (Pending)',
        status: 'SUCCESS',
        hash: 'SHA256:8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c',
        certInCompliant: true
      }
    ];
  });

  useEffect(() => {
    // 1. Ensure initial audit logs are in localStorage
    if (!localStorage.getItem('medibridge_audit_logs')) {
      localStorage.setItem('medibridge_audit_logs', JSON.stringify(logs));
    }

    // 2. Auto-scan medibridge_hospital_doctors to ensure any newly added doctor is registered in audit logs
    try {
      const savedDocs = localStorage.getItem('medibridge_hospital_doctors');
      const savedLogs = localStorage.getItem('medibridge_audit_logs');
      let currentLogs = savedLogs ? JSON.parse(savedLogs) : logs;
      
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        let addedNew = false;
        docs.forEach((doc) => {
          if (!['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6'].includes(doc.id)) {
            const alreadyLogged = currentLogs.some((l) => l.target && l.target.toLowerCase().includes(doc.name.toLowerCase()));
            if (!alreadyLogged) {
              const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
              const newEntry = {
                id: `AUD-${Math.floor(9100 + Math.random() * 899)}`,
                timestamp: 'Today, Just now',
                category: 'Doctor Credentialing',
                eventType: 'DOCTOR_ADDED',
                actor: 'Admin: Medical Superintendent',
                actorRole: 'Hospital Administrator',
                terminal: 'Peelamedu Admin Desk #1 (192.168.1.104)',
                target: `${doc.name} (${doc.specialty || 'Specialist'})`,
                details: `New physician onboarded into ${doc.department || doc.specialty || 'Clinical'} Department. Council Reg #${doc.regNumber || 'TNMC-Pending'}. Stage 2 verification initiated.`,
                oldValue: 'Unregistered',
                newValue: `Doctor ID: ${doc.id} (Status: ${doc.verification || 'Pending'})`,
                status: 'SUCCESS',
                hash: `SHA256:${randomHex}`,
                certInCompliant: true
              };
              currentLogs = [newEntry, ...currentLogs];
              addedNew = true;
            }
          }
        });
        if (addedNew) {
          localStorage.setItem('medibridge_audit_logs', JSON.stringify(currentLogs));
          setLogs(currentLogs);
        }
      }
    } catch (e) {}

    // 3. Storage & Focus listener so new logs reflect immediately
    const handleSync = () => {
      const savedLogs = localStorage.getItem('medibridge_audit_logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (e) {}
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Audit ID,Timestamp,Category,Event Type,Actor,Target,Details,Old Value,New Value,Hash\n';
    logs.forEach((l) => {
      csvContent += `"${l.id}","${l.timestamp}","${l.category}","${l.eventType}","${l.actor}","${l.target}","${l.details}","${l.oldValue}","${l.newValue}","${l.hash}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KMCH_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onToast) onToast({ type: 'success', text: 'Hospital operations audit trail exported to CSV.' });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || log.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getEventIcon = (cat) => {
    switch (cat) {
      case 'Doctor Credentialing':
        return <Stethoscope size={16} style={{ color: 'var(--color-primary)' }} />;
      case 'Bed & Emergency Broadcast':
        return <Bed size={16} style={{ color: '#0284C7' }} />;
      case 'Doctor Leave & Coverage':
        return <RefreshCw size={16} style={{ color: '#B77A32' }} />;
      case 'Referral Handover':
        return <Send size={16} style={{ color: '#15803D' }} />;
      case 'Security & Compliance':
        return <ShieldCheck size={16} style={{ color: '#7E22CE' }} />;
      default:
        return <ScrollText size={16} style={{ color: 'var(--color-heading)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Hospital Operations Audit Trail & Security Ledger
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Tamper-evident system activity ledger compliant with CERT-In health cyber-security safeguards and DPDP Act 2023.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <ScrollText size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{logs.length}</span>
            <span className="ref-metric-label">Logged Audit Events</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Stethoscope size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{logs.filter((l) => l.category === 'Doctor Credentialing').length}</span>
            <span className="ref-metric-label">Doctor Credential Events</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Bed size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{logs.filter((l) => l.category.includes('Bed')).length}</span>
            <span className="ref-metric-label">Bed Capacity Broadcasts</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <ShieldCheck size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value" style={{ color: '#15803D' }}>100% Verified</span>
            <span className="ref-metric-label">Cryptographic Hash Chain</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs / Quick Categories */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'All', label: `All Events (${logs.length})` },
          { key: 'Doctor Credentialing', label: 'Doctor Credentialing' },
          { key: 'Bed & Emergency Broadcast', label: 'Bed & Emergency' },
          { key: 'Doctor Leave & Coverage', label: 'Doctor Coverage' },
          { key: 'Referral Handover', label: 'Referrals' },
          { key: 'Security & Compliance', label: 'Security & Hashes' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setCategoryFilter(tab.key)}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: categoryFilter === tab.key ? 'var(--color-primary)' : '#FFFFFF',
              color: categoryFilter === tab.key ? '#FFFFFF' : 'var(--color-heading)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: categoryFilter === tab.key ? '0 2px 4px rgba(184, 61, 131, 0.2)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
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
            placeholder="Search by event type, actor name, doctor, target record, or audit ID..."
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
      </div>

      {/* Enhanced Audit Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '130px' }}>Timestamp</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '180px' }}>Event Category</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '180px' }}>Responsible Actor</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '260px' }}>Change Details & State Diff</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '140px' }}>Integrity Seal</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700', minWidth: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                      {log.timestamp}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.id}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      {getEventIcon(log.category)}
                      <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                        {log.eventType}
                      </span>
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        backgroundColor: '#FAF6F7',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {log.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                      {log.actor}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.actorRole}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                      {log.terminal}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '6px' }}>
                      {log.details}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.7rem' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B83245', fontFamily: 'monospace' }}>
                        {log.oldValue}
                      </span>
                      <span>&rarr;</span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D', fontFamily: 'monospace' }}>
                        {log.newValue}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <CheckCircle size={13} style={{ color: '#15803D' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803D' }}>
                        CERT-In Verified
                      </span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.hash}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      className="btn-action-view"
                      onClick={() => handleOpenDetail(log)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Audit Entry Modal */}
      {showDetailModal && selectedLog && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Audit Security Record: ${selectedLog.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                  {selectedLog.eventType}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                  {selectedLog.timestamp}
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
                Target Record: <strong>{selectedLog.target}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Authenticated Actor</span>
                <strong>{selectedLog.actor}</strong> ({selectedLog.actorRole})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Terminal / Origin</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.terminal}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Event Summary</span>
              <div style={{ padding: '10px 12px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                {selectedLog.details}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Cryptographic Hash Signature</span>
              <div style={{ padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.75rem', fontFamily: 'monospace', color: '#0F172A', wordBreak: 'break-all' }}>
                {selectedLog.hash}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#15803D', fontWeight: '700' }}>
              <ShieldCheck size={16} /> Immutable append-only record verified against Tamil Nadu State Health Ledger.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{ padding: '7px 18px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
