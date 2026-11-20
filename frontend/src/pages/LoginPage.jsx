import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, AlertTriangle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
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
    <div className="main-content" style={{ maxWidth: '480px', margin: '40px auto 60px' }}>
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 28px',
          boxShadow: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '12px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-primary)',
              border: '1px solid var(--border)'
            }}
          >
            <Building2 size={32} />
          </div>
          <h2 style={{ margin: '14px 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>
            Sign in to <span style={{ color: 'var(--color-heading)' }}>Medi</span><span style={{ color: 'var(--color-primary)' }}>Bridge</span>
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Authorized healthcare coordination & clinical portal access
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--status-critical-bg)',
              color: 'var(--status-critical-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
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
              placeholder="Enter password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            style={{ width: '100%' }}
          >
            {submitting ? 'Verifying Credentials...' : 'Sign In'}
          </Button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              1-Click Demo Profiles
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demo, not verified</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemo('roma.patient@medibridge.org', 'PatientPass123!')}
            >
              Patient (Roma)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemo('dr.revathi@medibridge.org', 'DoctorPass123!')}
            >
              Doctor (City)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemo('admin.kmch@medibridge.org', 'AdminPass123!')}
            >
              Hospital Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemo('superadmin@medibridge.org', 'SuperAdmin123!')}
            >
              Super Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
