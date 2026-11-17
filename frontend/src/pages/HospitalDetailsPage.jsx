import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { MapPinIcon, PhoneIcon, CalendarIcon, StethoscopeIcon, AlertTriangleIcon } from '../components/Icons';
import BookingReviewModal from '../components/BookingReviewModal';
import StatusBadge from '../components/StatusBadge';

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
      <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>
        Loading facility data...
      </div>
    );
  }

  if (!data?.hospital) {
    return (
      <div className="main-content">
        <div className="card">Facility not found.</div>
      </div>
    );
  }

  const { hospital, doctors, services } = data;

  return (
    <div className="main-content">
      <div style={{ marginBottom: '16px' }}>
        <Link to="/" style={{ fontSize: '0.875rem' }}>&larr; Back to Hospital Search</Link>
      </div>

      {/* Hospital Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>{hospital.name}</h2>
              <span style={{ fontSize: '0.75rem', color: '#147D78', backgroundColor: '#E7F3F1', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                {hospital.type.replace('_', ' ')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.875rem', color: '#72848D' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPinIcon size={16} /> {hospital.address.street}, {hospital.address.city}, {hospital.address.district} - {hospital.address.pincode}
              </span>
              <span>&bull;</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PhoneIcon size={16} /> General: {hospital.phone} | Emergency: <strong>{hospital.emergencyPhone || '108'}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ backgroundColor: '#F5F7F6', padding: '8px 14px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#72848D' }}>General Beds</div>
              <div style={{ fontWeight: '700', fontSize: '1.125rem' }}>{hospital.bedCapacity.general.available} Open</div>
            </div>
            <div style={{ backgroundColor: '#F5F7F6', padding: '8px 14px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#72848D' }}>ICU Beds</div>
              <div style={{ fontWeight: '700', fontSize: '1.125rem', color: hospital.bedCapacity.icu.available > 0 ? '#1C744F' : '#A32828' }}>
                {hospital.bedCapacity.icu.available} Open
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Booking Engine */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Column: Doctors & Services Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h4 style={{ marginBottom: '12px' }}>Specialist Physicians</h4>
            {doctors.length === 0 ? (
              <p style={{ fontSize: '0.875rem' }}>No resident doctors listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #147D78' : '1px solid #DCE3E1',
                        backgroundColor: isSelected ? '#EDF5F3' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#102D3A' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#147D78', fontWeight: '500' }}>{doc.specialty}</div>
                      <div style={{ fontSize: '0.75rem', color: '#72848D', marginTop: '2px' }}>{doc.qualifications}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9E6B18', marginTop: '2px' }}>
                        Reg: {doc.regNumber}
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: '700', marginTop: '4px' }}>
                        Fee: ₹{doc.consultationFee}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '12px' }}>Diagnostic Procedures & Scans</h4>
            {services.length === 0 ? (
              <p style={{ fontSize: '0.875rem' }}>No outpatient diagnostic services listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #147D78' : '1px solid #DCE3E1',
                        backgroundColor: isSelected ? '#EDF5F3' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{srv.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#72848D' }}>{srv.specialty} &bull; {srv.category}</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: '700', marginTop: '4px' }}>
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
                <h4>
                  Available Slots for {selectedDoctor?.name || selectedService?.name || 'Selection'}
                </h4>
                <div style={{ fontSize: '0.8125rem', color: '#72848D', marginTop: '2px' }}>
                  Live slot updates broadcast automatically via Socket.IO
                </div>
              </div>

              <div>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto' }}
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {slotsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#72848D' }}>
                Checking live slot availability...
              </div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F5F7F6', borderRadius: '6px' }}>
                <p>No available slots found for this date.</p>
                <span style={{ fontSize: '0.8125rem', color: '#72848D' }}>
                  Please try selecting another date or alternative specialist.
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {slots.map((slot) => {
                  const isAvailable = slot.status === 'AVAILABLE';
                  return (
                    <button
                      key={slot._id}
                      disabled={!isAvailable}
                      onClick={() => setActiveBookingSlot(slot)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '6px',
                        border: isAvailable ? '1px solid #147D78' : '1px solid #DCE3E1',
                        backgroundColor: isAvailable ? '#FFFFFF' : '#F5F7F6',
                        color: isAvailable ? '#102D3A' : '#72848D',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontWeight: '700', fontSize: '0.9375rem' }}>
                        {slot.startTime}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#72848D' }}>
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
