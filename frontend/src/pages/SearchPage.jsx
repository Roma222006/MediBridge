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
  Calendar,
  BedDouble,
  Activity,
  Phone,
  Stethoscope,
  Sparkles
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

      {/* User Guidance Banner */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--color-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <span style={{ fontWeight: '700', color: 'var(--color-heading)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            Hospital Discovery & Real-Time Capacity
          </span>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Search verified healthcare facilities in Coimbatore. View real-time General & ICU bed counts, check CMCHIS government scheme empanelment, and book appointments with verified specialists.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.75rem' }}>
            Live Bed Socket: Active
          </span>
        </div>
      </div>

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

      {/* Hospital Results: Spacious, Well-Structured Hospital Cards */}
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
        <div className="hospital-discovery-list">
          {hospitals.map((hospital) => {
            const generalAvailable = hospital.bedCapacity?.general?.available ?? 0;
            const generalTotal = hospital.bedCapacity?.general?.total ?? 1;
            const icuAvailable = hospital.bedCapacity?.icu?.available ?? 0;
            const icuTotal = hospital.bedCapacity?.icu?.total ?? 1;

            const generalPct = Math.min(100, Math.round((generalAvailable / Math.max(1, generalTotal)) * 100));
            const icuPct = Math.min(100, Math.round((icuAvailable / Math.max(1, icuTotal)) * 100));

            return (
              <article key={hospital.id} className="hospital-card">
                {/* 1. Header Zone: Identity, Metadata, Pricing & CTA */}
                <div className="hospital-card-header">
                  <div className="hospital-card-identity">
                    <div className="hospital-title-row">
                      <h3 className="hospital-name">
                        <Link to={`/hospital/${hospital.id}`}>
                          {hospital.name}
                        </Link>
                      </h3>
                      <span className="badge badge-info hospital-type-badge">
                        {hospital.type.replace('_', ' ').toUpperCase()}
                      </span>
                      {hospital.bedCapacity.isStale && (
                        <span className="badge badge-warning">
                          <Clock size={11} strokeWidth={1.75} aria-hidden="true" />
                          <span>STALE DATA</span>
                        </span>
                      )}
                    </div>

                    <div className="hospital-meta-row">
                      <span className="hospital-meta-item">
                        <MapPin size={14} className="hospital-meta-icon" aria-hidden="true" />
                        <span>
                          {hospital.address.area ? `${hospital.address.area}, ` : ''}
                          {hospital.address.city}, {hospital.address.district}
                        </span>
                      </span>
                      <span className="hospital-meta-dot">&bull;</span>
                      <span className="hospital-meta-item">
                        <Phone size={14} className="hospital-meta-icon" aria-hidden="true" />
                        <span>{hospital.phone}</span>
                      </span>
                      {hospital.distanceKm && (
                        <>
                          <span className="hospital-meta-dot">&bull;</span>
                          <span className="hospital-meta-item hospital-meta-distance">
                            <strong>{hospital.distanceKm} km</strong> away
                          </span>
                        </>
                      )}
                      <span className="hospital-meta-dot">&bull;</span>
                      <span className="hospital-meta-item">
                        <Stethoscope size={14} className="hospital-meta-icon" aria-hidden="true" />
                        <span>
                          {hospital.doctorsCount > 0
                            ? `${hospital.doctorsCount} Doctor${hospital.doctorsCount > 1 ? 's' : ''}`
                            : 'OPD Care'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Header Action & Pricing */}
                  <div className="hospital-card-action">
                    <div className="hospital-fee-tag">
                      <span className="hospital-fee-label">Consultation Fee</span>
                      <span className="hospital-fee-value">
                        {hospital.minPrice > 0 ? `From ₹${hospital.minPrice}` : 'Free (Govt Facility)'}
                      </span>
                    </div>
                    <Link
                      to={`/hospital/${hospital.id}`}
                      className="btn btn-primary hospital-cta-btn"
                    >
                      <span>View Doctors & Book Slots</span>
                      <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* 2. Stale Capacity Warning Alert Banner */}
                {hospital.bedCapacity.isStale && (
                  <div className="hospital-stale-alert" role="alert">
                    <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>
                      <strong>Capacity Alert:</strong> Last reported update was {hospital.bedCapacity.general.minutesAgo} minutes ago (&gt;2 hours). Please confirm availability with casualty prior to travel.
                    </span>
                  </div>
                )}

                {/* 3. Metrics Grid: General Beds, ICU Beds, Next Open Slot, Schemes */}
                <div className="hospital-metrics-grid">
                  {/* Metric Box 1: General Ward Beds */}
                  <div className="hospital-metric-box">
                    <div className="hospital-metric-header">
                      <BedDouble size={14} className="hospital-metric-icon" aria-hidden="true" />
                      <span className="hospital-metric-label">General Beds</span>
                    </div>
                    <div className="hospital-metric-value-row">
                      <span className="hospital-metric-number">{generalAvailable}</span>
                      <span className="hospital-metric-total">/ {generalTotal} open</span>
                    </div>
                    <div className="hospital-metric-progress">
                      <div
                        className="hospital-metric-progress-fill"
                        style={{
                          width: `${generalPct}%`,
                          backgroundColor: generalAvailable > 10 ? 'var(--status-success-accent)' : 'var(--status-warning-accent)'
                        }}
                      />
                    </div>
                    <span className="hospital-metric-subtext">
                      Updated {hospital.bedCapacity?.general?.minutesAgo ?? 0} min ago
                    </span>
                  </div>

                  {/* Metric Box 2: ICU Critical Care */}
                  <div className="hospital-metric-box">
                    <div className="hospital-metric-header">
                      <Activity size={14} className="hospital-metric-icon" aria-hidden="true" />
                      <span className="hospital-metric-label">ICU Critical Care</span>
                    </div>
                    <div className="hospital-metric-value-row">
                      <span
                        className="hospital-metric-number"
                        style={{
                          color: icuAvailable > 0 ? 'var(--status-success-accent)' : 'var(--status-critical-solid)'
                        }}
                      >
                        {icuAvailable}
                      </span>
                      <span className="hospital-metric-total">/ {icuTotal} open</span>
                    </div>
                    <div className="hospital-metric-progress">
                      <div
                        className="hospital-metric-progress-fill"
                        style={{
                          width: `${icuPct}%`,
                          backgroundColor: icuAvailable > 0 ? 'var(--status-success-accent)' : 'var(--status-critical-solid)'
                        }}
                      />
                    </div>
                    <span className="hospital-metric-subtext">
                      {icuAvailable > 0 ? 'Trauma triage ready' : 'Critical triage full'}
                    </span>
                  </div>

                  {/* Metric Box 3: Next Available Slot */}
                  <div className="hospital-metric-box">
                    <div className="hospital-metric-header">
                      <Calendar size={14} className="hospital-metric-icon" aria-hidden="true" />
                      <span className="hospital-metric-label">Next Open Slot</span>
                    </div>
                    <div className="hospital-metric-value-row">
                      {hospital.nextAvailableSlot ? (
                        <span className="hospital-slot-badge">
                          {hospital.nextAvailableSlot.date} {hospital.nextAvailableSlot.startTime}
                        </span>
                      ) : (
                        <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--status-critical-text)', fontWeight: '600' }}>
                          No slots open
                        </span>
                      )}
                    </div>
                    <span className="hospital-metric-subtext">
                      {hospital.nextAvailableSlot ? (
                        <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                          {hospital.nextAvailableSlot.type.replace('_', ' ').toUpperCase()}
                        </span>
                      ) : (
                        'Check alternative dates'
                      )}
                    </span>
                  </div>

                  {/* Metric Box 4: Insurance & Welfare Schemes */}
                  <div className="hospital-metric-box">
                    <div className="hospital-metric-header">
                      <ShieldCheck size={14} className="hospital-metric-icon" aria-hidden="true" />
                      <span className="hospital-metric-label">Insurance & Schemes</span>
                    </div>
                    <div className="hospital-schemes-wrap">
                      {hospital.schemesSupported && hospital.schemesSupported.length > 0 ? (
                        hospital.schemesSupported.map((sch) => (
                          <span key={sch} className="badge badge-neutral hospital-scheme-tag">
                            {sch.replace('_', ' ').toUpperCase()}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct Cash / Card</span>
                      )}
                    </div>
                    <span className="hospital-metric-subtext">
                      Verified institutional desk
                    </span>
                  </div>
                </div>

                {/* 4. Footer Zone: Diagnostic Facilities & Scans */}
                {hospital.servicesSample && hospital.servicesSample.length > 0 && (
                  <div className="hospital-card-footer">
                    <div className="hospital-footer-title">
                      <Sparkles size={13} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                      <span>Key Diagnostics & Scans:</span>
                    </div>
                    <div className="hospital-services-chips">
                      {hospital.servicesSample.map((srv) => (
                        <span key={srv.id} className="hospital-service-chip">
                          <span>{srv.name}</span>
                          <span className="hospital-service-chip-price">₹{srv.price}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
