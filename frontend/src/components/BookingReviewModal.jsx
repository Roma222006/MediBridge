import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import Button from './ui/Button';

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
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-booking-title">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        {!confirmedBooking ? (
          <>
            <div className="modal-header">
              <h2 id="modal-booking-title" className="modal-title">
                Confirm Appointment Reservation
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-tertiary"
                aria-label="Close booking modal"
                style={{ height: '32px', width: '32px', padding: 0 }}
              >
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {error && (
              <div className="error-state" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {/* Patient Profile Card */}
              <div style={{ backgroundColor: 'var(--bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                  Patient Profile
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <strong style={{ color: 'var(--color-heading)' }}>{activeProfile?.fullName || 'Profile required'}</strong>
                  <span style={{ fontSize: 'var(--text-body-staff)', color: 'var(--text-muted)' }}>
                    Age: {calculateAge(activeProfile?.dateOfBirth)} &bull; {activeProfile?.gender}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Relationship: <span style={{ textTransform: 'capitalize' }}>{activeProfile?.relationship}</span> &bull; Phone: {activeProfile?.phone || user?.phone}
                </div>
              </div>

              {/* Facility & Doctor Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Facility</span>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--color-heading)' }}>{hospital?.name}</div>
                  <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>{hospital?.address?.city}</div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Provider / Service</span>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--color-heading)' }}>{doctor?.name || service?.name}</div>
                  <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>{doctor?.specialty || service?.specialty}</div>
                </div>
              </div>

              {/* Schedule & Fee Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</span>
                  <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--text)' }}>{slot?.date}</div>
                  <div style={{ fontSize: 'var(--text-body-staff)', color: 'var(--color-primary)', fontWeight: '600' }}>
                    {slot?.startTime} - {slot?.endTime}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consultation Fee</span>
                  <div style={{ fontSize: 'var(--text-card)', fontWeight: '700', color: 'var(--color-heading)', marginTop: '2px' }}>
                    ₹{doctor?.consultationFee || service?.price || 0}
                  </div>
                </div>
              </div>

              {/* Scheme Dropdown */}
              <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
                <label htmlFor="booking-scheme" className="form-label">
                  Government / Insurer Scheme
                </label>
                <select
                  id="booking-scheme"
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

            <div className="modal-actions">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm} loading={submitting} disabled={submitting}>
                {submitting ? 'Securing Slot...' : 'Confirm Booking'}
              </Button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
            <div style={{ color: 'var(--status-success-accent)', marginBottom: 'var(--space-3)' }}>
              <CheckCircle2 size={48} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h2 className="modal-title" style={{ fontSize: 'var(--text-section)' }}>
              Appointment Confirmed
            </h2>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--text-body-staff)' }}>
              Your appointment slot has been atomically reserved and logged into hospital records.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                margin: 'var(--space-5) 0',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Booking Reference Code
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading)', letterSpacing: '1px', marginTop: '2px' }}>
                {confirmedBooking.referenceNumber}
              </div>
              <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Present this reference code upon arrival at the hospital reception.
              </div>
            </div>

            <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
