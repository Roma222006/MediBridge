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
  Phone,
  Calendar,
  MessageSquare,
  Building2,
  HeartPulse
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
      opdHours: '08:00 AM - 08:00 PM',
      emergencyHours: '24 Hours / 365 Days',
      receptionPhone: '+91 422 432 3800',
      emergencyHotline: '108 / +91 422 262 7788',
      slotDuration: 20, // mins
      cancellationWindow: 2, // hours
      maxDoctorTokens: 25,
      enableTelemedicine: true,
      icuSafetyReserve: 3,
      autoAlert108: true,
      smsBookingConfirmation: true,
      whatsappTokenReminder: true,
      smsDoctorDelayAlert: true
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
          text: 'Hospital administrative policies and operational settings saved successfully.'
        });
      }
    }, 350);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Hospital Operating Policies & Governance Settings
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure clinic timings, patient booking rules, 108 emergency safeguards, and SMS notification preferences.
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

      {/* Grid of Clean, Intuitive Settings Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* CARD 1: Clinic Timings & Contacts */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Hospital Hours & Direct Contacts
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '4px' }}>
                Outpatient Clinic (OPD) Working Hours
              </label>
              <input
                type="text"
                value={settings.opdHours}
                onChange={(e) => setSettings({ ...settings, opdHours: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Hours during which doctor consultation slots are available to patients.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '4px' }}>
                Main Reception Phone Number
              </label>
              <input
                type="text"
                value={settings.receptionPhone}
                onChange={(e) => setSettings({ ...settings, receptionPhone: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#B83245', display: 'block', marginBottom: '4px' }}>
                Emergency 108 Direct Hotline
              </label>
              <input
                type="text"
                value={settings.emergencyHotline}
                onChange={(e) => setSettings({ ...settings, emergencyHotline: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', fontSize: '0.875rem', color: '#B83245', fontWeight: '700' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Connected directly to 108 ambulance dispatch and emergency triage.
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Appointment & Patient Booking Rules */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Outpatient Booking & Cancellation Rules
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '4px' }}>
                Time Allocated per Patient Consultation
              </label>
              <select
                value={settings.slotDuration}
                onChange={(e) => setSettings({ ...settings, slotDuration: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value={15}>15 Minutes per patient (General checkup)</option>
                <option value={20}>20 Minutes per patient (Recommended for Specialists)</option>
                <option value={30}>30 Minutes per patient (Comprehensive Review)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Ensures adequate doctor time for patient history examination and prescription.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '4px' }}>
                Free Patient Cancellation Window
              </label>
              <select
                value={settings.cancellationWindow}
                onChange={(e) => setSettings({ ...settings, cancellationWindow: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value={1}>Up to 1 hour before scheduled appointment</option>
                <option value={2}>Up to 2 hours before scheduled appointment (Standard)</option>
                <option value={4}>Up to 4 hours before scheduled appointment</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Allows slots to be safely reassigned to waiting patients when someone cancels.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '4px' }}>
                Maximum Patient Tokens per Doctor Shift
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={settings.maxDoctorTokens}
                onChange={(e) => setSettings({ ...settings, maxDoctorTokens: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Limits patient count per session to prevent doctor burnout and long waiting times.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block' }}>
                  Enable Telemedicine Video Consultations
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Allows patients to book secure remote video follow-ups.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableTelemedicine}
                onChange={(e) => setSettings({ ...settings, enableTelemedicine: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: Emergency 108 & ICU Safeguards */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <HeartPulse size={20} style={{ color: '#B83245' }} />
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Emergency 108 & ICU Safety Buffers
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block', marginBottom: '4px' }}>
                Reserved Critical Care (ICU) Beds
              </label>
              <select
                value={settings.icuSafetyReserve}
                onChange={(e) => setSettings({ ...settings, icuSafetyReserve: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value={2}>2 Beds (Alert when only 2 remain)</option>
                <option value={3}>3 Beds (Standard Emergency ICU Hold)</option>
                <option value={5}>5 Beds (High Trauma Readiness)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                These beds are never allocated to elective admissions and remain held for acute emergencies.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block' }}>
                  Auto-Alert 108 Ambulance Dispatch Network
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Automatically informs 108 controllers if ICU availability dips below the safe reserve.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAlert108}
                onChange={(e) => setSettings({ ...settings, autoAlert108: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: Patient Communication & Reminders */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Patient SMS & WhatsApp Alerts
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block' }}>
                  Instant SMS Booking Confirmation
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sends SMS with token number, doctor name, and clinic room.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsBookingConfirmation}
                onChange={(e) => setSettings({ ...settings, smsBookingConfirmation: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block' }}>
                  WhatsApp Reminder (1 Hour Prior)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Reminds the patient 60 minutes before appointment.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.whatsappTokenReminder}
                onChange={(e) => setSettings({ ...settings, whatsappTokenReminder: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', display: 'block' }}>
                  Doctor Delay & Replacement Alerts
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Immediately notifies patient if their doctor is in emergency surgery.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsDoctorDelayAlert}
                onChange={(e) => setSettings({ ...settings, smsDoctorDelayAlert: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* CARD 5: Healthcare Compliance & Standards */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <ShieldCheck size={20} style={{ color: '#15803D' }} />
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
              Hospital Accreditation & Government Quality Certifications
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--color-heading)', marginBottom: '4px' }}>
                NABH 5th Edition Full Accreditation
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                National Accreditation Board for Hospitals & Healthcare Providers. Valid through December 2028.
              </div>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                ✓ Certified Active
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--color-heading)', marginBottom: '4px' }}>
                Tamil Nadu CMCHIS Empanelled
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Chief Minister's Comprehensive Health Insurance Scheme providing cashless treatment.
              </div>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                ✓ Empanelled Provider
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--color-heading)', marginBottom: '4px' }}>
                Ayushman Bharat (PM-JAY) ABDM
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                National Health Authority Ayushman Bharat Digital Mission compliant.
              </div>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                ✓ Online & Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
