import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Phone, AlertTriangle, MapPin, Bed, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

export default function EmergencyPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastCachedTime, setLastCachedTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchEmergencyHospitals();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [district]);

  const fetchEmergencyHospitals = async () => {
    setLoading(true);
    try {
      const params = district ? { district } : { lat: 11.0168, lng: 76.9558 };
      const res = await api.get('/emergency/nearest', { params });
      if (res.data.success) {
        setHospitals(res.data.data);
        setLastCachedTime(new Date());
      }
    } catch (err) {
      console.warn('[Emergency] Network unavailable. Attempting offline bundle fallback...');
      try {
        const bundle = await api.get('/emergency/offline-bundle');
        if (bundle.data.centers) {
          setHospitals(
            bundle.data.centers.map((c) => ({
              id: c._id,
              name: c.name,
              phone: c.phone,
              emergencyPhone: c.emergencyPhone || '108',
              address: c.address,
              bedCapacity: {
                general: c.bedCapacity.general,
                icu: c.bedCapacity.icu,
                disclaimer: 'Offline cached data. Confirm directly with casualty upon arrival.',
                isStale: true
              }
            }))
          );
        }
      } catch (offlineErr) {
        console.error('[Emergency] Offline cache lookup failed:', offlineErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content emergency-mode-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <PageHeader
        title="Emergency Mode & Trauma Dispatch"
        subtitle="Zero-auth critical access: triage routing, nearest trauma centers, and immediate 108 emergency dial"
        breadcrumbs={[
          { label: 'Platform', path: '/' },
          { label: 'Emergency Mode' }
        ]}
      />

      {/* 108 Emergency High-Contrast Action Banner */}
      <div
        style={{
          backgroundColor: 'var(--status-critical-solid)',
          color: 'var(--surface)',
          padding: '28px 24px',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          marginBottom: '24px'
        }}
      >
        <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', opacity: 0.95 }}>
          Life-Threatening Medical Emergency
        </div>
        <h1 style={{ color: 'var(--surface)', fontSize: '2.5rem', fontWeight: '800', margin: '8px 0', lineHeight: 1.15 }}>
          Dial 108 (Toll Free)
        </h1>
        <p style={{ color: 'var(--surface)', fontSize: '0.9375rem', marginBottom: '20px', opacity: 0.9 }}>
          Ambulance & Emergency Response Service &bull; Zero server dependency &bull; Instant dispatch
        </p>

        <a
          href="tel:108"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            backgroundColor: 'var(--surface)',
            color: 'var(--status-critical-solid)',
            fontSize: '1.25rem',
            padding: '14px 36px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '800',
            textDecoration: 'none',
            letterSpacing: '0.02em',
            border: '2px solid var(--surface)'
          }}
        >
          <Phone size={24} /> Tap to Dial 108 Now
        </a>
      </div>

      {/* Offline Alert if Network is Down */}
      {isOffline && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-accent)',
            color: 'var(--status-warning-text)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem'
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>Offline Emergency Mode Active:</strong> You are currently disconnected from the network. Displaying local cached emergency facilities.
          </span>
        </div>
      )}

      {/* Manual District Entry Fallback */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          padding: '16px 20px',
          boxShadow: 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
              Nearest Trauma & Casualty Centers
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              No login, patient profile, or payment required. Immediate public admission.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>Select District:</span>
            <select
              className="form-select"
              style={{
                width: 'auto',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-control)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.875rem'
              }}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              aria-label="Filter emergency facilities by district"
            >
              <option value="">Coimbatore (GPS Default)</option>
              <option value="Pollachi">Pollachi / Rural Taluk</option>
              <option value="Salem">Salem</option>
              <option value="Tiruppur">Tiruppur</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Centers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Locating nearest trauma centers...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hospitals.map((h) => (
            <div
              key={h.id}
              className="card"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '4px solid var(--status-critical-solid)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                boxShadow: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                    {h.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {h.address?.city}, {h.address?.district}
                    </span>
                    {h.distanceKm && (
                      <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                        &bull; {h.distanceKm} km away
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={`tel:${h.emergencyPhone || h.phone || '108'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--status-critical-solid)',
                    color: 'var(--surface)',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={15} /> Call Casualty: {h.emergencyPhone || h.phone}
                </a>
              </div>

              {/* Reported bed capacity metrics with disclaimer */}
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '16px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ICU Beds Reported
                  </span>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '1.125rem',
                      marginTop: '2px',
                      color:
                        (h.bedCapacity?.icu?.available || 0) > 0
                          ? 'var(--status-success-text)'
                          : 'var(--status-critical-text)'
                    }}
                  >
                    {h.bedCapacity?.icu?.available || 0} Open
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    General Beds Reported
                  </span>
                  <div style={{ fontWeight: '700', fontSize: '1.125rem', marginTop: '2px', color: 'var(--text)' }}>
                    {h.bedCapacity?.general?.available || 0} Open
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--status-warning-text)', marginLeft: 'auto', maxWidth: '380px', lineHeight: '1.4' }}>
                  <strong>Reported Capacity:</strong> {h.bedCapacity?.disclaimer || 'Self-reported by facility. Confirm availability with casualty upon arrival.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
