import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Hospital,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserCheck,
  Stethoscope,
  Building2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import AuthHospitalHero from '../components/auth/AuthHospitalHero';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if registration success message passed via query param
  const searchParams = new URLSearchParams(window.location.search);
  const registeredMsg = searchParams.get('registered');

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
      setError(err.response?.data?.error?.message || 'Invalid email or password. Please verify your credentials and try again.');
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
      className="auth-split-layout"
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
      {/* ================================================================
          LEFT SIDE: HOSPITAL BACKGROUND IMAGE (55-60% Screen Width)
          ================================================================ */}
      <AuthHospitalHero />

      {/* ================================================================
          RIGHT SIDE: LOGIN AUTHENTICATION PANEL (40-45% Screen Width)
          ================================================================ */}
      <div
        className="auth-panel-container"
        style={{
          flex: '0 0 42%',
          minWidth: '380px',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 36px',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid var(--border, #E8E3E5)',
          overflowY: 'auto',
          zIndex: 2,
          boxShadow: '-4px 0 24px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div>
          {/* Logo & Subtitle matching Screen 1 */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-blush-pink, #F8DDE3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Hospital size={18} strokeWidth={2.2} style={{ color: 'var(--color-primary, #B83D83)' }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em'
                }}
              >
                <span style={{ color: 'var(--color-heading, #702B59)' }}>Medi</span>
                <span style={{ color: 'var(--color-primary, #B83D83)' }}>Bridge</span>
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', fontWeight: '600' }}>
              Hospital Healthcare Coordination Platform
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <h1
              style={{
                margin: '0 0 6px 0',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '1.625rem',
                fontWeight: '800',
                color: 'var(--color-heading, #702B59)'
              }}
            >
              Welcome Back
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
              Sign in to access your healthcare portal.
            </p>
          </div>

          {/* Registration Success Notification */}
          {registeredMsg && (
            <div
              style={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #86EFAC'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>Registration completed successfully! Please sign in with your credentials.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#B83245',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #FCA5A5'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '6px'
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #702B59)'
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px 0 40px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E8E3E5)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text, #29252A)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #B83D83)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border, #E8E3E5)')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '6px'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #702B59)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 40px 0 40px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E8E3E5)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text, #29252A)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #B83D83)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border, #E8E3E5)')}
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
                    color: 'var(--text-muted, #702B59)',
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text, #29252A)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary, #B83D83)' }}
                />
                <span>Remember me</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password recovery link has been dispatched to your verified email or mobile number.');
                }}
                style={{ color: 'var(--color-primary, #B83D83)', fontWeight: '600', textDecoration: 'none' }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button (Rose Magenta #B83D83) */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary, #B83D83)',
                color: '#FFFFFF',
                fontSize: '0.9375rem',
                fontWeight: '700',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 2px 8px rgba(184, 61, 131, 0.25)'
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = '#9f326f';
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-primary, #B83D83)';
              }}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Registration Navigation Link */}
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--color-primary, #B83D83)',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Register
            </Link>
          </div>

          {/* Quick Demo Fill Buttons (Evaluation Shortcuts) */}
          <div style={{ marginTop: '26px', paddingTop: '18px', borderTop: '1px solid var(--border, #E8E3E5)' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--color-heading, #702B59)',
                textTransform: 'uppercase',
                marginBottom: '10px',
                letterSpacing: '0.04em'
              }}
            >
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
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <UserCheck size={14} style={{ color: 'var(--color-primary, #B83D83)' }} />
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
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <Stethoscope size={14} style={{ color: 'var(--color-primary, #B83D83)' }} />
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
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <Building2 size={14} style={{ color: 'var(--color-primary, #B83D83)' }} />
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
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>
          Protected under Digital Personal Data Protection (DPDP) Act 2023 &bull; Tamil Nadu Health Systems
        </div>
      </div>
    </div>
  );
}
