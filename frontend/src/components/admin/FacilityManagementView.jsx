import React, { useState } from 'react';
import {
  Hospital,
  Activity,
  Heart,
  Truck,
  Check,
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Radio,
  RefreshCw
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function FacilityManagementView({ onToast }) {
  const [activeTab, setActiveTab] = useState('theatres');

  // Operation Theatres
  const [theatres, setTheatres] = useState(() => {
    const saved = localStorage.getItem('medibridge_facilities_theatres');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'ot-1', name: 'OT 1 - Advanced Cardiac Surgical Suite', specialty: 'Cardiothoracic Surgery', status: 'In Surgery', procedure: 'Coronary Artery Bypass (CABG)', surgeon: 'Dr. Sundar M', token: 'T-089', estimatedEnd: '01:30 PM' },
      { id: 'ot-2', name: 'OT 2 - Neuro Navigation & Spine Suite', specialty: 'Neurosurgery', status: 'Available', procedure: 'Ready for Next Case', surgeon: 'Sterilized', token: 'None', estimatedEnd: '-' },
      { id: 'ot-3', name: 'OT 3 - Orthopedic Joint Replacement OT', specialty: 'Orthopedics', status: 'Available', procedure: 'Sterilized & Prepped', surgeon: 'Ready', token: 'None', estimatedEnd: '-' },
      { id: 'ot-4', name: 'OT 4 - Minimally Invasive Laparoscopic OT', specialty: 'General & GI Surgery', status: 'Turnaround', procedure: 'Sterilization & Cleaning in Progress', surgeon: 'Nursing Team', token: 'None', estimatedEnd: '15 Mins' },
      { id: 'ot-5', name: 'OT 5 - Emergency Trauma Resuscitation OT', specialty: 'Trauma & Emergency', status: 'Standby', procedure: 'Reserved 24x7 for Acute Trauma Triage', surgeon: 'Trauma Team', token: 'Standby', estimatedEnd: '24 Hours' },
      { id: 'ot-6', name: 'OT 6 - Daycare & Endoscopic Surgical Suite', specialty: 'Day Care Surgery', status: 'Available', procedure: 'Endoscopy & Minor Surgery Ready', surgeon: 'Ready', token: 'None', estimatedEnd: '-' }
    ];
  });

  // Blood Bank Inventory
  const [bloodStocks, setBloodStocks] = useState(() => {
    const saved = localStorage.getItem('medibridge_facilities_blood');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { group: 'A Positive (A+)', units: 42, status: 'Adequate', component: 'PRBC: 28, FFP: 14' },
      { group: 'B Positive (B+)', units: 38, status: 'Adequate', component: 'PRBC: 24, FFP: 14' },
      { group: 'O Positive (O+)', units: 56, status: 'Abundant', component: 'PRBC: 36, FFP: 20' },
      { group: 'AB Positive (AB+)', units: 18, status: 'Moderate', component: 'PRBC: 12, FFP: 6' },
      { group: 'O Negative (O-)', units: 12, status: 'Critical Reserve', component: 'Universal Donor PRBC: 12' },
      { group: 'A Negative (A-)', units: 8, status: 'Low Stock', component: 'PRBC: 8' },
      { group: 'B Negative (B-)', units: 9, status: 'Low Stock', component: 'PRBC: 9' }
    ];
  });

  // Ambulance Fleet
  const [ambulances, setAmbulances] = useState(() => {
    const saved = localStorage.getItem('medibridge_facilities_ambulance');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'amb-1', regNo: 'TN-38-BZ-1081', type: 'Advanced Life Support (ALS)', driver: 'Senthil K (+91 98421 11223)', location: 'KMCH Peelamedu Station Bay 1', status: 'Available', equipment: 'Ventilator, Defibrillator, Syringe Pump' },
      { id: 'amb-2', regNo: 'TN-38-BZ-1082', type: 'Advanced Life Support (ALS)', driver: 'Murugan R (+91 97890 33445)', location: 'En Route to Gandhipuram Triage', status: 'In Transit', equipment: 'Cardiac Monitor, O2 Cylinder, ALS Paramedic' },
      { id: 'amb-3', regNo: 'TN-38-BZ-1083', type: 'Basic Life Support (BLS)', driver: 'Venkatesh P (+91 94432 55667)', location: 'KMCH Peelamedu Station Bay 2', status: 'Available', equipment: 'First Aid, Stretcher, O2 Support' },
      { id: 'amb-4', regNo: 'TN-38-BZ-1084', type: 'Neonatal Critical Transport', driver: 'Praveen S (+91 98401 77889)', location: 'Maternity Wing Trauma Bay', status: 'Standby', equipment: 'Neonatal Transport Incubator, Baby Resuscitator' }
    ];
  });

  const handleToggleOt = (id) => {
    const updated = theatres.map((ot) => {
      if (ot.id === id) {
        const nextStatus = ot.status === 'Available' ? 'Turnaround' : 'Available';
        return { ...ot, status: nextStatus, procedure: nextStatus === 'Available' ? 'Sterilized & Prepped' : 'Cleaning & Sterilization in Progress' };
      }
      return ot;
    });
    setTheatres(updated);
    localStorage.setItem('medibridge_facilities_theatres', JSON.stringify(updated));
    if (onToast) onToast({ type: 'success', text: 'Operation theatre readiness status updated.' });
  };

  const handleToggleAmbulance = (id) => {
    const updated = ambulances.map((amb) => {
      if (amb.id === id) {
        const nextStatus = amb.status === 'Available' ? 'In Transit' : 'Available';
        return { ...amb, status: nextStatus };
      }
      return amb;
    });
    setAmbulances(updated);
    localStorage.setItem('medibridge_facilities_ambulance', JSON.stringify(updated));
    if (onToast) onToast({ type: 'success', text: 'Ambulance vehicle dispatch status updated.' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Hospital Facilities & Emergency Operational Readiness
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time tracking of Operation Theatres, Blood Bank reserves, and 108 Emergency Ambulance Fleet.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'theatres', label: `Operation Theatres (${theatres.length})` },
          { key: 'blood', label: `Blood Bank Stocks (${bloodStocks.length} Groups)` },
          { key: 'ambulance', label: `Ambulance Fleet (${ambulances.length} Vehicles)` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? 'var(--color-primary)' : '#FFFFFF',
              color: activeTab === tab.key ? '#FFFFFF' : 'var(--color-heading)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: THEATRES */}
      {activeTab === 'theatres' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {theatres.map((ot) => (
            <div
              key={ot.id}
              className="card"
              style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    {ot.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ot.specialty}</span>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    backgroundColor:
                      ot.status === 'Available' ? '#DCFCE7' : ot.status === 'In Surgery' ? '#FEE2E2' : '#FEF3C7',
                    color:
                      ot.status === 'Available' ? '#15803D' : ot.status === 'In Surgery' ? '#B83245' : '#B77A32'
                  }}
                >
                  ● {ot.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{ot.procedure}</span>
                </div>
                {ot.status === 'In Surgery' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lead Surgeon:</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-heading)' }}>{ot.surgeon}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Estimated Completion:</span>
                      <span style={{ fontWeight: '700', color: '#B83245' }}>{ot.estimatedEnd}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleToggleOt(ot.id)}
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
                  {ot.status === 'Available' ? 'Mark for Sterilization' : 'Mark OT Ready'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: BLOOD BANK */}
      {activeTab === 'blood' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {bloodStocks.map((b, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={18} style={{ color: '#B83245' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {b.group}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.component}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    {b.units}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Units</div>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    backgroundColor:
                      b.status === 'Abundant' || b.status === 'Adequate' ? '#DCFCE7' : '#FEE2E2',
                    color:
                      b.status === 'Abundant' || b.status === 'Adequate' ? '#15803D' : '#B83245'
                  }}
                >
                  ● {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AMBULANCE */}
      {activeTab === 'ambulance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {ambulances.map((amb) => (
            <div
              key={amb.id}
              className="card"
              style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={20} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {amb.regNo}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{amb.type}</span>
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    backgroundColor: amb.status === 'Available' ? '#DCFCE7' : amb.status === 'In Transit' ? '#FEF3C7' : '#E0E7FF',
                    color: amb.status === 'Available' ? '#15803D' : amb.status === 'In Transit' ? '#B77A32' : '#4338CA'
                  }}
                >
                  ● {amb.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Driver Hotline:</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{amb.driver}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Live Location:</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-heading)' }}>{amb.location}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Equipment: {amb.equipment}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleToggleAmbulance(amb.id)}
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
                  {amb.status === 'Available' ? 'Dispatch Vehicle' : 'Mark Back in Bay'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
