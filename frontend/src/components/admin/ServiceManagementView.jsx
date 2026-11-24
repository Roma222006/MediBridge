import React, { useState } from 'react';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Check,
  X,
  Stethoscope,
  Video,
  DollarSign,
  Clock,
  Activity,
  Layers
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function ServiceManagementView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'srv-1', name: 'Comprehensive Cardiology OPD Consultation', code: 'SRV-CARD-01', department: 'Cardiology', type: 'Specialist Consultation', fee: 800, duration: '20 mins', dailyCapacity: 25, status: 'Active' },
      { id: 'srv-2', name: 'Telemedicine Follow-up Cardiology Consult', code: 'SRV-CARD-02', department: 'Cardiology', type: 'Teleconsultation', fee: 500, duration: '15 mins', dailyCapacity: 20, status: 'Active' },
      { id: 'srv-3', name: 'Neurology Clinical Evaluation', code: 'SRV-NEUR-01', department: 'Neurology', type: 'Specialist Consultation', fee: 900, duration: '30 mins', dailyCapacity: 18, status: 'Active' },
      { id: 'srv-4', name: 'Orthopedic Joint & Spine Assessment', code: 'SRV-ORTH-01', department: 'Orthopedics', type: 'Specialist Consultation', fee: 750, duration: '20 mins', dailyCapacity: 25, status: 'Active' },
      { id: 'srv-5', name: 'General Medicine & Diabetology Check', code: 'SRV-GMED-01', department: 'General Medicine', type: 'General Consultation', fee: 500, duration: '15 mins', dailyCapacity: 35, status: 'Active' },
      { id: 'srv-6', name: 'Pediatric Well-Baby & Developmental Review', code: 'SRV-PEDI-01', department: 'Pediatrics', type: 'Specialist Consultation', fee: 600, duration: '20 mins', dailyCapacity: 30, status: 'Active' },
      { id: 'srv-7', name: 'Emergency Trauma Triage & Acute Stabilization', code: 'SRV-EMER-01', department: 'Emergency & Trauma', type: 'Emergency Service', fee: 1200, duration: 'Immediate', dailyCapacity: 999, status: 'Active' },
      { id: 'srv-8', name: 'Minor Surgical Wound Debridement & Suturing', code: 'SRV-SURG-01', department: 'General Surgery', type: 'Day Care Procedure', fee: 1500, duration: '45 mins', dailyCapacity: 12, status: 'Active' }
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    code: '',
    department: 'Cardiology',
    type: 'Specialist Consultation',
    fee: 800,
    duration: '20 mins',
    dailyCapacity: 25
  });

  const persistServices = (updated) => {
    setServices(updated);
    localStorage.setItem('medibridge_hospital_services', JSON.stringify(updated));
  };

  const handleToggleStatus = (id) => {
    const updated = services.map((s) => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Disabled' : 'Active' };
      }
      return s;
    });
    persistServices(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Service availability status updated.'
      });
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `srv-${Date.now()}`,
      ...newService,
      status: 'Active'
    };
    const updated = [entry, ...services];
    persistServices(updated);
    setShowAddModal(false);
    setNewService({ name: '', code: '', department: 'Cardiology', type: 'Specialist Consultation', fee: 800, duration: '20 mins', dailyCapacity: 25 });
    if (onToast) {
      onToast({
        type: 'success',
        text: `Medical service ${entry.name} created and registered in hospital catalog.`
      });
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    return matchesSearch && matchesDept && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Medical Service & Consultation Catalog
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure clinical offerings, consultation fees, session durations, and token limits published to Patient Portal.
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
          <PlusCircle size={16} /> + Add Medical Service
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
            placeholder="Search service by name, service code, or department..."
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
          <option value="Cardiology">Cardiology</option>
          <option value="Neurology">Neurology</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="General Medicine">General Medicine</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Emergency & Trauma">Emergency & Trauma</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          <option value="All">All Service Types ▾</option>
          <option value="Specialist Consultation">Specialist Consultation</option>
          <option value="General Consultation">General Consultation</option>
          <option value="Teleconsultation">Teleconsultation</option>
          <option value="Emergency Service">Emergency Service</option>
          <option value="Day Care Procedure">Day Care Procedure</option>
        </select>
      </div>

      {/* Services Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Service & Code</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Department</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Service Type</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Consultation Fee</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Duration & Capacity</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Code: <strong>{s.code}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)', fontWeight: '600' }}>
                    {s.department}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: s.type.includes('Teleconsult') ? '#F3E8FF' : '#FCEFED',
                        color: s.type.includes('Teleconsult') ? '#7E22CE' : 'var(--color-primary)'
                      }}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                      ₹{s.fee}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Per Session
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {s.duration}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.dailyCapacity > 100 ? '24x7 Emergency' : `${s.dailyCapacity} tokens / day`}
                    </div>
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
                        backgroundColor: s.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                        color: s.status === 'Active' ? '#15803D' : '#B83245'
                      }}
                    >
                      ● {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s.id)}
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
                      {s.status === 'Active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Medical Service to Hospital Catalog"
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Service Name</label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="e.g. Comprehensive Cardiac Echo Review"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Service Code</label>
                <input
                  type="text"
                  value={newService.code}
                  onChange={(e) => setNewService({ ...newService, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SRV-ECHO-01"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Department</label>
                <select
                  value={newService.department}
                  onChange={(e) => setNewService({ ...newService, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Emergency & Trauma">Emergency & Trauma</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Service Type</label>
                <select
                  value={newService.type}
                  onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                >
                  <option value="Specialist Consultation">Specialist Consultation</option>
                  <option value="General Consultation">General Consultation</option>
                  <option value="Teleconsultation">Teleconsultation</option>
                  <option value="Emergency Service">Emergency Service</option>
                  <option value="Day Care Procedure">Day Care Procedure</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={newService.fee}
                  onChange={(e) => setNewService({ ...newService, fee: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Daily Tokens</label>
                <input
                  type="number"
                  min="1"
                  value={newService.dailyCapacity}
                  onChange={(e) => setNewService({ ...newService, dailyCapacity: Number(e.target.value) })}
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
                Register Service
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
