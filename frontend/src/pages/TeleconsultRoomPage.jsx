import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Video, ShieldCheck, AlertTriangle, Clock, ArrowLeft, PhoneOff } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

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
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Verifying participant token and session credentials...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ maxWidth: '640px', margin: '40px auto' }}>
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--status-critical-solid)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-critical-text)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700' }}>Consultation Access Denied</h3>
          </div>
          <p style={{ margin: '10px 0 20px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {error}
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-control)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={14} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <PageHeader
        title="Teleconsultation Bridge & Clinical Stream"
        subtitle={`Reference: ${sessionData?.referenceNumber || 'N/A'} | Participant: ${sessionData?.participantName || 'User'} (${sessionData?.participantRole || 'Guest'})`}
        breadcrumbs={[
          { label: 'Portal', path: user?.role === 'doctor' ? '/doctor-portal' : '/patient-dashboard' },
          { label: 'Teleconsultation' }
        ]}
        action={
          !sessionData?.waitingRoom && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success-text)',
                border: '1px solid var(--status-success-accent)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '700',
                fontSize: '0.875rem'
              }}
            >
              <Clock size={15} /> Elapsed: {formatTimer(timerSeconds)}
            </div>
          )
        }
      />

      {/* Waiting Room Card */}
      {sessionData?.waitingRoom ? (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--status-warning-accent)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            padding: '50px 24px',
            boxShadow: 'none'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)',
              marginBottom: '16px'
            }}
          >
            <Video size={40} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-heading)' }}>
            Secure Clinical Waiting Room
          </h3>
          <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: '1.5' }}>
            {sessionData.waitingMessage}
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-badge)',
              border: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)'
            }}
          >
            Stream initiates automatically when the attending physician enters the consultation room.
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'none'
          }}
        >
          {/* Active Video Screen Container */}
          <div
            style={{
              backgroundColor: 'var(--text)',
              color: 'var(--surface)',
              minHeight: '380px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Video size={36} style={{ color: 'var(--surface)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.01em' }}>
              Teleconsultation Bridge Active
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--bg-subtle)', marginTop: '4px', opacity: 0.9 }}>
              Encrypted Participant-Bound Session: {sessionData.participantName}
            </div>
            <div
              style={{
                marginTop: '16px',
                padding: '4px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-badge)',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            >
              Protocol: WebRTC DTLS-SRTP / Adaptive Bandwidth
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Tier delivered: <strong>{sessionData.tierDelivered}</strong>
            </span>
            <Link
              to={user?.role === 'doctor' ? '/doctor-portal' : '/patient-dashboard'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-control)',
                color: 'var(--status-critical-text)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              <PhoneOff size={15} /> End Consultation & Leave Room
            </Link>
          </div>
        </div>
      )}

      {/* Telemedicine Compliance Safeguard */}
      <div
        style={{
          marginTop: '20px',
          padding: '14px 18px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          lineHeight: '1.4'
        }}
      >
        <ShieldCheck size={18} style={{ color: 'var(--color-heading)', flexShrink: 0, marginTop: '1px' }} />
        <span>
          <strong style={{ color: 'var(--color-heading)' }}>Telemedicine Practice Guidelines (2020) Safeguard:</strong> Explicit patient consent is required before consultation commencement. In accordance with Indian telemedicine regulations, this session is conducted for logistical evaluation, review of vault records, and triage referral.
        </span>
      </div>
    </div>
  );
}
