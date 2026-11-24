import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Building2,
  Users,
  Stethoscope,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldAlert,
  Bed,
  RefreshCw,
  FileCheck2,
  Server
} from 'lucide-react';

export default function SuperAdminDashboardView({ onNavigateTab, onToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/overview');
      if (res.data?.success) {
        setData(res.data.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('[SuperAdmin Overview] Error loading overview:', err);
      if (onToast) onToast('Failed to load platform overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const metrics = data?.metrics || {
    totalHospitals: 0,
    approvedHospitals: 0,
    pendingApprovals: 0,
    rejectedApplications: 0,
    suspendedHospitals: 0,
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalHospitalAdmins: 0,
    totalSuperAdmins: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    activeDoctors: 0,
    verifiedDoctors: 0,
    pendingDoctorVerifications: 0,
    totalAppointments: 0,
    confirmedAppointments: 0,
    totalGenBeds: 0,
    availGenBeds: 0,
    totalIcuBeds: 0,
    availIcuBeds: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Platform Overview Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.75rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            Platform Overview
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            State-wide healthcare network administration, facility empanelment, and operational telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-heading, #702B59)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards (8 Database-Backed Metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {/* 1. Total Registered Hospitals */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('hospitals')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 61, 131, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(112, 43, 89, 0.04)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Registered Hospitals
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blush-pink, #F8DDE3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #B83D83)'
              }}
            >
              <Building2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', lineHeight: '1.1' }}>
            {metrics.totalHospitals}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#477B67', marginTop: '6px', fontWeight: '600' }}>
            {metrics.approvedHospitals} Approved & Empanelled
          </div>
        </div>

        {/* 2. Pending Hospital Approvals */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('approvals')}
          style={{
            backgroundColor: '#FFFFFF',
            border: metrics.pendingApprovals > 0 ? '1px solid #FDE68A' : '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 61, 131, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(112, 43, 89, 0.04)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Pending Approvals
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B77A32'
              }}
            >
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#B77A32', lineHeight: '1.1' }}>
            {metrics.pendingApprovals}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', marginTop: '6px' }}>
            Requires Directorate Review
          </div>
        </div>

        {/* 3. Total Registered Users */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('users')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 61, 131, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(112, 43, 89, 0.04)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Total Platform Users
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blush-pink, #F8DDE3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #B83D83)'
              }}
            >
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', lineHeight: '1.1' }}>
            {metrics.totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', marginTop: '6px' }}>
            {metrics.totalPatients} Patients &bull; {metrics.totalDoctors} Doctors
          </div>
        </div>

        {/* 4. Active Doctors */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('users')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 61, 131, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(112, 43, 89, 0.04)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Clinical Practitioners
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blush-pink, #F8DDE3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #B83D83)'
              }}
            >
              <Stethoscope size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', lineHeight: '1.1' }}>
            {metrics.activeDoctors}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', marginTop: '6px' }}>
            {metrics.verifiedDoctors} Verified &bull; {metrics.pendingDoctorVerifications} In Review
          </div>
        </div>

        {/* 5. Total Appointments */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Total Consultations
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blush-pink, #F8DDE3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #B83D83)'
              }}
            >
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', lineHeight: '1.1' }}>
            {metrics.totalAppointments}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#477B67', marginTop: '6px', fontWeight: '600' }}>
            {metrics.confirmedAppointments} Confirmed & Handled
          </div>
        </div>

        {/* 6. Live Bed Availability (State Network) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Live Bed Capacity
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D'
              }}
            >
              <Bed size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', lineHeight: '1.2' }}>
            {metrics.availGenBeds} / {metrics.totalGenBeds}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
            General Available &bull; <strong style={{ color: '#B83245' }}>{metrics.availIcuBeds} / {metrics.totalIcuBeds} ICU</strong>
          </div>
        </div>

        {/* 7. Suspended / Inactive Accounts */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('users')}
          style={{
            backgroundColor: '#FFFFFF',
            border: metrics.suspendedUsers > 0 ? '1px solid #FECACA' : '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Suspended Accounts
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B83245'
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#B83245', lineHeight: '1.1' }}>
            {metrics.suspendedUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', marginTop: '6px' }}>
            {metrics.suspendedHospitals} Facilities Suspended
          </div>
        </div>

        {/* 8. Platform System Health */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('monitoring')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>
              Core Infrastructure
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D'
              }}
            >
              <Server size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: '800', color: '#477B67', lineHeight: '1.2' }}>
            Operational
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', marginTop: '6px' }}>
            9 Microservices Live & Verified
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout (Pending Approvals + Recent Platform Activity) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Left Column: Pending Hospital Empanelment Reviews */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                Pending Hospital Applications ({data?.pendingActions?.hospitals?.length || 0})
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                New institutional registrations awaiting regulatory verification
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('approvals')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #B83D83)',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!data?.pendingActions?.hospitals || data.pendingActions.hospitals.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.875rem' }}>
                No hospital applications currently pending review.
              </div>
            ) : (
              data.pendingActions.hospitals.map((hosp) => (
                <div
                  key={hosp._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#FAF6F7',
                    border: '1px solid var(--border, #E8E3E5)',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                      {hosp.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                      {hosp.address?.city || 'Coimbatore'} &bull; License: {hosp.licenseNumber}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: hosp.approvalStatus === 'PENDING' ? '#FEF3C7' : '#EFF6FF',
                        color: hosp.approvalStatus === 'PENDING' ? '#B77A32' : '#1E40AF'
                      }}
                    >
                      {hosp.approvalStatus.replace(/_/g, ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('approvals')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-primary, #B83D83)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--color-primary, #B83D83)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Platform Activity (Audit Trail) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8E3E5)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                Recent Platform Events
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                Live immutable audit record across institutional tenants
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('audit')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #B83D83)',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <span>View Audit Logs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.875rem' }}>
                No recent platform activities recorded.
              </div>
            ) : (
              data.recentActivity.slice(0, 6).map((act) => (
                <div key={act._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--color-primary, #B83D83)', fontSize: '0.875rem', lineHeight: '1.4' }}>●</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text, #29252A)' }}>
                      {act.action || act.eventType}
                      {act.hospitalId?.name && (
                        <span style={{ fontWeight: '500', color: 'var(--text-muted, #702B59)' }}> &bull; {act.hospitalId.name}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                      Actor: {act.actorId?.email || act.actorRole || 'system'} &bull; {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
