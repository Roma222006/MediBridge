import React, { useState } from 'react';
import {
  Activity,
  PlusCircle,
  Search,
  Check,
  X,
  Clock,
  Layers,
  Wrench,
  Radio,
  FileText
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function DiagnosticServicesView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [diagnostics, setDiagnostics] = useState(() => {
    const saved = localStorage.getItem('medibridge_diagnostic_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'diag-1', name: '3T MRI Brain & Whole Spine', code: 'MOD-MRI-3T', equipment: 'Siemens Magnetom Vida 3T', department: 'Radiology', fee: 6500, dailyCapacity: 16, bookedToday: 11, turnaroundTime: '3 Hours', status: 'Operational' },
      { id: 'diag-2', name: '128-Slice Dual Source Cardiac CT Angio', code: 'MOD-CT-128', equipment: 'GE Revolution CT Scanner', department: 'Radiology', fee: 5200, dailyCapacity: 20, bookedToday: 14, turnaroundTime: '2 Hours', status: 'Operational' },
      { id: 'diag-3', name: 'Digital Full-Field Chest & Skeletal X-Ray', code: 'MOD-XRAY-DIG', equipment: 'Philips DuraDiagnost Digital', department: 'Radiology', fee: 800, dailyCapacity: 60, bookedToday: 42, turnaroundTime: '30 Mins', status: 'Operational' },
      { id: 'diag-4', name: '2D Color Doppler Echocardiogram', code: 'MOD-CARD-ECHO', equipment: 'Philips EPIQ 7C Cardiac Ultrasound', department: 'Cardiology', fee: 1800, dailyCapacity: 25, bookedToday: 19, turnaroundTime: '1 Hour', status: 'Operational' },
      { id: 'diag-5', name: 'Automated Clinical Biochemistry Panel', code: 'MOD-PATH-BIO', equipment: 'Roche Cobas 6000 Analyzer', department: 'Pathology Lab', fee: 1200, dailyCapacity: 200, bookedToday: 135, turnaroundTime: '4 Hours', status: 'Operational' },
      { id: 'diag-6', name: '4D High-Definition Obstetric & Abdominal USG', code: 'MOD-USG-4D', equipment: 'GE Voluson E10 Ultrasound', department: 'Radiology', fee: 1500, dailyCapacity: 30, bookedToday: 21, turnaroundTime: '1 Hour', status: 'Operational' },
      { id: 'diag-7', name: 'Spirometry & Pulmonary Function Test (PFT)', code: 'MOD-PFT-LUNG', equipment: 'Jaeger MasterScreen PFT', department: 'Pulmonology', fee: 950, dailyCapacity: 15, bookedToday: 6, turnaroundTime: '1 Hour', status: 'Calibrating' }
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDiag, setNewDiag] = useState({
    name: '',
    code: '',
    equipment: '',
    department: 'Radiology',
    fee: 2500,
    dailyCapacity: 20,
    turnaroundTime: '2 Hours'
  });

  const persistDiagnostics = (updated) => {
    setDiagnostics(updated);
    localStorage.setItem('medibridge_diagnostic_services', JSON.stringify(updated));
  };

  const handleToggleMaintenance = (id) => {
    const updated = diagnostics.map((d) => {
      if (d.id === id) {
        const nextStatus = d.status === 'Operational' ? 'Maintenance' : 'Operational';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    persistDiagnostics(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Equipment operational status updated and broadcasted to triage.'
      });
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `diag-${Date.now()}`,
      ...newDiag,
      bookedToday: 0,
      status: 'Operational'
    };
    const updated = [entry, ...diagnostics];
    persistDiagnostics(updated);
    setShowAddModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Diagnostic modality ${entry.name} registered and slots opened.`
      });
    }
  };

  const filtered = diagnostics.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || d.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Diagnostic Modalities & Imaging Center
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage diagnostic scan equipment, daily scan slot capacities, equipment calibration, and emergency scan readiness.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 22px',
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
          }}
        >
          <PlusCircle size={16} /> + Add Diagnostic Modality
        </button>
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
            placeholder="Search diagnostic scan, modality code, or hardware model..."
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
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
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
          <option value="All">All Departments ▾</option>
          <option value="Radiology">Radiology</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Pathology Lab">Pathology Lab</option>
          <option value="Pulmonology">Pulmonology</option>
        </select>

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
          <option value="All">All Equipment Statuses ▾</option>
          <option value="Operational">Operational</option>
          <option value="Calibrating">Calibrating</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Diagnostics Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Modality & Equipment</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Department</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Procedure Fee</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Capacity & Bookings</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Report TAT</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Hardware Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {d.equipment} &bull; <strong>{d.code}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)', fontWeight: '600' }}>
                    {d.department}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                      ₹{d.fee}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {d.bookedToday} / {d.dailyCapacity} Booked
                    </div>
                    <div style={{ width: '80px', height: '5px', backgroundColor: '#E8E3E5', borderRadius: '9999px', marginTop: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(d.bookedToday / d.dailyCapacity) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-primary)'
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                    {d.turnaroundTime}
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
                          d.status === 'Operational' ? '#DCFCE7' : d.status === 'Calibrating' ? '#FEF3C7' : '#FEE2E2',
                        color:
                          d.status === 'Operational' ? '#15803D' : d.status === 'Calibrating' ? '#B77A32' : '#B83245'
                      }}
                    >
                      ● {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(d.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--color-heading)',
                        cursor: 'pointer'
                      }}
                    >
                      {d.status === 'Operational' ? 'Schedule Service' : 'Mark Online'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Diagnostic Equipment Modality"
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Diagnostic Procedure Name</label>
              <input
                type="text"
                value={newDiag.name}
                onChange={(e) => setNewDiag({ ...newDiag, name: e.target.value })}
                placeholder="e.g. High-Resolution CT Chest (HRCT)"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Hardware Model</label>
                <input
                  type="text"
                  value={newDiag.equipment}
                  onChange={(e) => setNewDiag({ ...newDiag, equipment: e.target.value })}
                  placeholder="e.g. Siemens Somatom Force"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Department</label>
                <select
                  value={newDiag.department}
                  onChange={(e) => setNewDiag({ ...newDiag, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="Radiology">Radiology</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pathology Lab">Pathology Lab</option>
                  <option value="Pulmonology">Pulmonology</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Modality Code</label>
                <input
                  type="text"
                  value={newDiag.code}
                  onChange={(e) => setNewDiag({ ...newDiag, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MOD-HRCT"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Procedure Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newDiag.fee}
                  onChange={(e) => setNewDiag({ ...newDiag, fee: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Daily Scan Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={newDiag.dailyCapacity}
                  onChange={(e) => setNewDiag({ ...newDiag, dailyCapacity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Add Equipment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
