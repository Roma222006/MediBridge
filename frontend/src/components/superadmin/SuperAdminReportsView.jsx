import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart3,
  Calendar,
  Download,
  Building2,
  Users,
  Stethoscope,
  Send,
  RefreshCw,
  FileText,
  Activity,
  Layers,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function SuperAdminReportsView({ onToast }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/reports', { params: { range: dateRange } });
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('[Reports] Error loading reports:', err);
      if (onToast) onToast('Failed to generate platform report aggregates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportCsv = () => {
    if (!reportData) return;

    let csv = `MediBridge Statewide Platform Healthcare Report\n`;
    csv += `Generated At,${new Date().toISOString()}\n`;
    csv += `Reporting Period,${reportData.period}\n\n`;

    csv += `Category,Metric,Value\n`;
    csv += `Hospitals,Total Registered,${reportData.hospitals.total}\n`;
    csv += `Hospitals,Approved & Empanelled,${reportData.hospitals.approved}\n`;
    csv += `Hospitals,Pending Approval,${reportData.hospitals.pending}\n`;
    csv += `Hospitals,Suspended,${reportData.hospitals.suspended}\n`;
    csv += `Users,Total Registered,${reportData.users.total}\n`;
    csv += `Users,Patients,${reportData.users.patients}\n`;
    csv += `Users,Doctors,${reportData.users.doctors}\n`;
    csv += `Users,Hospital Admins,${reportData.users.hospitalAdmins}\n`;
    csv += `Appointments,Total In Period,${reportData.appointments.total}\n`;
    csv += `Appointments,Confirmed,${reportData.appointments.confirmed}\n`;
    csv += `Appointments,In-Person Consultations,${reportData.appointments.inPerson}\n`;
    csv += `Appointments,Teleconsultations,${reportData.appointments.teleconsult}\n`;
    csv += `Referrals,Total Initiated,${reportData.referrals.total}\n`;
    csv += `Referrals,Accepted Tertiary,${reportData.referrals.accepted}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medibridge_state_report_${dateRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (onToast) onToast('Platform report exported successfully as CSV.');
  };

  const h = reportData?.hospitals || {};
  const u = reportData?.users || {};
  const a = reportData?.appointments || {};
  const d = reportData?.doctors || {};
  const r = reportData?.referrals || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.625rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            Statewide Platform Reports & Analytics
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Comprehensive institutional onboarding trends, appointment volume, and referral flow.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Range Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--border, #E8E3E5)',
                fontSize: '0.8125rem',
                backgroundColor: '#FFFFFF',
                color: 'var(--color-heading, #702B59)',
                fontWeight: '700'
              }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="365d">Last 365 Days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!reportData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary, #B83D83)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: reportData ? 'pointer' : 'not-allowed'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', padding: '60px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
          Generating real aggregated analytics...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Hospitals & Users Aggregates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Hospital Onboarding Report Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', padding: '24px', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
                <Building2 size={20} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  Hospital Onboarding & Accreditation
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>Total Registered</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>{h.total || 0}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#DCFCE7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803D' }}>Empanelled</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803D' }}>{h.approved || 0}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#B77A32' }}>Pending Review</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#B77A32' }}>{h.pending || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)' }}>
                <strong>Facility Distribution:</strong>{' '}
                {h.distribution?.map((d, i) => (
                  <span key={i} style={{ marginRight: '10px' }}>
                    {d._id?.replace('_', ' ') || 'General'}: <strong>{d.count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Platform Users Report Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', padding: '24px', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
                <Users size={20} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  Platform Demographics & Adoption
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>Total Users</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>{u.total || 0}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>Patients</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary, #B83D83)' }}>{u.patients || 0}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>Doctors</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#6B21A8' }}>{u.doctors || 0}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>Admins</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E40AF' }}>{u.hospitalAdmins || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)' }}>
                Account Health: <strong style={{ color: '#15803D' }}>{u.active || 0} Active</strong> &bull;{' '}
                <strong style={{ color: '#B83245' }}>{u.suspended || 0} Suspended</strong>
              </div>
            </div>
          </div>

          {/* 2. Consultations & Referrals Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Appointments Report Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', padding: '24px', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
                <Calendar size={20} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  OPD & Teleconsultation Operations
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>Consultations</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>{a.total || 0}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#DCFCE7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803D' }}>Confirmed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803D' }}>{a.confirmed || 0}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>In-Person / Online</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-primary, #B83D83)', marginTop: '4px' }}>
                    {a.inPerson || 0} / {a.teleconsult || 0}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
                Cancellation rate: {a.total > 0 ? ((a.cancelled / a.total) * 100).toFixed(1) : 0}% &bull; Completed appointments: {a.completed || 0}
              </div>
            </div>

            {/* Tertiary Referrals Report Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', padding: '24px', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
                <Send size={20} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  Inter-Hospital Tertiary Referrals
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>Total Dispatched</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>{r.total || 0}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#DCFCE7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#15803D' }}>Accepted</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803D' }}>{r.accepted || 0}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#B77A32' }}>In Transit / Triage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#B77A32' }}>{r.pending || 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
                Transfers completed with destination hospital admission: <strong>{r.completed || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
