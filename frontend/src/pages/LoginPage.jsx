import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hospital, AlertCircle, Eye, EyeOff, ArrowRight, UserCheck, Stethoscope, Building2, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import hospitalBg from '../assets/hospital-login-bg.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'patient') {
        navigate('/patient-dashboard');
      } else if (user.role === 'doctor') {
        navigate('/doctor-portal');
      } else if (user.role === 'hospital_admin') {
        navigate('/admin-console');
      } else if (user.role === 'super_admin') {
        navigate('/admin-console?tab=platform');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        fontFamily: 'var(--font-body, "Inter", sans-serif)'
      }}
    >
      {/* LEFT SECTION: Authentication Form (~40%) */}
      <div
        style={{
          flex: '0 0 42%',
          minWidth: '380px',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 40px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          zIndex: 2,
          boxShadow: '4px 0 24px rgba(112, 43, 89, 0.04)'
        }}
      >
        {/* Brand Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-blush-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              <Hospital size={24} strokeWidth={1.75} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '1.375rem',
                fontWeight: '800',
                letterSpacing: '-0.02em'
              }}
            >
              <span style={{ color: 'var(--color-heading)' }}>Medi</span>
              <span style={{ color: 'var(--color-primary)' }}>Bridge</span>
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h1
              style={{
                margin: '0 0 8px 0',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '1.75rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: 'var(--color-heading)'
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '0.9375rem',
                color: 'var(--text-muted)',
                lineHeight: '1.5'
              }}
            >
              Sign in to access your healthcare portal.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--status-critical-bg)',
                color: 'var(--status-critical-text)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                marginBottom: '20px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--status-critical-solid)'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)',
                  marginBottom: '6px'
                }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.org"
                required
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border-control)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-control)')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--color-heading)'
                  }}
                >
                  Password
                </label>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 40px 0 14px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--border-control)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-control)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              variant="primary"
              style={{
                width: '100%',
                height: '44px',
                fontSize: '0.9375rem',
                fontWeight: '700',
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* Quick Demo Credentials Fill Pills */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Instant 1-Click Role Login
              </span>
              <span className="badge badge-pill badge-neutral" style={{ fontSize: '0.6875rem' }}>
                Demo Environment
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleFillDemo('roma.patient@medibridge.org', 'PatientPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-pale-rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <UserCheck size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Patient Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('dr.revathi@medibridge.org', 'DoctorPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-pale-rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <Stethoscope size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Doctor Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('admin.kmch@medibridge.org', 'AdminPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-pale-rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <Building2 size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Hospital Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('superadmin@medibridge.org', 'SuperAdmin123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-pale-rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Protected under DPDP Act 2023 &bull; Synthetic Health Demonstration</span>
        </div>
      </div>

      {/* RIGHT SECTION: Healthcare Hospital Illustration (~58%-60%) */}
      <div
        style={{
          flex: '1 1 58%',
          minHeight: '100vh',
          backgroundImage: `url(${hospitalBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        {/* Subtle gradient vignette to blend smoothly into the left border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(255,255,255,0.08) 0%, transparent 15%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
}
