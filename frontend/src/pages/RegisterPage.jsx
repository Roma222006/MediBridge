import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Hospital,
  UserRound,
  Stethoscope,
  Building2,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  User,
  FileBadge,
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import AuthHospitalHero from '../components/auth/AuthHospitalHero';
import { api } from '../services/api';

const ROLES = [
  { id: 'patient', label: 'Patient', icon: UserRound, desc: 'Personal & family health records' },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'OPD, clinical desk & teleconsult' },
  { id: 'hospital_admin', label: 'Hospital Admin', icon: Building2, desc: 'Facility, bed & doctor operations' },
  { id: 'super_admin', label: 'Super Admin', icon: ShieldCheck, desc: 'State-wide governance & approvals' }
];

const SPECIALTY_OPTIONS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Obstetrics & Gynecology',
  'Dermatology',
  'Emergency & Critical Care'
];

export default function RegisterPage() {
  const navigate = useNavigate();

  // Selected Role State
  const [selectedRole, setSelectedRole] = useState('patient');

  // Common Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Role-Specific Fields
  // Doctor
  const [specialty, setSpecialty] = useState('Cardiology');
  const [regNumber, setRegNumber] = useState('');
  const [qualifications, setQualifications] = useState('MBBS, MD');

  // Hospital Admin
  const [hospitalName, setHospitalName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Super Admin
  const [platformKey, setPlatformKey] = useState('');

  // State Management
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Common Validation
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    // Role-Specific Validation
    if (selectedRole === 'doctor' && !regNumber.trim()) {
      setError('Please provide your State Medical Council Registration Number (e.g., TNMC/2026/04818).');
      return;
    }

    if (selectedRole === 'hospital_admin' && (!hospitalName.trim() || !licenseNumber.trim())) {
      setError('Please provide both the Hospital Name and the Official Hospital License Number.');
      return;
    }

    if (selectedRole === 'super_admin') {
      if (!platformKey.trim()) {
        setError('Master Platform Activation Key is required to register a Super Administrator account.');
        return;
      }
      if (platformKey.trim() !== 'MEDIBRIDGE_SUPERADMIN_SECURE_2026') {
        setError('Access Denied: The entered Master Platform Activation Key is invalid.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: selectedRole
      };

      if (selectedRole === 'doctor') {
        payload.specialty = specialty;
        payload.department = specialty;
        payload.regNumber = regNumber.trim();
        payload.qualifications = qualifications.trim();
      } else if (selectedRole === 'hospital_admin') {
        payload.hospitalName = hospitalName.trim();
        payload.licenseNumber = licenseNumber.trim();
      } else if (selectedRole === 'super_admin') {
        payload.platformKey = platformKey.trim();
      }

      const res = await api.post('/auth/register', payload);

      if (res.data?.success) {
        navigate('/login?registered=true');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 409) {
        setError('An account with this email address already exists. Please sign in or use a different email.');
      } else {
        setError('Registration could not be completed. Please verify your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
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
          RIGHT SIDE: REGISTRATION FORM PANEL (40-45% Screen Width)
          ================================================================ */}
      <div
        className="auth-panel-container"
        style={{
          flex: '0 0 42%',
          minWidth: '380px',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 32px',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid var(--border, #E8E3E5)',
          overflowY: 'auto',
          zIndex: 2,
          boxShadow: '-4px 0 24px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div>
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
          <div style={{ textAlign: 'left', marginBottom: '18px' }}>
            <h1
              style={{
                margin: '0 0 4px 0',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '1.5rem',
                fontWeight: '800',
                color: 'var(--color-heading, #702B59)'
              }}
            >
              Create Account
            </h1>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
              Select your role and enroll in the state healthcare network.
            </p>
          </div>

          {/* Role Selection Tabs (4 distinct roles with Lucide Outline Icons) */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--color-heading, #702B59)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}
            >
              Register As
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}
            >
              {ROLES.map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      setError(null);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 4px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '2px solid var(--color-primary, #B83D83)'
                        : '1px solid var(--border, #E8E3E5)',
                      backgroundColor: isSelected ? 'var(--color-blush-pink, #F8DDE3)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none'
                    }}
                  >
                    <IconComponent
                      size={18}
                      style={{
                        color: isSelected ? 'var(--color-primary, #B83D83)' : 'var(--text-muted, #702B59)',
                        marginBottom: '4px'
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? '800' : '600',
                        color: isSelected ? 'var(--color-primary, #B83D83)' : 'var(--text, #29252A)',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}
                    >
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Advisory Notice */}
          {selectedRole === 'doctor' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#FAF5FF',
                border: '1px solid #E9D5FF',
                marginBottom: '18px',
                fontSize: '0.75rem',
                color: '#6B21A8'
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#9333EA' }} />
              <div>
                <strong>Stage 2 Verification:</strong> Registered doctor accounts enter Credential Review before hospital clinical privileges and OPD teleconsultation are active.
              </div>
            </div>
          )}

          {selectedRole === 'hospital_admin' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                marginBottom: '18px',
                fontSize: '0.75rem',
                color: '#1E40AF'
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
              <div>
                <strong>Hospital Empanelment Notice:</strong> Facility operations and 108 emergency bed capacity broadcasting require verification by the State Health Directorate.
              </div>
            </div>
          )}

          {selectedRole === 'super_admin' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                marginBottom: '18px',
                fontSize: '0.75rem',
                color: '#92400E'
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
              <div>
                <strong>Restricted Provisioning:</strong> Super Administrator platform access requires an authorized Master Activation Key issued by the Health Department.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#B83245',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '4px'
                }}
              >
                {selectedRole === 'doctor'
                  ? 'Doctor Full Name'
                  : selectedRole === 'hospital_admin'
                  ? 'Administrator Full Name'
                  : selectedRole === 'super_admin'
                  ? 'Officer Full Name'
                  : 'Full Name'}
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #702B59)'
                  }}
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    selectedRole === 'doctor'
                      ? 'Dr. Ramesh Kumar'
                      : selectedRole === 'hospital_admin'
                      ? 'Admin. Selvi Ananth'
                      : 'e.g. Anandha Krishnan'
                  }
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px 0 38px',
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

            {/* Email Address */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '4px'
                }}
              >
                {selectedRole === 'doctor'
                  ? 'Professional Work Email'
                  : selectedRole === 'hospital_admin'
                  ? 'Official Hospital Email'
                  : 'Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
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
                  placeholder={
                    selectedRole === 'doctor'
                      ? 'dr.name@hospital.org'
                      : selectedRole === 'hospital_admin'
                      ? 'admin@hospital.org'
                      : 'name@example.com'
                  }
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px 0 38px',
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

            {/* Phone Number */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: 'var(--color-heading, #702B59)',
                  marginBottom: '4px'
                }}
              >
                Mobile / Contact Phone
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #702B59)'
                  }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px 0 38px',
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

            {/* Role Specific: Doctor (Specialty & Council Reg) */}
            {selectedRole === 'doctor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-heading, #702B59)',
                      marginBottom: '4px'
                    }}
                  >
                    Clinical Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  >
                    {SPECIALTY_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-heading, #702B59)',
                      marginBottom: '4px'
                    }}
                  >
                    Council Reg #
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="TNMC/2026/04818"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Role Specific: Hospital Admin (Hospital Name & License #) */}
            {selectedRole === 'hospital_admin' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-heading, #702B59)',
                      marginBottom: '4px'
                    }}
                  >
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="KMCH Coimbatore"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-heading, #702B59)',
                      marginBottom: '4px'
                    }}
                  >
                    Hospital License #
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="LIC-TN-CBE-001"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Role Specific: Super Admin (Master Platform Activation Key) */}
            {selectedRole === 'super_admin' && (
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    color: 'var(--color-heading, #702B59)',
                    marginBottom: '4px'
                  }}
                >
                  Master Platform Activation Key
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted, #702B59)'
                    }}
                  />
                  <input
                    type="password"
                    value={platformKey}
                    onChange={(e) => setPlatformKey(e.target.value)}
                    placeholder="Enter Master Platform Activation Key"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px 0 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #B83D83)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border, #E8E3E5)')}
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
                  Demo Master Key: <code style={{ backgroundColor: '#F8DDE3', padding: '1px 4px', borderRadius: '4px' }}>MEDIBRIDGE_SUPERADMIN_SECURE_2026</code>
                </div>
              </div>
            )}

            {/* Passwords (Password & Confirm Password) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
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
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted, #702B59)'
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 32px 0 32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
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
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    color: 'var(--color-heading, #702B59)',
                    marginBottom: '4px'
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={15}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted, #702B59)'
                    }}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 32px 0 32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text, #29252A)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted, #702B59)',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Register Button (Rose Magenta #B83D83) */}
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
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          {/* Already have an account? Sign In */}
          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--color-primary, #B83D83)',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Sign In
            </Link>
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
