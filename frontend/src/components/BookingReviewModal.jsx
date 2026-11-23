import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, X, Calendar, Clock, Hospital, User, FileText, Check } from 'lucide-react';
import Button from './ui/Button';

export default function BookingReviewModal({ slot, hospital, doctor, service, onClose, onBookingSuccess }) {
  const { user, profiles, activeProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [scheme, setScheme] = useState('none');
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fallback to activeProfile, first profile in list, or user session
  const effectiveProfile = activeProfile || (profiles && profiles.length > 0 ? profiles[0] : null);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs';
  };

  const handleConfirm = async () => {
    if (!user) {
      setError('Please sign in to your MediBridge patient account to complete this booking.');
      return;
    }

    if (!effectiveProfile?._id) {
      setError('A patient profile is required to complete this booking. Please create or select a profile.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const idempotencyKey = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    try {
      // 1. Hold Slot
      await api.post('/bookings/hold', {
        slotId: slot.id || slot._id,
        patientProfileId: effectiveProfile._id
      });

      // 2. Confirm Booking
      const res = await api.post(
        '/bookings/confirm',
        {
          slotId: slot.id || slot._id,
          patientProfileId: effectiveProfile._id,
          schemeApplied: scheme
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        }
      );

      if (res.data?.success) {
        setConfirmedBooking(res.data.data);
        if (onBookingSuccess) onBookingSuccess(res.data.data);
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      if (errData?.code === 'SLOT_TAKEN') {
        setError('This slot was just claimed by another patient. Please select an alternative time slot.');
      } else if (errData?.code === 'PATIENT_SCHEDULE_CONFLICT') {
        setError(errData.message || 'You already have another appointment booked at this time.');
      } else {
        setError(errData?.message || 'Booking could not be completed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-booking-title">
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          borderRadius: '20px',
          padding: '28px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 12px 36px rgba(112, 43, 89, 0.15)',
          border: '1px solid var(--border)'
        }}
      >
        {!confirmedBooking ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <h2 id="modal-booking-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)', margin: 0 }}>
                  Confirm Appointment
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Review your consultation details before finalizing
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close booking modal"
                style={{
                  height: '32px',
                  width: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FAF6F7',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '0.8125rem',
                  color: '#B83245',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {!user ? (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '18px' }}>
                  Please sign in to your patient account to confirm and reserve this consultation.
                </p>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    textDecoration: 'none'
                  }}
                >
                  Sign In to Book
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                {/* Patient Profile Card */}
                <div
                  style={{
                    backgroundColor: '#FAF6F7',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                    Patient
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <strong style={{ color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
                      {effectiveProfile?.fullName || user.email}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {effectiveProfile?.dateOfBirth ? calculateAge(effectiveProfile.dateOfBirth) : ''} {effectiveProfile?.gender ? `• ${effectiveProfile.gender}` : ''}
                    </span>
                  </div>
                </div>

                {/* Facility & Doctor / Service Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    style={{
                      backgroundColor: '#FAF6F7',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Hospital</span>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)', marginTop: '2px' }}>
                      {hospital?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {hospital?.address?.city || 'Coimbatore'}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#FAF6F7',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Consultant / Service</span>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading)', marginTop: '2px' }}>
                      {doctor?.name || service?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '2px' }}>
                      {doctor?.specialty || service?.specialty}
                    </div>
                  </div>
                </div>

                {/* Schedule & Fee Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    style={{
                      backgroundColor: '#FAF6F7',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Date & Time</span>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text)', marginTop: '2px' }}>
                      {slot?.date}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: '700', marginTop: '2px' }}>
                      {slot?.startTime} - {slot?.endTime}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#FAF6F7',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Consultation Fee</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>
                      ₹{doctor?.consultationFee || service?.price || 500}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: '600', marginTop: '2px' }}>
                      No convenience charges
                    </div>
                  </div>
                </div>

                {/* Insurance / Healthcare Scheme */}
                <div>
                  <label htmlFor="booking-scheme" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)', marginBottom: '6px' }}>
                    Healthcare Scheme / Insurance
                  </label>
                  <select
                    id="booking-scheme"
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.875rem',
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  >
                    <option value="none">Direct Hospital Counter (No Scheme)</option>
                    <option value="cmchis">Chief Minister Comprehensive Scheme (CMCHIS)</option>
                    <option value="pmjay">Ayushman Bharat (PM-JAY)</option>
                    <option value="private">Private Health Insurance Pre-Auth</option>
                  </select>
                </div>
              </div>
            )}

            {user && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(184, 61, 131, 0.25)'
                  }}
                >
                  {submitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Check size={32} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 6px 0' }}>
              Appointment Confirmed
            </h2>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Your appointment slot has been confirmed and registered with the hospital.
            </p>

            <div
              style={{
                backgroundColor: '#FAF6F7',
                border: '1.5px solid var(--color-primary)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Booking Reference Number
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading)', letterSpacing: '1px', marginTop: '4px' }}>
                {confirmedBooking.referenceNumber}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Date: <strong>{confirmedBooking.date}</strong> &bull; Time: <strong>{confirmedBooking.startTime} - {confirmedBooking.endTime}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/patient-dashboard?tab=appointments"
                onClick={onClose}
                style={{
                  flex: 1,
                  display: 'inline-block',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  padding: '11px 20px',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  textDecoration: 'none'
                }}
              >
                View in My Appointments
              </Link>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '11px 22px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text)',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
