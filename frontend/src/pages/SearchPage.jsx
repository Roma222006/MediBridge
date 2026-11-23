import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import {
  Search,
  MapPin,
  Clock,
  SlidersHorizontal,
  Star,
  Building2,
  AlertTriangle,
  Stethoscope,
  Activity,
  Bed,
  Check
} from 'lucide-react';
import hospitalBg from '../assets/hospital-login-bg.jpg';

export default function SearchPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');

  // Default coordinates: Coimbatore (11.0168, 76.9558)
  const [userLocation] = useState({ lat: 11.0168, lng: 76.9558 });

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm: 60,
        district: selectedDistrict
      };
      if (query) params.query = query;

      const res = await api.get('/search', { params });
      if (res.data.success) {
        setHospitals(res.data.data || []);
      }
    } catch (err) {
      console.error('[Search] Error loading facilities:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [selectedDistrict]);

  // Real-time bed updates via Socket.IO
  useEffect(() => {
    const handleBedUpdate = ({ hospitalId, bedCapacity }) => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id === hospitalId) {
            return {
              ...h,
              bedCapacity: {
                ...h.bedCapacity,
                general: { ...h.bedCapacity.general, available: bedCapacity.general.available },
                icu: { ...h.bedCapacity.icu, available: bedCapacity.icu.available }
              }
            };
          }
          return h;
        })
      );
    };

    socket.on('hospital_bed_changed', handleBedUpdate);
    return () => {
      socket.off('hospital_bed_changed', handleBedUpdate);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHospitals();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header (Exact Match to Screen 3) */}
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.625rem',
            fontWeight: '800',
            color: 'var(--color-heading)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          Discover Hospitals
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Find and book hospitals and doctors near you.
        </p>
      </div>

      {/* Filter Bar Row (Exact Match to Screen 3) */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {/* Search input with icon */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospital, location or specialty..."
            style={{
              width: '100%',
              height: '42px',
              padding: '0 16px 0 42px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              outline: 'none',
              color: 'var(--text)'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Location Dropdown */}
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <MapPin
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 12px 0 34px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--color-heading)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Coimbatore">Coimbatore</option>
            <option value="Pollachi">Pollachi</option>
            <option value="Tiruppur">Tiruppur</option>
          </select>
        </div>

        {/* Filter Button */}
        <button
          type="submit"
          style={{
            height: '42px',
            width: '42px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-heading)'
          }}
          aria-label="Filter"
        >
          <SlidersHorizontal size={18} />
        </button>
      </form>

      {/* Hospital Listing Cards (Exact Match to Screen 3) */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Searching hospitals across network...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hospitals found for this location.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hospitals.map((h) => {
            const distance = h.distanceKm || (h.name.includes('KMCH') ? '3.2' : h.name.includes('PSG') ? '5.8' : '18.4');
            const rating = h.name.includes('KMCH') ? '4.7 (1,240 reviews)' : h.name.includes('PSG') ? '4.6 (980 reviews)' : '4.4 (520 reviews)';

            return (
              <div
                key={h.id}
                className="card"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  boxShadow: '0 2px 8px rgba(112, 43, 89, 0.03)'
                }}
              >
                {/* Left & Middle Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                  {/* Hospital Thumbnail */}
                  <div
                    style={{
                      width: '88px',
                      height: '76px',
                      borderRadius: '8px',
                      backgroundImage: `url(${hospitalBg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--border)'
                    }}
                  />

                  {/* Middle Content */}
                  <div>
                    <h3
                      style={{
                        margin: '0 0 3px 0',
                        fontSize: '1.0625rem',
                        fontWeight: '800',
                        color: 'var(--color-heading)'
                      }}
                    >
                      {h.name}
                    </h3>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {h.type === 'tertiary' ? 'Multispeciality Hospital' : 'District Government Hospital'}
                    </div>

                    {/* Rating & Distance */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D5A45B', fontWeight: '700' }}>
                        <Star size={14} fill="#D5A45B" />
                        <span>{rating}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>{distance} km</span>
                      </div>
                    </div>

                    {/* Badges Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {h.emergencyAvailable && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--status-critical-bg)',
                            color: 'var(--status-critical-solid)',
                            border: '1px solid rgba(184, 50, 69, 0.2)'
                          }}
                        >
                          24/7 Emergency
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-blush-pink)',
                          color: 'var(--color-heading)'
                        }}
                      >
                        ICU ({h.bedCapacity?.icu?.available || 0} open)
                      </span>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--status-success-bg)',
                          color: 'var(--status-success-accent)'
                        }}
                      >
                        Diagnostic Lab
                      </span>

                      {h.schemesSupported?.includes('cmchis') && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-pale-rose)',
                            color: 'var(--color-heading)'
                          }}
                        >
                          CMCHIS Empaneled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Button (Magenta Pill Button) */}
                <div>
                  <Link
                    to={`/hospital/${h.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(184, 61, 131, 0.25)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
