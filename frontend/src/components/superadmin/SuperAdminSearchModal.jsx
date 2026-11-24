import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Search,
  Building2,
  Stethoscope,
  Users,
  Layers,
  X,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function SuperAdminSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    hospitals: [],
    doctors: [],
    users: [],
    services: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ hospitals: [], doctors: [], users: [], services: [] });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ hospitals: [], doctors: [], users: [], services: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get('/super-admin/search', { params: { q: query.trim() } });
        if (res.data?.success) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error('[Global Search] Error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.hospitals.length +
    results.doctors.length +
    results.users.length +
    results.services.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '20px',
        paddingRight: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border, #E8E3E5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border, #E8E3E5)', gap: '12px' }}>
          <Search size={20} style={{ color: 'var(--color-primary, #B83D83)' }} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospitals, doctors, users, departments across Tamil Nadu network..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text, #29252A)',
              fontFamily: 'var(--font-body, "Inter", sans-serif)'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.875rem' }}>
              Searching platform records...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.875rem' }}>
              No platform records matching &ldquo;<strong>{query}</strong>&rdquo;
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.8125rem' }}>
              Type hospital name, license number, doctor specialty, or email to search statewide network.
            </div>
          )}

          {/* 1. Hospitals Category */}
          {results.hospitals.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Building2 size={14} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <span>Hospitals ({results.hospitals.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.hospitals.map((h) => (
                  <div
                    key={h._id}
                    onClick={() => {
                      if (onNavigate) onNavigate('hospitals', h._id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FAF6F7',
                      cursor: 'pointer',
                      border: '1px solid var(--border, #E8E3E5)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading, #702B59)' }}>{h.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                        {h.address?.city} &bull; Lic: {h.licenseNumber}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                      {h.approvalStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Doctors Category */}
          {results.doctors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Stethoscope size={14} style={{ color: '#6B21A8' }} />
                <span>Clinical Doctors ({results.doctors.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.doctors.map((d) => (
                  <div
                    key={d._id}
                    onClick={() => {
                      if (onNavigate) onNavigate('users', d._id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FAF6F7',
                      cursor: 'pointer',
                      border: '1px solid var(--border, #E8E3E5)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading, #702B59)' }}>{d.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                        {d.specialty} &bull; Reg: {d.regNumber} &bull; {d.hospitalId?.name || 'Hospital'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FAF5FF', color: '#6B21A8' }}>
                      {d.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Users Category */}
          {results.users.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Users size={14} style={{ color: '#1E40AF' }} />
                <span>Platform Users ({results.users.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      if (onNavigate) onNavigate('users', u._id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FAF6F7',
                      cursor: 'pointer',
                      border: '1px solid var(--border, #E8E3E5)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text, #29252A)' }}>{u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                        Role: {u.role} &bull; Status: {u.accountStatus || 'ACTIVE'}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--color-primary, #B83D83)' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
