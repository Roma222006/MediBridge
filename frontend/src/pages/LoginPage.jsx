import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hospital, AlertCircle, Eye, EyeOff, Mail, Lock, UserCheck, Stethoscope, Building2, ShieldCheck } from 'lucide-react';
import hospitalBg from '../assets/hospital-login-bg.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      {/* LEFT SECTION: Authentication Card / Form (~40%) */}
      <div
        style={{
          flex: '0 0 42%',
          minWidth: '380px',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 40px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          zIndex: 2,
          boxShadow: '4px 0 24px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div>
          {/* Logo & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Hospital size={26} strokeWidth={1.75} style={{ color: 'var(--color-primary)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em'
                }}
              >
                <span style={{ color: 'var(--color-heading)' }}>Medi</span>
                <span style={{ color: 'var(--color-primary)' }}>Bridge</span>
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Hospital Healthcare Coordination Platform
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'left', marginBottom: '28px' }}>
            <h1
              style={{
                margin: '0 0 6px 0',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '1.625rem',
                fontWeight: '800',
                color: 'var(--color-heading)'
              }}
            >
              Welcome Back
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px 0 40px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 40px 0 40px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                fontSize: '0.8125rem'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>Remember me</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontSize: '0.9375rem',
                fontWeight: '700',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 2px 8px rgba(184, 61, 131, 0.25)'
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Registration link */}
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer' }}>
              Register
            </span>
          </div>

          {/* Quick Demo Fill Buttons for Evaluation */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Instant Demo Access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleFillDemo('roma.patient@medibridge.org', 'PatientPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)'
                }}
              >
                <UserCheck size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('dr.revathi@medibridge.org', 'DoctorPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)'
                }}
              >
                <Stethoscope size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin.kmch@medibridge.org', 'AdminPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)'
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
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-heading)'
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Protected under DPDP Act 2023 &bull; Synthetic Health Demonstration
        </div>
      </div>

      {/* RIGHT SECTION: Healthcare Hospital Illustration (~58%) */}
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(255,255,255,0.06) 0%, transparent 15%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
}
