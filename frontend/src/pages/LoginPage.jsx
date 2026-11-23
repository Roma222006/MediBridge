import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hospital, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, Stethoscope, Building2, SlidersHorizontal, Lock, CheckCircle2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'patient') navigate('/patient-dashboard');
      else if (user.role === 'doctor') navigate('/doctor-portal');
      else if (user.role === 'hospital_admin' || user.role === 'super_admin') navigate('/admin-console');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      const user = await login(demoEmail, demoPass);
      if (user.role === 'patient') navigate('/patient-dashboard');
      else if (user.role === 'doctor') navigate('/doctor-portal');
      else if (user.role === 'hospital_admin' || user.role === 'super_admin') navigate('/admin-console');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed.');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 120px)',
        backgroundImage: 'linear-gradient(135deg, rgba(252, 239, 237, 0.88) 0%, rgba(248, 221, 227, 0.82) 50%, rgba(184, 61, 131, 0.22) 100%), url("/hospital-login-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '36px 32px',
          boxShadow: '0 20px 40px rgba(112, 43, 89, 0.12)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '12px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '50%',
              color: 'var(--color-primary)',
              border: '1px solid var(--border)',
              marginBottom: '12px'
            }}
          >
            <Hospital size={32} strokeWidth={1.75} />
          </div>
          <h1
            style={{
              margin: '0',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.75rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              color: 'var(--color-heading)'
            }}
          >
            Medi<span style={{ color: 'var(--color-primary)' }}>Bridge</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Hospital Healthcare Coordination & Multi-Portal Gateway
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--status-critical-bg)',
              color: 'var(--status-critical-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-control)',
              marginBottom: '20px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid var(--status-critical-solid)'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. roma.patient@medibridge.org"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter account password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            style={{ width: '100%', height: '42px', fontSize: '0.9375rem', fontWeight: '700' }}
          >
            {submitting ? 'Verifying Credentials...' : 'Sign In to Portal'}
          </Button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-heading)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Instant 1-Click Role Access (Demo)
            </span>
            <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.7rem' }}>
              Pre-configured Roles
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<UserCheck size={14} />}
              onClick={() => handleQuickDemo('roma.patient@medibridge.org', 'PatientPass123!')}
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              Patient Portal
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Stethoscope size={14} />}
              onClick={() => handleQuickDemo('dr.revathi@medibridge.org', 'DoctorPass123!')}
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              Doctor Portal
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Building2 size={14} />}
              onClick={() => handleQuickDemo('admin.kmch@medibridge.org', 'AdminPass123!')}
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              Hospital Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<SlidersHorizontal size={14} />}
              onClick={() => handleQuickDemo('superadmin@medibridge.org', 'SuperAdmin123!')}
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              Super Admin
            </Button>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Protected under DPDP Act 2023 &bull; Synthetic Health Demonstration</span>
        </div>
      </div>
    </div>
  );
}
