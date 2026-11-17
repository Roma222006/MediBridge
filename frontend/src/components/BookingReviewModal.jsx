import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, ShieldCheckIcon, AlertTriangleIcon } from './Icons';

export default function BookingReviewModal({ slot, hospital, doctor, service, onClose, onBookingSuccess }) {
  const { user, activeProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [scheme, setScheme] = useState('none');
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs';
  };

  const handleConfirm = async () => {
    if (!activeProfile) {
      setError('Please select or create an active patient profile before booking.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Generate unique Idempotency-Key per transaction
    const idempotencyKey = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    try {
      // 1. Hold Slot
      await api.post('/bookings/hold', {
        slotId: slot.id || slot._id,
        patientProfileId: activeProfile._id
      });

      // 2. Confirm Booking with Idempotency-Key
      const res = await api.post(
        '/bookings/confirm',
        {
          slotId: slot.id || slot._id,
          patientProfileId: activeProfile._id,
          schemeApplied: scheme
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        }
      );

      if (res.data.success) {
        setConfirmedBooking(res.data.data);
        if (onBookingSuccess) onBookingSuccess(res.data.data);
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      if (errData?.code === 'SLOT_TAKEN') {
        setError('Race condition detected: This slot was claimed by another patient just a moment ago. Please select another slot.');
      } else if (errData?.code === 'PATIENT_SCHEDULE_CONFLICT') {
        setError(errData.message);
      } else {
        setError(errData?.message || 'Booking failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {!confirmedBooking ? (
          <>
            <div className="card-header">
              <h3>Confirm Appointment Reservation</h3>
              <button onClick={onClose} className="btn btn-sm btn-secondary">✕</button>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#F5F7F6', padding: '12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase', fontWeight: '600' }}>
                  Patient Details
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <strong>{activeProfile?.fullName || 'Profile required'}</strong>
                  <span>Age: {calculateAge(activeProfile?.dateOfBirth)} &bull; {activeProfile?.gender}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#4A5B63', marginTop: '2px' }}>
                  Relationship: <span style={{ textTransform: 'capitalize' }}>{activeProfile?.relationship}</span> &bull; Phone: {activeProfile?.phone || user?.phone}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#F5F7F6', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#72848D' }}>Facility</span>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{hospital?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>{hospital?.address?.city}</div>
                </div>

                <div style={{ backgroundColor: '#F5F7F6', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#72848D' }}>Doctor / Service</span>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{doctor?.name || service?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#72848D' }}>{doctor?.specialty || service?.specialty}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#F5F7F6', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#72848D' }}>Scheduled Date & Time</span>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{slot?.date}</div>
                  <div style={{ fontSize: '0.875rem', color: '#147D78', fontWeight: '600' }}>{slot?.startTime} - {slot?.endTime}</div>
                </div>

                <div style={{ backgroundColor: '#F5F7F6', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#72848D' }}>Consultation Fee</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#102D3A' }}>
                    ₹{doctor?.consultationFee || service?.price || 0}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label className="form-label">Healthcare Scheme / Insurance Coverage</label>
                <select
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  className="form-select"
                >
                  <option value="none">Direct Out-of-Pocket Payment (No Scheme)</option>
                  <option value="pmjay">Ayushman Bharat (PM-JAY Cashless)</option>
                  <option value="cmchis">Chief Minister Comprehensive Scheme (CMCHIS)</option>
                  <option value="private">Private Insurer Cashless Pre-Auth</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} disabled={submitting} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={submitting} className="btn btn-primary">
                {submitting ? 'Reserving...' : 'Confirm Booking'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: '#1C744F', marginBottom: '12px' }}>
              <CheckCircleIcon size={56} />
            </div>
            <h2>Appointment Confirmed!</h2>
            <p style={{ marginTop: '8px', color: '#4A5B63' }}>
              Your appointment has been atomically secured and confirmed by the hospital.
            </p>

            <div
              style={{
                backgroundColor: '#EDF5F3',
                border: '1px solid #147D78',
                borderRadius: '8px',
                padding: '16px',
                margin: '20px 0',
                display: 'inline-block',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#72848D', textTransform: 'uppercase' }}>
                Booking Reference Code
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#102D3A', letterSpacing: '1px' }}>
                {confirmedBooking.referenceNumber}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#4A5B63', marginTop: '6px' }}>
                Present this reference code upon arrival at the hospital check-in triage.
              </div>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
