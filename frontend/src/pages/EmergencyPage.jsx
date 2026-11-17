import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PhoneIcon, AlertTriangleIcon, MapPinIcon, BedIcon } from '../components/Icons';

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
    <div className="main-content" style={{ maxWidth: '900px' }}>
      {/* 108 Emergency Banner */}
      <div
        style={{
          backgroundColor: '#A32828',
          color: '#FFFFFF',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(163, 40, 40, 0.3)'
        }}
      >
        <div style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
          Life-Threatening Medical Emergency
        </div>
        <h1 style={{ color: '#FFFFFF', fontSize: '2.5rem', margin: '8px 0' }}>Dial 108 (Toll Free)</h1>
        <p style={{ color: '#FDEEEE', fontSize: '0.9375rem', marginBottom: '16px' }}>
          Ambulance & Emergency Response Service &bull; Zero server dependency
        </p>

        <a
          href="tel:108"
          className="btn btn-lg"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#A32828',
            fontSize: '1.25rem',
            padding: '12px 32px',
            fontWeight: '800'
          }}
        >
          <PhoneIcon size={24} /> Tap to Dial 108 Now
        </a>
      </div>

      {/* Offline Alert if Network is Down */}
      {isOffline && (
        <div
          style={{
            backgroundColor: '#FAF3E6',
            border: '2px solid #D5A45B',
            color: '#9E6B18',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertTriangleIcon size={20} />
          <span>
            <strong>Offline Emergency Mode Active:</strong> You are currently disconnected from the internet. Displaying local cached emergency facilities.
          </span>
        </div>
      )}

      {/* Manual District Entry Fallback */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>Nearest Trauma & Casualty Centers</strong>
            <div style={{ fontSize: '0.75rem', color: '#72848D' }}>
              No login, patient profile, or payment required.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: '#72848D' }}>Select District:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#72848D' }}>Locating nearest trauma centers...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {hospitals.map((h) => (
            <div
              key={h.id}
              className="card"
              style={{
                borderLeft: '6px solid #147D78',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#102D3A' }}>{h.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.8125rem', color: '#72848D' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPinIcon size={14} /> {h.address?.city}, {h.address?.district}
                    </span>
                    {h.distanceKm && (
                      <span style={{ fontWeight: '600', color: '#102D3A' }}>
                        &bull; {h.distanceKm} km away
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={`tel:${h.emergencyPhone || h.phone || '108'}`}
                  className="btn btn-danger"
                  style={{ fontWeight: '700' }}
                >
                  <PhoneIcon size={16} /> Call Casualty: {h.emergencyPhone || h.phone}
                </a>
              </div>

              {/* Bed capacity disclaimer */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  backgroundColor: '#F5F7F6',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  marginTop: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#72848D' }}>ICU Beds Reported</span>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: h.bedCapacity?.icu?.available > 0 ? '#1C744F' : '#A32828' }}>
                    {h.bedCapacity?.icu?.available || 0} Open
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#72848D' }}>General Beds Reported</span>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#102D3A' }}>
                    {h.bedCapacity?.general?.available || 0} Open
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#9E6B18', marginLeft: 'auto', maxWidth: '340px' }}>
                  <strong>Disclaimer:</strong> {h.bedCapacity?.disclaimer}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
