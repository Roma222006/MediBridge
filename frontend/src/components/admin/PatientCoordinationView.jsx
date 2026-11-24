import React, { useState } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Check,
  X,
  Clock,
  Phone,
  HelpCircle,
  Accessibility,
  Languages,
  Truck
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function PatientCoordinationView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('medibridge_patient_coordination_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'coord-1', patientName: 'Narayanan S', age: 74, type: 'Wheelchair Assistance', location: 'Gate 2 Entrance to OPD 204 (Cardiology)', coordinator: 'Ramesh (Porter Team)', status: 'In Transit', time: '12 mins ago' },
      { id: 'coord-2', patientName: 'Fatima B', age: 52, type: 'Multilingual Translator', location: 'Diagnostic Imaging Desk (Malayalam to Tamil)', coordinator: 'Staff Nurse Anjali', status: 'Assigned', time: '25 mins ago' },
      { id: 'coord-3', patientName: 'Shanmugam R', age: 68, type: 'Stretcher Transit', location: '108 Ambulance Bay to Trauma Triage', coordinator: 'Emergency Orderly Team', status: 'Completed', time: '1 hour ago' },
      { id: 'coord-4', patientName: 'Devi P', age: 39, type: 'Discharge Escort & Transport', location: 'Ward 3, Room 304 to Main Porch', coordinator: 'Patient Care Executive Karthik', status: 'Pending', time: '5 mins ago' }
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    patientName: '',
    age: 60,
    type: 'Wheelchair Assistance',
    location: '',
    coordinator: 'Porter Dispatch Desk'
  });

  const persistRequests = (updated) => {
    setRequests(updated);
    localStorage.setItem('medibridge_patient_coordination_requests', JSON.stringify(updated));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `coord-${Date.now()}`,
      ...newRequest,
      status: 'Assigned',
      time: 'Just now'
    };
    const updated = [entry, ...requests];
    persistRequests(updated);
    setShowAddModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Patient assistance request logged for ${entry.patientName}. Orderly dispatched.`
      });
    }
  };

  const handleComplete = (id) => {
    const updated = requests.map((r) => {
      if (r.id === id) {
        return { ...r, status: 'Completed' };
      }
      return r;
    });
    persistRequests(updated);
    if (onToast) {
      onToast({
        type: 'success',
        text: 'Patient assistance task marked as Completed.'
      });
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Patient Coordination & Special Assistance Desk
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Coordinate hospital orderlies, wheelchair transit, language translation services, and discharge logistics.
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
          <PlusCircle size={16} /> + Request Patient Assistance
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
            placeholder="Search patient name, location, or coordinator..."
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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
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
          <option value="All">All Assistance Types ▾</option>
          <option value="Wheelchair Assistance">Wheelchair Assistance</option>
          <option value="Stretcher Transit">Stretcher Transit</option>
          <option value="Multilingual Translator">Multilingual Translator</option>
          <option value="Discharge Escort & Transport">Discharge Escort</option>
        </select>
      </div>

      {/* Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Patient Name</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Service Requested</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Transit Route / Location</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Assigned Coordinator</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Logged</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                      {r.patientName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.age} Years
                    </div>
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
                        backgroundColor: 'var(--surface-subtle)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {r.type.includes('Wheelchair') ? <Accessibility size={13} /> : r.type.includes('Translator') ? <Languages size={13} /> : <Truck size={13} />}
                      {r.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text)', fontWeight: '600' }}>
                    {r.location}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                    {r.coordinator}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {r.time}
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
                        backgroundColor: r.status === 'Completed' ? '#DCFCE7' : r.status === 'In Transit' ? '#CFFAFE' : '#FEF3C7',
                        color: r.status === 'Completed' ? '#15803D' : r.status === 'In Transit' ? '#0369A1' : '#B77A32'
                      }}
                    >
                      {r.status === 'Completed' ? <Check size={12} strokeWidth={2.5} /> : '●'} {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {r.status !== 'Completed' ? (
                      <button
                        type="button"
                        onClick={() => handleComplete(r.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          border: 'none',
                          backgroundColor: 'var(--color-primary)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Mark Done
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: '700' }}>
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Request Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Dispatch Patient Assistance Request"
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Patient Full Name</label>
                <input
                  type="text"
                  value={newRequest.patientName}
                  onChange={(e) => setNewRequest({ ...newRequest, patientName: e.target.value })}
                  placeholder="e.g. Meenakshi Sundaram"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newRequest.age}
                  onChange={(e) => setNewRequest({ ...newRequest, age: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Assistance Type</label>
              <select
                value={newRequest.type}
                onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              >
                <option value="Wheelchair Assistance">Wheelchair Assistance</option>
                <option value="Stretcher Transit">Stretcher Transit (Emergency)</option>
                <option value="Multilingual Translator">Multilingual Language Translator</option>
                <option value="Discharge Escort & Transport">Discharge Escort & Transport</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Pickup Location & Destination</label>
              <input
                type="text"
                value={newRequest.location}
                onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                placeholder="e.g. Ground Floor Reception to Radiology Wing B"
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
                Dispatch Orderly
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
