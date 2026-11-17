import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { VideoIcon, ShieldCheckIcon, AlertTriangleIcon } from '../components/Icons';

export default function TeleconsultRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    joinConsultation();

    // Socket listener for participant events
    socket.on('participant_joined', (data) => {
      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          waitingRoom: false,
          waitingMessage: `${data.participantName} (${data.participantRole}) has joined the session.`
        };
      });
    });

    return () => {
      socket.off('participant_joined');
    };
  }, [id]);

  useEffect(() => {
    let interval = null;
    if (sessionData && !sessionData.waitingRoom) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionData]);

  const joinConsultation = async () => {
    try {
      const res = await api.post(`/teleconsult/session/${id}/join`);
      if (res.data.success) {
        setSessionData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to join teleconsultation.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSec) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>Verifying participant token and session credentials...</div>;
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="card" style={{ borderLeft: '4px solid #A32828', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A32828' }}>
            <AlertTriangleIcon size={20} />
            <h3>Consultation Access Denied</h3>
          </div>
          <p style={{ marginTop: '8px', color: '#4A5B63' }}>{error}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Teleconsultation Bridge & Consultation Desk</h2>
          <div style={{ fontSize: '0.8125rem', color: '#72848D' }}>
            Reference: <strong>{sessionData.referenceNumber}</strong> &bull; Participant: {sessionData.participantName} ({sessionData.participantRole})
          </div>
        </div>

        {!sessionData.waitingRoom && (
          <div style={{ backgroundColor: '#1C744F', color: '#FFFFFF', padding: '6px 14px', borderRadius: '4px', fontWeight: '700', fontSize: '0.9375rem' }}>
            Consultation Time: {formatTimer(timerSeconds)}
          </div>
        )}
      </div>

      {/* Waiting Room Card */}
      {sessionData.waitingRoom ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', borderTop: '4px solid #D5A45B' }}>
          <div style={{ color: '#D5A45B', marginBottom: '12px' }}>
            <VideoIcon size={48} />
          </div>
          <h3>Secure Waiting Room</h3>
          <p style={{ maxWidth: '500px', margin: '8px auto', color: '#4A5B63' }}>
            {sessionData.waitingMessage}
          </p>
          <div style={{ fontSize: '0.8125rem', color: '#72848D', marginTop: '12px' }}>
            You will be automatically connected the moment your doctor initiates the clinical stream.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ backgroundColor: '#102D3A', color: '#FFFFFF', height: '360px', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <VideoIcon size={64} />
            <div style={{ marginTop: '16px', fontSize: '1.25rem', fontWeight: '600' }}>
              Teleconsultation Bridge Active
            </div>
            <div style={{ fontSize: '0.875rem', color: '#D9EAE6', marginTop: '4px' }}>
              Encrypted Participant-Bound Session: {sessionData.participantName}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#72848D' }}>
              {sessionData.tierDelivered}
            </span>
            <Link to="/patient-dashboard" className="btn btn-secondary">
              End Consultation & Leave Room
            </Link>
          </div>
        </div>
      )}

      {/* Telemedicine Compliance Box */}
      <div style={{ marginTop: '20px', padding: '14px', backgroundColor: '#EDF5F3', borderRadius: '6px', fontSize: '0.8125rem', color: '#102D3A' }}>
        <ShieldCheckIcon size={16} /> <strong>Telemedicine Practice Guidelines (2020) Safeguard:</strong> Explicit consent is required before consultation commencement. In accordance with Indian telemedicine regulations, this session is conducted for logistical evaluation, review of vault records, and triage referral.
      </div>
    </div>
  );
}
