import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import {
  Search,
  MapPin,
  Clock,
  Filter,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BedDouble
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import DemoAccountSwitcher from '../components/DemoAccountSwitcher';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

export default function SearchPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [scheme, setScheme] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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

  const handleClearFilters = () => {
    setQuery('');
    setSpecialty('');
    setScheme('');
    setSortBy('distance');
  };

  const hasActiveFilters = Boolean(query || specialty || scheme || sortBy !== 'distance');

  return (
    <div>
      {/* 1-Click Role Switcher for Live Demo */}
      <DemoAccountSwitcher />

      <PageHeader
        breadcrumbs={[{ label: 'Healthcare Network', href: '/' }, { label: 'Discovery & Live Availability' }]}
        title="Hospital Discovery & Live Availability"
        subtitle="Real-time facility capacity, specialist schedules, and verified scheme acceptance across Tamil Nadu."
      />

      {/* Full-width Search Bar and Aligned Filter Controls */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Top row: full-width search input with search button */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search hospital name, diagnostic scan (e.g. MRI Brain), or area..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ paddingLeft: '38px', height: '40px' }}
                  aria-label="Search facility, doctor, or diagnostic service"
                />
              </div>
              <Button type="submit" variant="primary" icon={Search}>
                Search
              </Button>
            </div>

            {/* Filter Controls Row */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '180px' }}>
                <label htmlFor="filter-specialty" className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                  Specialty:
                </label>
                <select
                  id="filter-specialty"
                  className="form-select"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  style={{ height: '36px', fontSize: 'var(--text-label-md)' }}
                >
                  <option value="">All Specialties</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Radiology">Radiology (MRI / CT)</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '200px' }}>
                <label htmlFor="filter-scheme" className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                  Scheme:
                </label>
                <select
                  id="filter-scheme"
                  className="form-select"
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  style={{ height: '36px', fontSize: 'var(--text-label-md)' }}
                >
                  <option value="">All Schemes</option>
                  <option value="pmjay">Ayushman Bharat (PM-JAY)</option>
                  <option value="cmchis">CMCHIS (Tamil Nadu)</option>
                  <option value="private_star">Star Health Insurance</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '180px' }}>
                <label htmlFor="filter-sort" className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                  Sort:
                </label>
                <select
                  id="filter-sort"
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ height: '36px', fontSize: 'var(--text-label-md)' }}
                >
                  <option value="distance">Nearest Distance</option>
                  <option value="price">Lowest Consultation Fee</option>
                  <option value="next_slot">Earliest Open Slot</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-dense btn-tertiary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={14} strokeWidth={1.75} aria-hidden="true" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>Active filters:</span>
          {query && (
            <span className="badge badge-neutral">
              Query: "{query}"
            </span>
          )}
          {specialty && (
            <span className="badge badge-info">
              Specialty: {specialty}
            </span>
          )}
          {scheme && (
            <span className="badge badge-info">
              Scheme: {scheme.toUpperCase()}
            </span>
          )}
          {sortBy !== 'distance' && (
            <span className="badge badge-neutral">
              Sort: {sortBy}
            </span>
          )}
        </div>
      )}

      {/* Hospital Results: Single-Column Dense List with Dividers */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Querying real-time capacity and active schedules across network...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p className="empty-state-message">No healthcare facilities matched your selected criteria.</p>
          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            Reset Filter Criteria
          </Button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {hospitals.map((hospital, idx) => (
            <article
              key={hospital.id}
              style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: idx < hospitals.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.6fr auto',
                gap: 'var(--space-4)',
                alignItems: 'center'
              }}
            >
              {/* Left Block: Facility Info, Distance, Specialties */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 'var(--text-card)', margin: 0 }}>
                    <Link to={`/hospital/${hospital.id}`} style={{ color: 'var(--color-heading)', textDecoration: 'none' }}>
                      {hospital.name}
                    </Link>
                  </h3>
                  <span className="badge badge-info">
                    {hospital.type.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px', fontSize: 'var(--text-label-md)', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
                    <span>{hospital.address.city}, {hospital.address.district}</span>
                  </span>
                  <span>&bull;</span>
                  <span>{hospital.distanceKm ? `${hospital.distanceKm} km away` : 'Coimbatore'}</span>
                  <span>&bull;</span>
                  <span>Phone: {hospital.phone}</span>
                </div>

                {/* Diagnostic Services Sample */}
                {hospital.servicesSample && hospital.servicesSample.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>
                    <span>Key Diagnostics: </span>
                    <span style={{ color: 'var(--text)' }}>
                      {hospital.servicesSample.map(s => s.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Block: Live Capacity, Stale Warning, Next Slot, Fee, Schemes */}
              <div>
                {/* Stale Warning Banner if >120m */}
                {hospital.bedCapacity.isStale && (
                  <div
                    style={{
                      backgroundColor: 'var(--status-warning-bg)',
                      borderLeft: '3px solid var(--status-warning-accent)',
                      padding: '4px 8px',
                      marginBottom: '8px',
                      fontSize: 'var(--text-label)',
                      color: 'var(--status-warning-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertTriangle size={13} strokeWidth={1.75} aria-hidden="true" />
                    <span>Reported capacity update exceeds 2 hours ({hospital.bedCapacity.general.minutesAgo} min ago). Verify before travel.</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
                  {/* General Beds */}
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      General Beds
                    </span>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--text)' }}>
                      {hospital.bedCapacity.general.available} / {hospital.bedCapacity.general.total} open
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Updated {hospital.bedCapacity.general.minutesAgo} min ago
                    </div>
                  </div>

                  {/* ICU Beds */}
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ICU Beds
                    </span>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: hospital.bedCapacity.icu.available > 0 ? 'var(--status-success-text)' : 'var(--status-critical-text)' }}>
                      {hospital.bedCapacity.icu.available} / {hospital.bedCapacity.icu.total} open
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Updated {hospital.bedCapacity.icu.minutesAgo} min ago
                    </div>
                  </div>

                  {/* Next Slot */}
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Next Open Slot
                    </span>
                    {hospital.nextAvailableSlot ? (
                      <div style={{ fontWeight: '600', color: 'var(--color-primary)', fontSize: 'var(--text-body-staff)' }}>
                        {hospital.nextAvailableSlot.date} {hospital.nextAvailableSlot.startTime}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--status-critical-text)', fontSize: 'var(--text-label)' }}>
                        No slots open
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Fee: {hospital.minPrice > 0 ? `₹${hospital.minPrice}` : 'Free (Govt)'}
                    </div>
                  </div>

                  {/* Supported Schemes */}
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Schemes
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {hospital.schemesSupported.map((sch) => (
                        <span key={sch} className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                          {sch.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Column: Single Magenta Button */}
              <div style={{ textAlign: 'right' }}>
                <Link
                  to={`/hospital/${hospital.id}`}
                  className="btn btn-dense btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <span>View Doctors & Book Slots</span>
                  <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
