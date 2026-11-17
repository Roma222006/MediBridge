import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HospitalIcon, AlertTriangleIcon } from '../components/Icons';

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
    <div className="main-content" style={{ maxWidth: '480px', marginTop: '30px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', backgroundColor: '#EDF5F3', borderRadius: '50%', color: '#147D78' }}>
            <HospitalIcon size={32} />
          </div>
          <h2 style={{ marginTop: '12px' }}>Sign in to MediBridge</h2>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
            Authorized healthcare coordination & portal access
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FDEEEE',
              color: '#A32828',
              padding: '10px 14px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangleIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. roma.patient@medibridge.org"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid #DCE3E1', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase', fontWeight: '600' }}>
            Quick 1-Click Demo Login
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <button
              onClick={() => handleQuickDemo('roma.patient@medibridge.org', 'PatientPass123!')}
              className="btn btn-sm btn-secondary"
            >
              Patient (Roma)
            </button>
            <button
              onClick={() => handleQuickDemo('dr.revathi@medibridge.org', 'DoctorPass123!')}
              className="btn btn-sm btn-secondary"
            >
              Doctor (City)
            </button>
            <button
              onClick={() => handleQuickDemo('admin.kmch@medibridge.org', 'AdminPass123!')}
              className="btn btn-sm btn-secondary"
            >
              Hospital Admin
            </button>
            <button
              onClick={() => handleQuickDemo('superadmin@medibridge.org', 'SuperAdmin123!')}
              className="btn btn-sm btn-secondary"
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
