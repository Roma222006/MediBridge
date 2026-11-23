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
      if (res.data?.success) {
        setHospitals(res.data.data || []);
      }
    } catch (err) {
      console.warn('[Search] Error loading facilities:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [selectedDistrict]);

  // Real-time bed updates
  useEffect(() => {
    if (socket) {
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
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHospitals();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px 48px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h1
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.75rem',
            fontWeight: '800',
            color: 'var(--color-heading)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          Discover Hospitals
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Find and book verified hospitals, specialists, and procedure slots near you.
        </p>
      </div>

      {/* Filter Bar Row (Curved, spacious, modern) */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search input with icon */}
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospital, doctor or medical specialty..."
            style={{
              width: '100%',
              height: '46px',
              padding: '0 20px 0 46px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              outline: 'none',
              color: 'var(--text)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Location Dropdown */}
        <div style={{ position: 'relative', minWidth: '170px' }}>
          <MapPin
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-primary)',
              pointerEvents: 'none'
            }}
          />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              width: '100%',
              height: '46px',
              padding: '0 16px 0 38px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: 'var(--color-heading)',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <option value="Coimbatore">Coimbatore</option>
            <option value="Pollachi">Pollachi</option>
            <option value="Tiruppur">Tiruppur</option>
          </select>
        </div>

        {/* Filter / Search Button */}
        <button
          type="submit"
          style={{
            height: '46px',
            padding: '0 24px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(184, 61, 131, 0.25)'
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Search</span>
        </button>
      </form>

      {/* Hospital Listing Cards */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Searching hospitals across network...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <Building2 size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 4px 0', color: 'var(--color-heading)', fontSize: '1.125rem' }}>No hospitals found</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Please select another city or change your search filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {hospitals.map((h) => {
            const distance = h.distanceKm || (h.name.includes('KMCH') ? '3.2' : h.name.includes('PSG') ? '5.8' : '18.4');
            const rating = h.name.includes('KMCH') ? '4.7 (1,240 reviews)' : h.name.includes('PSG') ? '4.6 (980 reviews)' : '4.4 (520 reviews)';

            return (
              <div
                key={h.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left & Middle Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flex: '1 1 500px' }}>
                  {/* Hospital Thumbnail */}
                  <div
                    style={{
                      width: '100px',
                      height: '88px',
                      borderRadius: '14px',
                      backgroundImage: `url(${hospitalBg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  />

                  {/* Middle Content */}
                  <div>
                    <h3
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.125rem',
                        fontWeight: '800',
                        color: 'var(--color-heading)'
                      }}
                    >
                      {h.name}
                    </h3>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {h.type === 'tertiary' ? 'Multispeciality Tertiary Care' : 'District Government Healthcare Center'}
                    </div>

                    {/* Rating & Distance */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B77A32', fontWeight: '700' }}>
                        <Star size={14} fill="#B77A32" />
                        <span>{rating}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>{distance} km</span>
                      </div>
                    </div>

                    {/* Badges Row (Curved pill tags) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {h.emergencyAvailable && (
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: '700',
                            padding: '3px 12px',
                            borderRadius: '9999px',
                            backgroundColor: '#FEE2E2',
                            color: '#B83245'
                          }}
                        >
                          24/7 Emergency
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          backgroundColor: '#F8DDE3',
                          color: 'var(--color-heading)'
                        }}
                      >
                        ICU ({h.bedCapacity?.icu?.available || 0} open)
                      </span>

                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          backgroundColor: '#DCFCE7',
                          color: '#15803D'
                        }}
                      >
                        Diagnostic Lab
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button (Pill button) */}
                <div>
                  <Link
                    to={`/hospital/${h.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      padding: '11px 26px',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(184, 61, 131, 0.25)',
                      transition: 'all 0.15s ease'
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
