import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Clock,
  Award,
  Save,
  Check,
  Hospital,
  AlertTriangle
} from 'lucide-react';

export default function HospitalProfileView({ onToast }) {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: 'Kovai Medical Center & Hospital (KMCH)',
      code: 'KMCH-CBE-01',
      licenseNumber: 'LIC-TN-CBE-001',
      nabhAccredited: true,
      nabhLevel: 'NABH Fully Accredited (5th Edition)',
      traumaLevel: 'Level 1 Comprehensive Trauma Center',
      address: '99, Avinashi Road, Civil Aerodrome Post, Peelamedu',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641014',
      phone: '+91 422 432 3800',
      emergencyPhone: '108 / +91 422 262 7788',
      email: 'contact@kmch.ac.in',
      website: 'https://www.kmch.ac.in',
      opdHours: '08:00 AM - 08:00 PM (Monday to Saturday)',
      emergencyHours: '24 Hours / 365 Days Uninterrupted',
      facilities: {
        cathLab: true,
        bloodBank: true,
        pharmacy24x7: true,
        dialysisUnit: true,
        neonatalIcu: true,
        organTransplant: true,
        telemedicineDesk: true,
        roboticSurgery: true
      },
      insuranceSchemes: [
        'Ayushman Bharat (PM-JAY)',
        'Chief Minister Comprehensive Health Insurance (CMCHIS)',
        'Central Government Health Scheme (CGHS)',
        'Star Health & Allied Insurance',
        'ICICI Lombard Health Care',
        'MediAssist TPA Network'
      ]
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleFacilityToggle = (key) => {
    setProfile((prev) => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [key]: !prev.facilities[key]
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('medibridge_hospital_profile', JSON.stringify(profile));
    setTimeout(() => {
      setIsSaving(false);
      if (onToast) {
        onToast({
          type: 'success',
          text: 'Hospital Profile and institutional credentials updated successfully.'
        });
      }
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Hospital Profile & Institutional Governance
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage hospital registration credentials, emergency contact routing, facilities, and insurance affiliations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)'
          }}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left Column: Hospital Overview & Regulatory Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Institution Card */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Hospital size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {profile.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D'
                    }}
                  >
                    <Check size={12} strokeWidth={2.5} /> Active Provider
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    License: <strong>{profile.licenseNumber}</strong>
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                  Hospital Legal Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Registration / License #
                  </label>
                  <input
                    type="text"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Institutional Code
                  </label>
                  <input
                    type="text"
                    value={profile.code}
                    onChange={(e) => setProfile({ ...profile, code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Accreditation Status
                  </label>
                  <input
                    type="text"
                    value={profile.nabhLevel}
                    onChange={(e) => setProfile({ ...profile, nabhLevel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Trauma Tier Level
                  </label>
                  <select
                    value={profile.traumaLevel}
                    onChange={(e) => setProfile({ ...profile, traumaLevel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Level 1 Comprehensive Trauma Center">Level 1 Comprehensive Trauma Center</option>
                    <option value="Level 2 Major Trauma Center">Level 2 Major Trauma Center</option>
                    <option value="Level 3 General Trauma Facility">Level 3 General Trauma Facility</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Contact & Location Card */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Address & Emergency Dispatch Routing
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    City & State
                  </label>
                  <input
                    type="text"
                    value={`${profile.city}, ${profile.state}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setProfile({ ...profile, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Main Hospital Phone
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#B83245', display: 'block', marginBottom: '6px' }}>
                    Emergency 108 Hotline
                  </label>
                  <input
                    type="text"
                    value={profile.emergencyPhone}
                    onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#B83245'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                    Website Portal
                  </label>
                  <input
                    type="text"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Facilities & Empanelled Insurance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Clinical Facilities Toggles */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Institutional Clinical Capabilities
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { key: 'cathLab', label: 'Advanced Cath Lab', desc: 'Interventional Cardiology' },
                { key: 'bloodBank', label: 'Licensed Blood Bank', desc: 'Component separation' },
                { key: 'pharmacy24x7', label: '24x7 Pharmacy', desc: 'Hospital inpatient depot' },
                { key: 'dialysisUnit', label: 'Hemodialysis Unit', desc: '20 Station capacity' },
                { key: 'neonatalIcu', label: 'Level III NICU', desc: 'Neonatal critical care' },
                { key: 'organTransplant', label: 'Organ Transplant Unit', desc: 'Kidney, Liver & Heart' },
                { key: 'telemedicineDesk', label: 'Telemedicine Desk', desc: 'WebRTC Remote OPD' },
                { key: 'roboticSurgery', label: 'Robotic Surgery Suite', desc: 'Da Vinci Surgical Xi' }
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => handleFacilityToggle(item.key)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: profile.facilities[item.key] ? '1px solid var(--color-primary)' : '1px solid var(--border)',
                    backgroundColor: profile.facilities[item.key] ? 'var(--surface-subtle)' : '#FAF6F7',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        backgroundColor: profile.facilities[item.key] ? 'var(--color-primary)' : '#FFFFFF',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {profile.facilities[item.key] && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empanelled Insurance Schemes */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Empanelled Government & Private Insurance Schemes
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profile.insuranceSchemes.map((scheme, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: '#FAF6F7',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-heading)' }}>
                      {scheme}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D'
                    }}
                  >
                    Cashless Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
