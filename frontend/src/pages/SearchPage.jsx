import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { SearchIcon, MapPinIcon, BedIcon, CalendarIcon, AlertTriangleIcon, ShieldCheckIcon } from '../components/Icons';
import StatusBadge from '../components/StatusBadge';
import DemoAccountSwitcher from '../components/DemoAccountSwitcher';

export default function SearchPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [scheme, setScheme] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  // Default coordinates: Coimbatore (11.0168, 76.9558)
  const [userLocation, setUserLocation] = useState({ lat: 11.0168, lng: 76.9558 });

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm: 60,
        sortBy
      };
      if (query) params.query = query;
      if (specialty) params.specialty = specialty;
      if (scheme) params.scheme = scheme;

      const res = await api.get('/search', { params });
      if (res.data.success) {
        setHospitals(res.data.data);
      }
    } catch (err) {
      console.error('[Search] Error loading facilities:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [specialty, scheme, sortBy]);

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
    <div className="main-content">
      {/* 1-Click Role Switcher for Live Demo */}
      <DemoAccountSwitcher />

      <div style={{ marginBottom: '24px' }}>
        <h2>Hospital & Live Service Availability</h2>
        <p style={{ marginTop: '4px' }}>
          Real-time facility capacity, specialist schedules, and verified scheme acceptance across Tamil Nadu.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search Facility or Scan</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MRI Brain, KMCH, Coimbatore"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Specialty</label>
              <select
                className="form-select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Radiology">Radiology (MRI / CT)</option>
                <option value="General Medicine">General Medicine</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Government / Insurer Scheme</label>
              <select
                className="form-select"
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
              >
                <option value="">All Schemes</option>
                <option value="pmjay">Ayushman Bharat (PM-JAY)</option>
                <option value="cmchis">CMCHIS (Tamil Nadu)</option>
                <option value="private_star">Star Health</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="distance">Nearest Distance</option>
                <option value="price">Lowest Consultation Fee</option>
                <option value="next_slot">Earliest Open Slot</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>
              <SearchIcon size={16} /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Hospital Results List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#72848D' }}>
          Loading real-time availability across healthcare network...
        </div>
      ) : hospitals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No healthcare facilities matched your selected criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{hospital.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#147D78', backgroundColor: '#E7F3F1', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                      {hospital.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.8125rem', color: '#72848D' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPinIcon size={14} /> {hospital.address.city}, {hospital.address.district} ({hospital.distanceKm ? `${hospital.distanceKm} km away` : 'Coimbatore'})
                    </span>
                    <span>&bull;</span>
                    <span>Phone: {hospital.phone}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>Consultations from</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#102D3A' }}>
                    ₹{hospital.minPrice > 0 ? hospital.minPrice : 'Free (Govt)'}
                  </div>
                </div>
              </div>

              {/* Stale Warning Banner if >120m */}
              {hospital.bedCapacity.isStale && (
                <div
                  style={{
                    backgroundColor: '#FAF3E6',
                    borderLeft: '4px solid #D5A45B',
                    padding: '8px 12px',
                    margin: '14px 0',
                    fontSize: '0.8125rem',
                    color: '#9E6B18',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangleIcon size={16} />
                  <span>
                    Availability update exceeds 2 hours ({hospital.bedCapacity.general.minutesAgo} min ago). Confirm live triage status before departure.
                  </span>
                </div>
              )}

              {/* Capacity & Next Slot Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  backgroundColor: '#F5F7F6',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  margin: '14px 0'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>General Beds</span>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#102D3A', marginTop: '2px' }}>
                    {hospital.bedCapacity.general.available} / {hospital.bedCapacity.general.total} open
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>
                    Updated {hospital.bedCapacity.general.minutesAgo} min ago
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>ICU Beds</span>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: hospital.bedCapacity.icu.available > 0 ? '#1C744F' : '#A32828', marginTop: '2px' }}>
                    {hospital.bedCapacity.icu.available} / {hospital.bedCapacity.icu.total} open
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>
                    Updated {hospital.bedCapacity.icu.minutesAgo} min ago
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>Next Available Slot</span>
                  {hospital.nextAvailableSlot ? (
                    <div style={{ marginTop: '2px' }}>
                      <span style={{ fontWeight: '600', color: '#147D78', fontSize: '0.9375rem' }}>
                        {hospital.nextAvailableSlot.date} at {hospital.nextAvailableSlot.startTime}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: '#A32828', fontSize: '0.875rem', marginTop: '2px' }}>
                      No open slots today
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>Schemes Accepted</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {hospital.schemesSupported.map((sch) => (
                      <span key={sch} style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#FFFFFF', border: '1px solid #DCE3E1', borderRadius: '3px', textTransform: 'uppercase' }}>
                        {sch.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <div style={{ fontSize: '0.8125rem', color: '#4A5B63' }}>
                  {hospital.servicesSample && hospital.servicesSample.length > 0 && (
                    <span>
                      Services: {hospital.servicesSample.map((s) => s.name).join(', ')}
                    </span>
                  )}
                </div>

                <Link to={`/hospital/${hospital.id}`} className="btn btn-sm btn-primary">
                  View Doctors & Book Slots
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
