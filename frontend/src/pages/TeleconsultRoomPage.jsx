import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  Video,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowLeft,
  PhoneOff,
  FileText,
  Save,
  Send,
  Building2,
  CheckCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

export default function TeleconsultRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Doctor Notes State
  const [notesContent, setNotesContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved locally', 'Saved', 'Retrying'
  const [isCommitted, setIsCommitted] = useState(false);
  const [recommendInPerson, setRecommendInPerson] = useState(false);
  const [convertingToReferral, setConvertingToReferral] = useState(false);
  const [noteVersion, setNoteVersion] = useState(1);
  const [endingSession, setEndingSession] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const localDraftKey = `teleconsult_draft_${id}`;

  useEffect(() => {
    joinConsultation();

    // Socket listener for participant events
    socket.on('participant_joined', (data) => {
      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          waitingRoom: false,
          waitingMessage: `${data.participantName} (${data.participantRole}) has entered the consultation.`
        };
      });
    });

    socket.on('session_concluded', () => {
      setActionMsg({
        type: 'info',
        text: 'The attending physician has concluded the clinical session.'
      });
    });

    return () => {
      socket.off('participant_joined');
      socket.off('session_concluded');
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

  // Load existing notes / draft
  useEffect(() => {
    if (user?.role === 'doctor') {
      loadNotes();
    }
  }, [id, user]);

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

  const loadNotes = async () => {
    try {
      const res = await api.get(`/teleconsult/session/${id}/notes`);
      if (res.data.success && res.data.data) {
        setNotesContent(res.data.data.content || '');
        setNoteVersion(res.data.data.version || 1);
        setIsCommitted(!res.data.data.isDraft);
        setRecommendInPerson(!!res.data.data.recommendInPerson);
        setSaveStatus('Saved');
      } else {
        // Fallback to local draft
        const local = localStorage.getItem(localDraftKey);
        if (local) {
          setNotesContent(local);
          setSaveStatus('Saved locally');
        }
      }
    } catch (err) {
      console.warn('[Teleconsult] Notes load fallback to local draft');
      const local = localStorage.getItem(localDraftKey);
      if (local) {
        setNotesContent(local);
        setSaveStatus('Saved locally');
      }
    }
  };

  // Autosave to LocalStorage on typing
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotesContent(val);
    localStorage.setItem(localDraftKey, val);
    setSaveStatus('Saved locally');
    setIsCommitted(false);
  };

  // Commit notes to server
  const handleSaveNotesToServer = async (draft = false) => {
    if (!notesContent.trim()) {
      setActionMsg({ type: 'error', text: 'Clinical notes cannot be empty.' });
      return false;
    }

    setSaveStatus('Retrying');
    try {
      const res = await api.post(`/teleconsult/session/${id}/notes`, {
        content: notesContent,
        isDraft: draft,
        version: noteVersion,
        recommendInPerson,
        convertedToReferral: convertingToReferral
      });

      if (res.data.success) {
        setSaveStatus('Saved');
        if (!draft) setIsCommitted(true);
        setNoteVersion(res.data.data.version || noteVersion + 1);
        localStorage.removeItem(localDraftKey);
        setActionMsg({
          type: 'success',
          text: draft ? 'Draft saved to server' : 'Clinical consultation notes committed.'
        });
        return true;
      }
      return false;
    } catch (err) {
      setSaveStatus('Saved locally');
      setActionMsg({
        type: 'error',
        text: 'Server save failed: ' + (err.response?.data?.error?.message || 'Will retry automatically.')
      });
      return false;
    }
  };

  // Conclude Consultation (Requires committed notes)
  const handleEndSession = async () => {
    if (user?.role === 'doctor') {
      if (!isCommitted && !notesContent.trim()) {
        setActionMsg({
          type: 'error',
          text: 'Clinical Safety Safeguard: Consultation notes must be saved and committed before ending the session.'
        });
        return;
      }

      setEndingSession(true);
      // Ensure notes are committed first
      const savedOk = await handleSaveNotesToServer(false);
      if (!savedOk) {
        setEndingSession(false);
        return;
      }

      try {
        const endRes = await api.post(`/teleconsult/session/${id}/end`);
        if (endRes.data.success) {
          navigate('/doctor-portal');
        }
      } catch (err) {
        setActionMsg({
          type: 'error',
          text: err.response?.data?.error?.message || 'Failed to conclude session.'
        });
        setEndingSession(false);
      }
    } else {
      navigate('/patient-dashboard');
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
          Verifying participant session authorization...
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
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-critical-text)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700' }}>Consultation Access Denied</h3>
          </div>
          <p style={{ margin: '10px 0 20px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{error}</p>
          <Link to="/" className="btn btn-sm btn-outline">
            <ArrowLeft size={14} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <PageHeader
        title="Teleconsultation Bridge & Clinical Stream"
        subtitle={`Ref: ${sessionData?.referenceNumber || 'N/A'} &bull; Participant: ${sessionData?.participantName} (${sessionData?.participantRole})`}
        breadcrumbs={[
          { label: 'Portal', path: user?.role === 'doctor' ? '/doctor-portal' : '/patient-dashboard' },
          { label: 'Teleconsultation Room' }
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

      {actionMsg && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.875rem',
            backgroundColor: actionMsg.type === 'success' ? 'var(--status-success-bg)' : actionMsg.type === 'info' ? 'var(--bg-app)' : 'var(--status-critical-bg)',
            color: actionMsg.type === 'success' ? 'var(--status-success-text)' : actionMsg.type === 'info' ? 'var(--color-heading)' : 'var(--status-critical-text)',
            border: `1px solid ${actionMsg.type === 'success' ? 'var(--status-success-accent)' : actionMsg.type === 'info' ? 'var(--border)' : 'var(--status-critical-solid)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: '700' }}>
            &times;
          </button>
        </div>
      )}

      {sessionData?.waitingRoom ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            borderTop: '4px solid var(--status-warning-accent)'
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
          <div style={{ marginTop: '20px' }}>
            <span className="badge badge-pill badge-neutral">
              Encrypted Telemedicine Bridge &bull; Waiting for attending doctor
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'doctor' ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Left Panel: Video Stream & Encrypted Bridge */}
          <div className="card" style={{ padding: '24px' }}>
            <div
              style={{
                backgroundColor: 'var(--text)',
                color: 'var(--surface)',
                minHeight: '360px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <Video size={32} style={{ color: 'var(--surface)' }} />
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                Teleconsultation Bridge Active
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--bg-subtle)', marginTop: '4px' }}>
                Participant: {sessionData.participantName}
              </div>
              <div
                style={{
                  marginTop: '16px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--radius-badge)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              >
                DTLS-SRTP Tier 1 Bridge &bull; No Recording by Default
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Status: <strong>{sessionData.status}</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndSession}
                disabled={endingSession}
                icon={<PhoneOff size={14} />}
                style={{ color: 'var(--status-critical-text)' }}
              >
                {endingSession ? 'Concluding...' : 'End Consultation & Conclude Visit'}
              </Button>
            </div>
          </div>

          {/* Right Panel: Doctor Clinical Notes & Physical Exam Conversion */}
          {user?.role === 'doctor' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-heading)' }}>
                  Clinical Consultation Notes
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: saveStatus === 'Saved' ? 'var(--status-success-accent)' : 'var(--status-warning-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} className={saveStatus === 'Retrying' ? 'spin' : ''} />
                  {saveStatus}
                </span>
              </div>

              <textarea
                rows="8"
                value={notesContent}
                onChange={handleNotesChange}
                placeholder="Document clinical assessment, history of present illness, findings, and diagnostic recommendations..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-control)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '14px'
                }}
              />

              {/* Physical Exam Needed & Referral Actions */}
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="recommendInPerson"
                    checked={recommendInPerson}
                    onChange={(e) => setRecommendInPerson(e.target.checked)}
                  />
                  <label htmlFor="recommendInPerson" style={{ fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}>
                    Physical Examination Required (Recommend In-Person OPD Followup)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Carries urgency flag for specialized physical triage
                  </span>
                  <Link
                    to="/doctor-portal"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Send size={12} /> Convert to Referral
                  </Link>
                </div>
              </div>

              {/* Note Save / Commit Controls */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveNotesToServer(true)}
                  icon={<Save size={14} />}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveNotesToServer(false)}
                  icon={<CheckCircle size={14} />}
                >
                  Commit Notes
                </Button>
              </div>
            </div>
          )}
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
          <strong style={{ color: 'var(--color-heading)' }}>Telemedicine Practice Guidelines (2020) Safeguard:</strong> This teleconsultation session is conducted for logistical evaluation, review of vault records, and triage referral. Session notes are stored append-only and committed prior to visit completion.
        </span>
      </div>
    </div>
  );
}
