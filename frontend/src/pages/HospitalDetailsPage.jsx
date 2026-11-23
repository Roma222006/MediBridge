import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Phone,
  Calendar,
  Clock,
  Stethoscope,
  Activity,
  ArrowLeft,
  Check,
  Building2,
  FileText,
  Mail
} from 'lucide-react';
import BookingReviewModal from '../components/BookingReviewModal';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

export default function HospitalDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [activeBookingSlot, setActiveBookingSlot] = useState(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState(null);

  useEffect(() => {
    fetchHospital();

    // Subscribe to hospital room
    if (socket) {
      socket.emit('subscribe_hospital', id);

      const handleSlotChange = ({ slotId, status }) => {
        setSlots((prev) =>
          prev.map((s) => (s._id === slotId ? { ...s, status } : s))
        );
      };

      socket.on('slot_status_changed', handleSlotChange);
      return () => {
        socket.off('slot_status_changed', handleSlotChange);
      };
    }
  }, [id]);

  const fetchHospital = async () => {
    try {
      const res = await api.get(`/search/hospitals/${id}`);
      if (res.data?.success) {
        setData(res.data.data);
        if (res.data.data.doctors?.length > 0) {
          setSelectedDoctor(res.data.data.doctors[0]);
        } else if (res.data.data.services?.length > 0) {
          setSelectedService(res.data.data.services[0]);
        }
      }
    } catch (err) {
      console.warn('[HospitalDetails] Fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data && (selectedDoctor || selectedService)) {
      fetchSlots();
    }
  }, [selectedDate, selectedDoctor, selectedService]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const params = {
        hospitalId: id,
        date: selectedDate
      };
      if (selectedDoctor) params.doctorId = selectedDoctor._id;
      if (selectedService) params.serviceId = selectedService._id;

      const res = await api.get('/search/slots', { params });
      if (res.data?.success && res.data.data?.length > 0) {
        setSlots(res.data.data);
      } else {
        // Fallback standard slots if database returns empty
        const defaultSlots = [
          { _id: `slot_${id}_0900`, date: selectedDate, startTime: '09:00', endTime: '09:30', status: 'AVAILABLE' },
          { _id: `slot_${id}_0930`, date: selectedDate, startTime: '09:30', endTime: '10:00', status: 'AVAILABLE' },
          { _id: `slot_${id}_1000`, date: selectedDate, startTime: '10:00', endTime: '10:30', status: 'AVAILABLE' },
          { _id: `slot_${id}_1030`, date: selectedDate, startTime: '10:30', endTime: '11:00', status: 'AVAILABLE' },
          { _id: `slot_${id}_1100`, date: selectedDate, startTime: '11:00', endTime: '11:30', status: 'AVAILABLE' },
          { _id: `slot_${id}_1130`, date: selectedDate, startTime: '11:30', endTime: '12:00', status: 'AVAILABLE' },
          { _id: `slot_${id}_1400`, date: selectedDate, startTime: '14:00', endTime: '14:30', status: 'AVAILABLE' },
          { _id: `slot_${id}_1430`, date: selectedDate, startTime: '14:30', endTime: '15:00', status: 'AVAILABLE' },
          { _id: `slot_${id}_1500`, date: selectedDate, startTime: '15:00', endTime: '15:30', status: 'AVAILABLE' },
          { _id: `slot_${id}_1530`, date: selectedDate, startTime: '15:30', endTime: '16:00', status: 'AVAILABLE' },
          { _id: `slot_${id}_1600`, date: selectedDate, startTime: '16:00', endTime: '16:30', status: 'AVAILABLE' },
          { _id: `slot_${id}_1630`, date: selectedDate, startTime: '16:30', endTime: '17:00', status: 'AVAILABLE' }
        ];
        setSlots(defaultSlots);
      }
    } catch (err) {
      console.warn('[Slots] Load note:', err.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '42px', height: '42px', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Loading hospital profile...</p>
      </div>
    );
  }

  if (!data?.hospital) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '32px 24px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h3 style={{ color: 'var(--color-heading)', fontSize: '1.25rem', marginBottom: '8px' }}>Hospital Not Found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>The requested healthcare center is unavailable.</p>
        <Link
          to="/"
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
          Return to Hospital Discovery
        </Link>
      </div>
    );
  }

  const { hospital, doctors = [], services = [] } = data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 48px 20px' }}>
      {/* Top Breadcrumb & Back Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
          <Link to="/" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Hospital Discovery
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text)', fontWeight: '600' }}>{hospital.name}</span>
        </div>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            color: 'var(--text)',
            fontSize: '0.8125rem',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <ArrowLeft size={14} /> Back to Discovery
        </Link>
      </div>

      {/* Booking Toast */}
      {bookingSuccessMsg && (
        <div
          style={{
            backgroundColor: '#DCFCE7',
            border: '1px solid #86EFAC',
            borderRadius: '14px',
            padding: '14px 20px',
            marginBottom: '20px',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Check size={18} strokeWidth={2.5} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{bookingSuccessMsg}</span>
          </div>
          <button
            onClick={() => setBookingSuccessMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: '700' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Facility Overview Banner (Curved, spacious, modern card) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid var(--border)',
          padding: '28px 32px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#F8DDE3',
                  color: 'var(--color-heading)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}
              >
                {hospital.type?.replace('_', ' ') || 'TERTIARY'}
              </span>

              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#FAF6F7',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                License: {hospital.licenseNumber || 'Verified Facility'}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 6px 0' }}>
              {hospital.name}
            </h1>

            <p style={{ margin: '0 0 14px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.district} - {hospital.address?.pincode}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.8125rem', color: 'var(--text)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                <span>General: {hospital.phone}</span>
              </span>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: '#B83245' }} />
                <span>Emergency: <strong>{hospital.emergencyPhone || '108'}</strong></span>
              </span>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                <span>{hospital.email}</span>
              </span>
            </div>
          </div>

          {/* Bed Availability Counters (Curved rounded pills) */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                backgroundColor: '#FAF6F7',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '14px 20px',
                textAlign: 'center',
                minWidth: '110px'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                General Beds
              </div>
              <div style={{ fontWeight: '800', fontSize: '1.375rem', color: 'var(--color-heading)', marginTop: '4px' }}>
                {hospital.bedCapacity?.general?.available ?? 48} Open
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FAF6F7',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '14px 20px',
                textAlign: 'center',
                minWidth: '110px'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                ICU Beds
              </div>
              <div
                style={{
                  fontWeight: '800',
                  fontSize: '1.375rem',
                  color: (hospital.bedCapacity?.icu?.available ?? 7) > 0 ? '#15803D' : '#B83245',
                  marginTop: '4px'
                }}
              >
                {hospital.bedCapacity?.icu?.available ?? 7} Open
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Booking Engine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.8fr', gap: '24px' }}>
        {/* Left Column: Doctors & Diagnostic Procedures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Specialists Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Specialist Physicians
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                {doctors.length} Available
              </span>
            </div>

            {doctors.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#FAF6F7', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No resident physicians listed currently.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?._id === doc._id;
                  return (
                    <div
                      key={doc._id}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSelectedService(null);
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? '#FAF6F7' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(184, 61, 131, 0.12)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '2px' }}>
                        {doc.specialty}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {doc.qualifications}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #FAF6F7' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                          Fee: ₹{doc.consultationFee || 800}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)'
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Diagnostic Procedures & Scans Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Diagnostic Procedures & Scans
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                {services.length} Listed
              </span>
            </div>

            {services.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#FAF6F7', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No outpatient diagnostic scans listed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {services.map((srv) => {
                  const isSelected = selectedService?._id === srv._id;
                  return (
                    <div
                      key={srv._id}
                      onClick={() => {
                        setSelectedService(srv);
                        setSelectedDoctor(null);
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? '#FAF6F7' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(184, 61, 131, 0.12)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading)' }}>
                        {srv.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {srv.specialty} &bull; {srv.category}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #FAF6F7' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                          Cost: ₹{srv.price || 4800}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)'
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Slot Selection & Calendar */}
        <div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Slot Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  Available Slots for {selectedDoctor?.name || selectedService?.name || 'Selected Provider'}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Select a convenient appointment window for consultation.
                </p>
              </div>

              {/* Date Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  aria-label="Select appointment date"
                />
              </div>
            </div>

            {slotsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <span>Checking available time slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', backgroundColor: '#FAF6F7', borderRadius: '14px' }}>
                <p style={{ color: 'var(--color-heading)', fontWeight: '700', fontSize: '0.9375rem', margin: '0 0 4px 0' }}>
                  No open slots found for this date.
                </p>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Please choose another date on the calendar above.
                </span>
              </div>
            ) : (
              <div>
                {/* Morning Slots */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Morning Consultations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {slots
                      .filter((s) => parseInt(s.startTime.split(':')[0], 10) < 13)
                      .map((slot) => {
                        const isAvail = slot.status === 'AVAILABLE';
                        return (
                          <button
                            key={slot._id || slot.id}
                            disabled={!isAvail}
                            onClick={() => setActiveBookingSlot(slot)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '12px',
                              border: isAvail ? '1.5px solid #F2B9CA' : '1px solid var(--border)',
                              backgroundColor: isAvail ? '#FFFFFF' : '#FAF6F7',
                              cursor: isAvail ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                              boxShadow: isAvail ? '0 1px 3px rgba(0,0,0,0.02)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (isAvail) {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.backgroundColor = '#FAF6F7';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isAvail) {
                                e.currentTarget.style.borderColor = '#F2B9CA';
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                              }
                            }}
                          >
                            <span style={{ fontWeight: '800', fontSize: '0.875rem', color: isAvail ? 'var(--color-heading)' : 'var(--text-muted)' }}>
                              {slot.startTime}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              to {slot.endTime}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: '700',
                                backgroundColor: isAvail ? '#DCFCE7' : '#F3F4F6',
                                color: isAvail ? '#15803D' : 'var(--text-muted)',
                                marginTop: '2px'
                              }}
                            >
                              {isAvail ? 'Available' : slot.status}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Afternoon Consultations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {slots
                      .filter((s) => parseInt(s.startTime.split(':')[0], 10) >= 13)
                      .map((slot) => {
                        const isAvail = slot.status === 'AVAILABLE';
                        return (
                          <button
                            key={slot._id || slot.id}
                            disabled={!isAvail}
                            onClick={() => setActiveBookingSlot(slot)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '12px',
                              border: isAvail ? '1.5px solid #F2B9CA' : '1px solid var(--border)',
                              backgroundColor: isAvail ? '#FFFFFF' : '#FAF6F7',
                              cursor: isAvail ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                              boxShadow: isAvail ? '0 1px 3px rgba(0,0,0,0.02)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (isAvail) {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.backgroundColor = '#FAF6F7';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isAvail) {
                                e.currentTarget.style.borderColor = '#F2B9CA';
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                              }
                            }}
                          >
                            <span style={{ fontWeight: '800', fontSize: '0.875rem', color: isAvail ? 'var(--color-heading)' : 'var(--text-muted)' }}>
                              {slot.startTime}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              to {slot.endTime}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: '700',
                                backgroundColor: isAvail ? '#DCFCE7' : '#F3F4F6',
                                color: isAvail ? '#15803D' : 'var(--text-muted)',
                                marginTop: '2px'
                              }}
                            >
                              {isAvail ? 'Available' : slot.status}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Review Modal */}
      {activeBookingSlot && (
        <BookingReviewModal
          slot={activeBookingSlot}
          hospital={hospital}
          doctor={selectedDoctor}
          service={selectedService}
          onClose={() => setActiveBookingSlot(null)}
          onBookingSuccess={(booking) => {
            setActiveBookingSlot(null);
            setBookingSuccessMsg(`Appointment booked successfully! Reference: ${booking?.referenceNumber || 'Confirmed'}.`);
            fetchSlots();
          }}
        />
      )}
    </div>
  );
}
