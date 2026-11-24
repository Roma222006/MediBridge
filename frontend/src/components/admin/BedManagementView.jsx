import React, { useState, useEffect } from 'react';
import {
  Bed,
  Activity,
  AlertTriangle,
  RefreshCw,
  Check,
  Clock,
  ShieldCheck,
  Edit2,
  Radio,
  PlusCircle
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function BedManagementView({ onToast }) {
  const [lastUpdated, setLastUpdated] = useState('4 mins ago');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [wards, setWards] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_bed_wards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'ward-1', name: 'General Medical Ward (Male)', code: 'GMW-M', total: 120, occupied: 104, reserved: 2, available: 14, floor: '2nd Floor, Wing A', type: 'General' },
      { id: 'ward-2', name: 'General Surgical Ward (Female)', code: 'GSW-F', total: 100, occupied: 86, reserved: 2, available: 12, floor: '2nd Floor, Wing B', type: 'General' },
      { id: 'ward-3', name: 'Intensive Critical Care Unit (ICU)', code: 'ICU-MAIN', total: 28, occupied: 21, reserved: 2, available: 5, floor: '3rd Floor, Trauma Wing', type: 'Critical Care' },
      { id: 'ward-4', name: 'Cardiac Care Unit (CCU)', code: 'CCU-CARD', total: 16, occupied: 13, reserved: 1, available: 2, floor: '3rd Floor, Cath Wing', type: 'Critical Care' },
      { id: 'ward-5', name: 'Neonatal Intensive Care Unit (NICU)', code: 'NICU-L3', total: 12, occupied: 8, reserved: 1, available: 3, floor: '4th Floor, Maternity', type: 'Critical Care' },
      { id: 'ward-6', name: 'Emergency Trauma Triage Bays', code: 'EMER-BAY', total: 24, occupied: 16, reserved: 4, available: 4, floor: 'Ground Floor, 108 Bay', type: 'Emergency' },
      { id: 'ward-7', name: 'Pediatric Inpatient Ward', code: 'PEDI-WARD', total: 20, occupied: 14, reserved: 1, available: 5, floor: '4th Floor, Wing C', type: 'General' }
    ];
  });

  const [selectedWard, setSelectedWard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTotal, setEditTotal] = useState(100);
  const [editOccupied, setEditOccupied] = useState(80);
  const [editReserved, setEditReserved] = useState(2);

  const totalCapacity = wards.reduce((acc, w) => acc + w.total, 0);
  const totalOccupied = wards.reduce((acc, w) => acc + w.occupied, 0);
  const totalAvailable = wards.reduce((acc, w) => acc + w.available, 0);
  const totalIcuBeds = wards.filter((w) => w.type === 'Critical Care').reduce((acc, w) => acc + w.total, 0);
  const availableIcuBeds = wards.filter((w) => w.type === 'Critical Care').reduce((acc, w) => acc + w.available, 0);

  useEffect(() => {
    if (!localStorage.getItem('medibridge_hospital_bed_wards')) {
      localStorage.setItem('medibridge_hospital_bed_wards', JSON.stringify(wards));
    }
  }, []);

  const persistWards = (updated) => {
    setWards(updated);
    localStorage.setItem('medibridge_hospital_bed_wards', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setLastUpdated('just now');
  };

  const handleBroadcastTo108 = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      setLastUpdated('just now');
      if (onToast) {
        onToast({
          type: 'success',
          text: `Live bed availability (${totalAvailable} General, ${availableIcuBeds} ICU) broadcasted to Tamil Nadu 108 Emergency Network.`
        });
      }
    }, 600);
  };

  const handleOpenEdit = (ward) => {
    setSelectedWard(ward);
    setEditTotal(ward.total);
    setEditOccupied(ward.occupied);
    setEditReserved(ward.reserved);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedWard) return;

    if (Number(editOccupied) + Number(editReserved) > Number(editTotal)) {
      if (onToast) {
        onToast({
          type: 'error',
          text: 'Occupied and reserved beds cannot exceed total configured capacity.'
        });
      }
      return;
    }

    const calculatedAvail = Math.max(0, Number(editTotal) - Number(editOccupied) - Number(editReserved));

    const updated = wards.map((w) => {
      if (w.id === selectedWard.id) {
        return {
          ...w,
          total: Number(editTotal),
          occupied: Number(editOccupied),
          reserved: Number(editReserved),
          available: calculatedAvail
        };
      }
      return w;
    });

    persistWards(updated);
    setShowEditModal(false);
    if (onToast) {
      onToast({
        type: 'success',
        text: `Ward ${selectedWard.name} capacity updated. Available beds: ${calculatedAvail}.`
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Hospital Bed & Critical Care Capacity Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Live ward occupancy register, ICU critical care reserves, and emergency 108 ambulance dispatch synchronization.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Last verified: <strong>{lastUpdated}</strong>
          </span>
          <button
            type="button"
            onClick={handleBroadcastTo108}
            disabled={isBroadcasting}
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
            <Radio size={16} /> {isBroadcasting ? 'Broadcasting...' : 'Broadcast to 108 Network'}
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Bed size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{totalCapacity}</span>
            <span className="ref-metric-label">Total Licensed Beds</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Activity size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{totalAvailable}</span>
            <span className="ref-metric-label">Available Beds</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <ShieldCheck size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{availableIcuBeds} / {totalIcuBeds}</span>
            <span className="ref-metric-label">Available ICU Beds</span>
          </div>
        </div>

        <div className="ref-metric-card">
          <div className="ref-metric-icon pink">
            <Clock size={22} strokeWidth={2} />
          </div>
          <div className="ref-metric-info">
            <span className="ref-metric-value">{Math.round((totalOccupied / totalCapacity) * 100)}%</span>
            <span className="ref-metric-label">Hospital Occupancy Rate</span>
          </div>
        </div>
      </div>

      {/* Ward Breakdown Table */}
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
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Ward Name & Location</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Ward Classification</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Total Capacity</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Occupied</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Reserved 108</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Available Beds</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Occupancy</th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-heading)', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => {
                const occPercent = Math.round((w.occupied / w.total) * 100);
                return (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                        {w.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {w.floor} &bull; <strong>{w.code}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: w.type === 'Critical Care' ? '#FEE2E2' : w.type === 'Emergency' ? '#FEF3C7' : '#DCFCE7',
                          color: w.type === 'Critical Care' ? '#B83245' : w.type === 'Emergency' ? '#B77A32' : '#15803D'
                        }}
                      >
                        {w.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {w.total} Beds
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>
                      {w.occupied}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#B77A32', fontWeight: '700' }}>
                      {w.reserved}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.8125rem',
                          fontWeight: '800',
                          backgroundColor: w.available > 3 ? '#DCFCE7' : '#FEE2E2',
                          color: w.available > 3 ? '#15803D' : '#B83245'
                        }}
                      >
                        {w.available} Open
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                        {occPercent}%
                      </div>
                      <div style={{ width: '70px', height: '5px', backgroundColor: '#E8E3E5', borderRadius: '9999px', marginTop: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${occPercent}%`,
                            height: '100%',
                            backgroundColor: occPercent > 90 ? '#B83245' : occPercent > 75 ? '#B77A32' : '#477B67'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(w)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border)',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: 'var(--color-heading)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={12} /> Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Capacity Modal */}
      {showEditModal && selectedWard && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Update Bed Capacity: ${selectedWard.name}`}
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                {selectedWard.name} ({selectedWard.code})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedWard.floor} &bull; Classification: {selectedWard.type}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Total Beds</label>
                <input
                  type="number"
                  min="1"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Occupied Beds</label>
                <input
                  type="number"
                  min="0"
                  value={editOccupied}
                  onChange={(e) => setEditOccupied(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Reserved for 108</label>
                <input
                  type="number"
                  min="0"
                  value={editReserved}
                  onChange={(e) => setEditReserved(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div style={{ padding: '10px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                Calculated Available Capacity: {Math.max(0, Number(editTotal) - Number(editOccupied) - Number(editReserved))} Beds
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Validation rule: Occupied + Reserved must not exceed Total Capacity.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ padding: '8px 16px', borderRadius: '9999px', border: '1px solid var(--border)', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
              >
                Save & Broadcast Update
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
