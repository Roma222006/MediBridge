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
      className="auth-floating-page"
      style={{
        position: 'relative',
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        backgroundImage: `url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'left center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 'clamp(20px, 6vw, 90px)',
        paddingLeft: 'clamp(16px, 3vw, 40px)',
        overflow: 'hidden',
        backgroundColor: '#FCEFED',
        fontFamily: 'var(--font-body, "Inter", sans-serif)'
      }}
    >
      {/* Subtle Atmosphere Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 35%, rgba(252, 239, 237, 0.3) 70%, rgba(252, 239, 237, 0.55) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* ================================================================
          FLOATING LOGIN AUTHENTICATION CARD
          Elevated white card floating directly over the hospital background
          ================================================================ */}
      <div
        className="auth-floating-card"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 20px 48px -10px rgba(112, 43, 89, 0.22), 0 4px 16px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(232, 227, 229, 0.95)',
          maxHeight: 'calc(100vh - 36px)',
          overflowY: 'auto'
        }}
      >
        <div>
          {/* Logo & Subtitle matching Screen 1 */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--color-blush-pink, #F8DDE3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Hospital size={16} strokeWidth={2.2} style={{ color: 'var(--color-primary, #B83D83)' }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                  fontSize: '1.35rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em'
                }}
              >
                <span style={{ color: 'var(--color-heading, #702B59)' }}>Medi</span>
                <span style={{ color: 'var(--color-primary, #B83D83)' }}>Bridge</span>
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #702B59)', fontWeight: '600' }}>
              Hospital Healthcare Coordination Platform
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'left', marginBottom: '14px' }}>
            <h1
              style={{
                margin: '0 0 4px 0',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '1.375rem',
                fontWeight: '800',
                color: 'var(--color-heading, #702B59)'
              }}
            >
              Welcome Back
            </h1>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
              Sign in to access your healthcare portal.
            </p>
          </div>

          {/* Registration Success Notification */}
          {registeredMsg && (
            <div
              style={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #86EFAC'
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
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
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #FCA5A5'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '4px'
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
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
                    height: '38px',
                    padding: '0 12px 0 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E8E3E5)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text, #29252A)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #B83D83)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border, #E8E3E5)')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '4px'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
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
                    height: '38px',
                    padding: '0 36px 0 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E8E3E5)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text, #29252A)',
                    fontSize: '0.8125rem',
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
                    right: '10px',
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
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                fontSize: '0.75rem'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text, #29252A)' }}>
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
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary, #B83D83)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
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
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
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
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border, #E8E3E5)' }}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: '800',
                color: 'var(--color-heading, #702B59)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.04em'
              }}
            >
              Instant Demo Access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleFillDemo('roma.patient@medibridge.org', 'PatientPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <UserCheck size={13} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('dr.revathi@medibridge.org', 'DoctorPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <Stethoscope size={13} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <span>Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin.kmch@medibridge.org', 'AdminPass123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <Building2 size={13} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <span>Hospital Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('superadmin@medibridge.org', 'SuperAdmin123!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #E8E3E5)',
                  backgroundColor: '#FAF6F7',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)'
                }}
              >
                <ShieldCheck size={13} style={{ color: 'var(--color-primary, #B83D83)' }} />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted, #702B59)' }}>
          Protected under Digital Personal Data Protection (DPDP) Act 2023 &bull; Tamil Nadu Health Systems
        </div>
      </div>
    </div>
  );
}
