import React, { useState } from 'react';
import {
  Layers,
  Users,
  Building2,
  PlusCircle,
  Search,
  Check,
  X,
  Edit2,
  Stethoscope,
  Activity,
  Bed
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function DepartmentManagementView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_departments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'dept-1', name: 'Cardiology & Cardiac Surgery', code: 'CARD', hod: 'Dr. Sundar M', totalDoctors: 8, totalBeds: 45, icuBeds: 12, opdRooms: '201 - 208', status: 'Active' },
      { id: 'dept-2', name: 'Neurology & Neuro Surgery', code: 'NEUR', hod: 'Dr. Lavanya S', totalDoctors: 5, totalBeds: 30, icuBeds: 6, opdRooms: '301 - 305', status: 'Active' },
      { id: 'dept-3', name: 'Orthopedics & Joint Replacement', code: 'ORTH', hod: 'Dr. Prakash R', totalDoctors: 7, totalBeds: 40, icuBeds: 4, opdRooms: '107 - 112', status: 'Active' },
      { id: 'dept-4', name: 'General Medicine & Diabetology', code: 'GMED', hod: 'Dr. Anand K', totalDoctors: 12, totalBeds: 60, icuBeds: 8, opdRooms: '101 - 106', status: 'Active' },
      { id: 'dept-5', name: 'Pediatrics & Neonatal Intensive Care', code: 'PEDI', hod: 'Dr. Priya Dharshini', totalDoctors: 6, totalBeds: 35, icuBeds: 10, opdRooms: '115 - 118', status: 'Active' },
      { id: 'dept-6', name: 'Emergency & Critical Care Trauma', code: 'EMER', hod: 'Dr. V. Rajesh', totalDoctors: 10, totalBeds: 25, icuBeds: 15, opdRooms: 'Ground Floor Triage', status: 'Active' },
      { id: 'dept-7', name: 'Radiology & Imaging Sciences', code: 'RADI', hod: 'Dr. S. Ramanathan', totalDoctors: 4, totalBeds: 0, icuBeds: 0, opdRooms: 'Diagnostic Wing A', status: 'Active' },
      { id: 'dept-8', name: 'Medical & Surgical Oncology', code: 'ONCO', hod: 'Dr. K. Venkataraman', totalDoctors: 5, totalBeds: 32, icuBeds: 4, opdRooms: '401 - 404', status: 'Active' }
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    hod: 'Dr. Sundar M',
    totalDoctors: 4,
    totalBeds: 20,
    icuBeds: 4,
    opdRooms: 'OPD Wing C'
  });

  const persistDepartments = (updated) => {
    setDepartments(updated);
    localStorage.setItem('medibridge_hospital_departments', JSON.stringify(updated));
  };

  const handleToggleStatus = (id) => {
    const updated = departments.map((d) => {
      if (d.id === id) {
        return { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return d;
    });
    persistDepartments(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Department status updated.'
      });
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `dept-${Date.now()}`,
      ...newDept,
      status: 'Active'
    };
    const updated = [entry, ...departments];
    persistDepartments(updated);
    setShowAddModal(false);
    setNewDept({ name: '', code: '', hod: 'Dr. Sundar M', totalDoctors: 4, totalBeds: 20, icuBeds: 4, opdRooms: 'OPD Wing C' });
    if (onToast) {
      onToast({
        type: 'success',
        text: `Department ${entry.name} established and registered.`
      });
    }
  };

  const filtered = departments.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hod.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Clinical Department Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Oversee clinical specialty divisions, assign Heads of Departments (HOD), and track bed allocations.
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
          <PlusCircle size={16} /> + Add Department
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Layers size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{departments.length}</span>
            <span className="ref-metric-label">Active Departments</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Users size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{departments.reduce((acc, d) => acc + d.totalDoctors, 0)}</span>
            <span className="ref-metric-label">Specialist Doctors</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Bed size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{departments.reduce((acc, d) => acc + d.totalBeds, 0)}</span>
            <span className="ref-metric-label">Assigned Ward Beds</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Activity size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{departments.reduce((acc, d) => acc + d.icuBeds, 0)}</span>
            <span className="ref-metric-label">Critical Care ICU Beds</span>
          </div>
        </div>
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
            placeholder="Search department name, code, or HOD..."
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
          <option value="All">All Statuses ▾</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Departments Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Department & Code</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Head of Department (HOD)</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Doctors</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Bed Capacity</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>OPD Rooms</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
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
                      Code: <strong>{d.code}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {d.hod}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)' }}>
                    {d.totalDoctors} Specialists
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {d.totalBeds} General
                    </div>
                    {d.icuBeds > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#B83245', fontWeight: '700' }}>
                        {d.icuBeds} ICU Beds
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                    {d.opdRooms}
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
                        backgroundColor: d.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                        color: d.status === 'Active' ? '#15803D' : '#B83245'
                      }}
                    >
                      ● {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(d.id)}
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
                      {d.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Clinical Department"
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Department Name</label>
              <input
                type="text"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                placeholder="e.g. Pulmonology & Respiratory Medicine"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Short Code</label>
                <input
                  type="text"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PULM"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Head of Department (HOD)</label>
                <input
                  type="text"
                  value={newDept.hod}
                  onChange={(e) => setNewDept({ ...newDept, hod: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Doctors</label>
                <input
                  type="number"
                  min="1"
                  value={newDept.totalDoctors}
                  onChange={(e) => setNewDept({ ...newDept, totalDoctors: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>General Beds</label>
                <input
                  type="number"
                  min="0"
                  value={newDept.totalBeds}
                  onChange={(e) => setNewDept({ ...newDept, totalBeds: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>ICU Beds</label>
                <input
                  type="number"
                  min="0"
                  value={newDept.icuBeds}
                  onChange={(e) => setNewDept({ ...newDept, icuBeds: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>OPD Clinic Rooms</label>
              <input
                type="text"
                value={newDept.opdRooms}
                onChange={(e) => setNewDept({ ...newDept, opdRooms: e.target.value })}
                placeholder="e.g. OPD Wing B, Rooms 120-124"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                required
              />
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
                Create Department
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
