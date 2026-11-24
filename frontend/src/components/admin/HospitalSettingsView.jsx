import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Save,
  Check,
  AlertTriangle,
  Clock,
  Radio,
  Lock,
  Globe
} from 'lucide-react';

export default function HospitalSettingsView({ onToast }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_tenant_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      slotBufferMinutes: 20,
      autoCancelHours: 2,
      maxSessionTokens: 25,
      icuAlertThreshold: 3,
      teleconsultPlatform: 'WebRTC End-to-End Encrypted',
      webrtcGateway: 'wss://webrtc.medibridge.internal/v1/signaling',
      emergency108AutoDivert: true,
      dataRetentionDays: 2555, // 7 years clinical compliance
      smsNotifications: true,
      whatsappUpdates: true
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('medibridge_hospital_tenant_settings', JSON.stringify(settings));
    setTimeout(() => {
      setIsSaving(false);
      if (onToast) {
        onToast({
          type: 'success',
          text: 'Hospital governance and administrative settings saved successfully.'
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
            Hospital Facility Configuration & Governance
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage hospital tenant parameters, emergency triage protocols, and security compliance.
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
          <Save size={16} /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card 1: Appointment & Cancellation Policies */}
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
            Outpatient Appointment & Cancellation Rules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                Default Consultation Slot Duration
              </label>
              <select
                value={settings.slotBufferMinutes}
                onChange={(e) => setSettings({ ...settings, slotBufferMinutes: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value={15}>15 Minutes per patient</option>
                <option value={20}>20 Minutes per patient (Recommended)</option>
                <option value={30}>30 Minutes per patient</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                Auto-Cancellation Cutoff Window
              </label>
              <select
                value={settings.autoCancelHours}
                onChange={(e) => setSettings({ ...settings, autoCancelHours: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value={1}>1 Hour before scheduled time</option>
                <option value={2}>2 Hours before scheduled time (Standard)</option>
                <option value={4}>4 Hours before scheduled time</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                Maximum Patient Tokens per OPD Shift
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={settings.maxSessionTokens}
                onChange={(e) => setSettings({ ...settings, maxSessionTokens: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Emergency & Triage Protocols */}
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
            Emergency 108 & Critical Care Safeguards
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                ICU Minimum Emergency Reserve Capacity
              </label>
              <select
                value={settings.icuAlertThreshold}
                onChange={(e) => setSettings({ ...settings, icuAlertThreshold: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value={2}>2 Beds (Alert at 2 remaining)</option>
                <option value={3}>3 Beds (Standard Critical Reserve)</option>
                <option value={5}>5 Beds (High Emergency Triage)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
                Telemedicine WebRTC Media Gateway
              </label>
              <input
                type="text"
                value={settings.webrtcGateway}
                onChange={(e) => setSettings({ ...settings, webrtcGateway: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8125rem', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block' }}>
                  Auto-Broadcast 108 Emergency Divert
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Notifies ambulance dispatch if ICU falls below threshold
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.emergency108AutoDivert}
                onChange={(e) => setSettings({ ...settings, emergency108AutoDivert: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Compliance & Security Seal */}
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            gridColumn: '1 / -1'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Institutional Healthcare Compliance & ABDM Integration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ShieldCheck size={18} style={{ color: '#15803D' }} />
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                  DPDP Act 2023 Digital Health Audit
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Personal health records encrypted with AES-256 GCM. Patient consent logs retained.
              </div>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                Verified Pass
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Radio size={18} style={{ color: '#15803D' }} />
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                  NHA / ABDM Gateway Sync
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Milestone 1, 2 & 3 certified with National Health Authority ABHA ID creation.
              </div>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                Online & Synced
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Lock size={18} style={{ color: '#15803D' }} />
                <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                  Tamil Nadu Clinical Establishments Act
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Compliant with Directorate of Medical and Rural Health Services (DMS).
              </div>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                License Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
