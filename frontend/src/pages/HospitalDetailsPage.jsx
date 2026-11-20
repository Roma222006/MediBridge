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
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import BookingReviewModal from '../components/BookingReviewModal';
import StatusBadge from '../components/StatusBadge';
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

  useEffect(() => {
    fetchHospital();
    // Join socket room for live hospital slot updates
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
  }, [id]);

  const fetchHospital = async () => {
    try {
      const res = await api.get(`/search/hospitals/${id}`);
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data.doctors?.length > 0) {
          setSelectedDoctor(res.data.data.doctors[0]);
        } else if (res.data.data.services?.length > 0) {
          setSelectedService(res.data.data.services[0]);
        }
      }
    } catch (err) {
      console.error('[HospitalDetails] Error:', err.message);
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
      if (res.data.success) {
        setSlots(res.data.data);
      }
    } catch (err) {
      console.error('[Slots] Error:', err.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading verified facility and provider data...</p>
      </div>
    );
  }

  if (!data?.hospital) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="empty-state-message">Healthcare facility not found or unavailable.</p>
        <Link to="/" className="btn btn-secondary">Return to Hospital Search</Link>
      </div>
    );
  }

  const { hospital, doctors, services } = data;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Healthcare Network', href: '/' },
          { label: 'Hospital Discovery', href: '/' },
          { label: hospital.name }
        ]}
        title={hospital.name}
        subtitle={`${hospital.address.street}, ${hospital.address.city}, ${hospital.address.district} - ${hospital.address.pincode}`}
        action={
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Back to Discovery</span>
          </Link>
        }
      />

      {/* Facility Overview Banner */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                {hospital.type.replace('_', ' ')}
              </span>
              <span className="badge badge-demo">
                License: {hospital.licenseNumber}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '8px', fontSize: 'var(--text-body-staff)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>General: {hospital.phone}</span>
              </span>
              <span>&bull;</span>
              <span>Emergency: <strong>{hospital.emergencyPhone || '108'}</strong></span>
              <span>&bull;</span>
              <span>Email: {hospital.email}</span>
            </div>
          </div>

          {/* Reported Capacity Figures */}
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div style={{ border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 'var(--radius-card)', textAlign: 'center', background: 'var(--bg-app)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>General Beds</div>
              <div style={{ fontWeight: '700', fontSize: 'var(--text-card)', color: 'var(--text)' }}>
                {hospital.bedCapacity.general.available} Open
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 'var(--radius-card)', textAlign: 'center', background: 'var(--bg-app)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ICU Beds</div>
              <div style={{ fontWeight: '700', fontSize: 'var(--text-card)', color: hospital.bedCapacity.icu.available > 0 ? 'var(--status-success-text)' : 'var(--status-critical-text)' }}>
                {hospital.bedCapacity.icu.available} Open
              </div>
            </div>
          </div>
        </div>

        {/* Stale Warning Banner if >120m */}
        {hospital.bedCapacity.isStale && (
          <div
            style={{
              backgroundColor: 'var(--status-warning-bg)',
              borderLeft: '3px solid var(--status-warning-accent)',
              padding: '8px 12px',
              marginTop: 'var(--space-4)',
              fontSize: 'var(--text-label-md)',
              color: 'var(--status-warning-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Reported capacity update exceeds 2 hours. Confirm current emergency triage status before transit.</span>
          </div>
        )}
      </div>

      {/* Main Two-Column Booking Engine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Doctors & Services Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Specialists Card */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-card)', marginBottom: 'var(--space-3)' }}>
              Specialist Physicians
            </h3>
            {doctors.length === 0 ? (
              <p style={{ fontSize: 'var(--text-body-staff)' }}>No resident doctors listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-control)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--bg-subtle)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all var(--motion-duration) var(--motion-ease)'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--color-heading)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-primary)', fontWeight: '500' }}>
                        {doc.specialty}
                      </div>
                      <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {doc.qualifications}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--status-warning-text)', marginTop: '2px' }}>
                        Reg: {doc.regNumber}
                      </div>
                      <div style={{ fontSize: 'var(--text-label-md)', fontWeight: '600', color: 'var(--text)', marginTop: '4px' }}>
                        Fee: ₹{doc.consultationFee}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Diagnostic Procedures Card */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-card)', marginBottom: 'var(--space-3)' }}>
              Diagnostic Procedures & Scans
            </h3>
            {services.length === 0 ? (
              <p style={{ fontSize: 'var(--text-body-staff)' }}>No outpatient diagnostic services listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-control)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--bg-subtle)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all var(--motion-duration) var(--motion-ease)'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: 'var(--color-heading)' }}>
                        {srv.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)' }}>
                        {srv.specialty} &bull; {srv.category}
                      </div>
                      <div style={{ fontSize: 'var(--text-label-md)', fontWeight: '600', color: 'var(--text)', marginTop: '4px' }}>
                        Cost: ₹{srv.price}
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
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: 'var(--text-card)', margin: 0 }}>
                  Available Slots for {selectedDoctor?.name || selectedService?.name || 'Selected Provider'}
                </h3>
                <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Live slot updates broadcast automatically via Socket.IO
                </div>
              </div>

              <div>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', height: '36px' }}
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Select appointment date"
                />
              </div>
            </div>

            {slotsLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                Querying live slot availability...
              </div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-app)', borderRadius: 'var(--radius-card)' }}>
                <p style={{ color: 'var(--text)' }}>No open slots found for this date.</p>
                <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--text-muted)' }}>
                  Please select an alternative date or another specialist physician.
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
                {slots.map((slot) => {
                  const isAvailable = slot.status === 'AVAILABLE';
                  return (
                    <button
                      key={slot._id}
                      disabled={!isAvailable}
                      onClick={() => setActiveBookingSlot(slot)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-control)',
                        border: isAvailable ? '1px solid var(--color-primary)' : '1px solid var(--border)',
                        backgroundColor: isAvailable ? 'var(--surface)' : 'var(--bg-app)',
                        color: isAvailable ? 'var(--text)' : 'var(--text-muted)',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all var(--motion-duration) var(--motion-ease)'
                      }}
                    >
                      <span style={{ fontWeight: '600', fontSize: 'var(--text-body-staff)', color: isAvailable ? 'var(--color-heading)' : 'var(--text-muted)' }}>
                        {slot.startTime}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        to {slot.endTime}
                      </span>
                      <StatusBadge status={slot.status} />
                    </button>
                  );
                })}
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
          onBookingSuccess={() => {
            fetchSlots();
          }}
        />
      )}
    </div>
  );
}
