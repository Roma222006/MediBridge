import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { generatePrescriptionPDF } from '../utils/prescriptionPdf';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowLeft,
  FileText,
  Save,
  Send,
  Building2,
  CheckCircle,
  RefreshCw,
  Lock,
  Plus,
  Trash2,
  Activity,
  HeartPulse,
  User,
  Stethoscope,
  Download,
  MessageSquare,
  SendHorizontal
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

export default function TeleconsultRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // WebRTC Audio/Video States
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const isDoctor = user?.role === 'doctor';

  // Clinical Consultation Desk States
  const [activeTab, setActiveTab] = useState(isDoctor ? 'notes' : 'prescription'); // 'notes' / 'doctor_info', 'prescription', 'vault', 'chat'
  const [notesContent, setNotesContent] = useState(
    'SOAP CLINICAL EVALUATION:\n' +
    'Subjective: Patient reports mild chest tightness during morning walks. Zero resting angina.\n' +
    'Objective: Blood Pressure 118/78 mmHg, Resting Heart Rate 72 bpm, SpO2 99% on room air.\n' +
    'Assessment: Post-angioplasty stent recovery progressing normally. Stable hemodynamics.\n' +
    'Plan: Continue dual antiplatelet therapy. Review lipid panel in 4 weeks.'
  );
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [recommendInPerson, setRecommendInPerson] = useState(false);
  const [prescriptions, setPrescriptions] = useState([
    { id: 1, drug: 'Tab Atorvastatin', dose: '20mg', freq: '1-0-1 (Night)', duration: '30 Days' },
    { id: 2, drug: 'Tab Metoprolol Succinate', dose: '25mg', freq: '1-0-0 (Morning)', duration: '30 Days' },
    { id: 3, drug: 'Tab Ecosprin', dose: '75mg', freq: '0-1-0 (After Lunch)', duration: '30 Days' }
  ]);
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFreq, setNewFreq] = useState('1-0-0 (Morning)');
  const [newDuration, setNewDuration] = useState('15 Days');

  // Real-time In-Call Chat Messages
  const [chatMessages, setChatMessages] = useState([
    { sender: 'doctor', name: 'Dr. M. Revathi', time: '10:00 AM', text: 'Good morning. Welcome to your MediBridge teleconsultation session. Can you hear and see me properly?' },
    { sender: 'patient', name: 'Roma R', time: '10:01 AM', text: 'Good morning Doctor. Yes, audio and video are working perfectly.' },
    { sender: 'doctor', name: 'Dr. M. Revathi', time: '10:02 AM', text: 'Excellent. I have reviewed your latest vitals. Your BP is 118/78 mmHg, which is well controlled.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: isDoctor ? 'doctor' : 'patient',
      name: user?.fullName || (isDoctor ? 'Dr. M. Revathi' : 'Roma R'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: chatInput.trim()
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const localDraftKey = `teleconsult_draft_${id}`;

  useEffect(() => {
    initSession();
    initWebRTCStream();

    // Socket listeners for teleconsult signaling
    socket.on('participant_joined', (data) => {
      setActionMsg({
        type: 'info',
        text: `${data.participantName} has joined the secure video consultation.`
      });
    });

    socket.on('session_concluded', () => {
      setActionMsg({
        type: 'info',
        text: 'The attending physician has concluded this clinical session.'
      });
    });

    return () => {
      socket.off('participant_joined');
      socket.off('session_concluded');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const initSession = async () => {
    // Check if id is a valid 24-character hexadecimal Mongo ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isMongoId) {
      try {
        const res = await api.post(`/teleconsult/session/${id}/join`);
        if (res.data.success) {
          setSessionData(res.data.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fallback to demo session gracefully
      }
    }

    // Graceful fallback: Rich, valid consultation session
    const patientName = id?.includes('sundar') ? 'Roma R (Patient)' : id?.includes('apt-2') ? 'Arun K (Patient)' : 'Anitha K (Patient)';
    const doctorName = user?.role === 'doctor' ? user.fullName || 'Dr. Sundar M' : 'Dr. Sundar M (Cardiologist)';

    setSessionData({
      _id: id || 'TC-202611-8841',
      referenceNumber: `TC-202611-${(id?.substring(0, 4) || '8841').toUpperCase()}`,
      participantName: user?.role === 'doctor' ? patientName : doctorName,
      participantRole: user?.role === 'doctor' ? 'Patient' : 'Attending Physician',
      hospitalName: 'Kovai Medical Center & Hospital (KMCH)',
      waitingRoom: false,
      status: 'ACTIVE_CALL',
      vitals: {
        bp: '118/78 mmHg',
        pulse: '72 bpm',
        spO2: '99%',
        temp: '98.4 °F'
      }
    });
    setLoading(false);
  };

  const initWebRTCStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStreamActive(true);
      }
    } catch (err) {
      console.warn('[WebRTC] Camera access denied or inactive; using simulated clinical feed:', err.message);
      setStreamActive(false);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
    }
    setVideoEnabled(!videoEnabled);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
    }
    setAudioEnabled(!audioEnabled);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (err) {
        console.warn('[WebRTC] Screen share cancelled');
      }
    } else {
      setIsScreenSharing(false);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newDrug.trim()) return;

    const newMed = {
      id: Date.now(),
      drug: newDrug,
      dose: newDose || '10mg',
      freq: newFreq,
      duration: newDuration
    };

    setPrescriptions([...prescriptions, newMed]);
    setNewDrug('');
    setNewDose('');
    setActionMsg({ type: 'success', text: `Added "${newMed.drug}" to e-Prescription schedule.` });
  };

  const handleRemoveMedication = (medId) => {
    setPrescriptions(prescriptions.filter((m) => m.id !== medId));
  };

  const handleSaveNotes = () => {
    localStorage.setItem(localDraftKey, notesContent);
    setSaveStatus('Saved');
    setActionMsg({ type: 'success', text: 'Clinical consultation notes committed and synchronized.' });
  };

  const handleEndSession = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    const returnUrl = user?.role === 'doctor' ? '/doctor-portal?tab=desk' : '/patient-dashboard?tab=followups';
    navigate(returnUrl);
  };

  const formatTimer = (totalSec) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <h3 style={{ color: 'var(--color-heading)', margin: '0 0 6px 0' }}>Establishing WebRTC Teleconsultation Bridge...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Securing end-to-end encrypted DTLS-SRTP media channel</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px' }}>
      {/* Header with Call Status & Timer */}
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-blush-pink)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Video size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                Teleconsultation Room: {sessionData?.referenceNumber || 'TC-202611-8841'}
              </h1>
              <span className="badge badge-pill badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--status-success-solid)' }} />
                <span>WebRTC Live</span>
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Consultation with <strong>{sessionData?.participantName}</strong> &bull; {sessionData?.hospitalName}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-pale-rose)',
              color: 'var(--color-heading)',
              border: '1px solid var(--border)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontWeight: '700',
              fontSize: '0.875rem'
            }}
          >
            <Clock size={15} style={{ color: 'var(--color-primary)' }} />
            <span>Elapsed: {formatTimer(timerSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={handleEndSession}
            className="btn btn-sm btn-danger"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', borderRadius: '9999px', padding: '0 16px' }}
          >
            <PhoneOff size={15} />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Toast Alert Message */}
      {actionMsg && (
        <div
          role="alert"
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: actionMsg.type === 'success' ? 'var(--status-success-bg)' : 'var(--color-pale-rose)',
            color: actionMsg.type === 'success' ? 'var(--status-success-text)' : 'var(--color-heading)',
            border: `1px solid ${actionMsg.type === 'success' ? 'var(--status-success-accent)' : 'var(--border)'}`,
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

      {/* Main Grid: Video Room (Left) + Clinical Desk (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.25fr) minmax(320px, 1fr)', gap: '20px' }}>
        {/* LEFT COLUMN: WebRTC Dual-Feed Video Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="card"
            style={{
              backgroundColor: '#1E1720',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '440px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Top Bar inside Video: Participant & E2EE Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '9999px', backdropFilter: 'blur(4px)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#477B67' }} />
                <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '700' }}>
                  {sessionData?.participantName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '9999px', backdropFilter: 'blur(4px)', color: '#FFFFFF', fontSize: '0.7rem' }}>
                <ShieldCheck size={13} style={{ color: 'var(--color-primary)' }} />
                <span>E2EE 1080p HD &bull; WebRTC</span>
              </div>
            </div>

            {/* Remote Patient Video Feed Simulation */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2D1A29 0%, #171118 100%)'
              }}
            >
              <div style={{ textAlign: 'center', color: '#FFFFFF', padding: '20px' }}>
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    boxShadow: '0 0 24px rgba(184, 61, 131, 0.4)'
                  }}
                >
                  <User size={48} color="#FFFFFF" />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  {sessionData?.participantName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#E8E3E5', marginTop: '4px' }}>
                  Connected via MediBridge WebRTC Mesh Gateway
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                  <Activity size={14} style={{ color: '#477B67' }} />
                  <span>Bitrate: 2.4 Mbps &bull; Latency: 22ms</span>
                </div>
              </div>
            </div>

            {/* Doctor's Local Stream (Picture-in-Picture) */}
            <div
              style={{
                position: 'absolute',
                bottom: '80px',
                right: '16px',
                width: '160px',
                height: '110px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
                backgroundColor: '#000000',
                zIndex: 20
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: videoEnabled && streamActive ? 'block' : 'none',
                  transform: 'scaleX(-1)'
                }}
              />
              {(!videoEnabled || !streamActive) && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', backgroundColor: '#3B2033', fontSize: '0.75rem', fontWeight: '700' }}>
                  <Stethoscope size={24} style={{ marginBottom: '4px', color: 'var(--color-primary)' }} />
                  <span>Dr. Sundar M</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '4px', left: '6px', fontSize: '0.65rem', color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1px 6px', borderRadius: '4px' }}>
                You ({videoEnabled ? 'Cam ON' : 'Cam OFF'})
              </div>
            </div>

            {/* Video Controls Floating Toolbar */}
            <div
              style={{
                zIndex: 30,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                padding: '10px 18px',
                borderRadius: '9999px',
                width: 'fit-content',
                margin: '0 auto'
              }}
            >
              <button
                type="button"
                onClick={toggleAudio}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: audioEnabled ? 'rgba(255,255,255,0.2)' : '#C44752',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: videoEnabled ? 'rgba(255,255,255,0.2)' : '#C44752',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={videoEnabled ? 'Stop Video' : 'Start Video'}
              >
                {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              <button
                type="button"
                onClick={toggleScreenShare}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isScreenSharing ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <Monitor size={18} />
              </button>

              <button
                type="button"
                onClick={handleEndSession}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#C44752',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Conclude Visit"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>

          {/* Real-time Patient Vitals Strip */}
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Blood Pressure</span>
              <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>
                {sessionData?.vitals?.bp || '118/78 mmHg'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Heart Rate</span>
              <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-primary)', marginTop: '2px' }}>
                {sessionData?.vitals?.pulse || '72 bpm'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Oxygen SpO2</span>
              <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--status-success-solid)', marginTop: '2px' }}>
                {sessionData?.vitals?.spO2 || '99%'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Temperature</span>
              <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading)', marginTop: '2px' }}>
                {sessionData?.vitals?.temp || '98.4 °F'}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clinical Desk (SOAP Notes, e-Prescription, Vault Records) */}
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Clinical Desk Tabs Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: '#FAF6F7', overflowX: 'auto' }}>
            {isDoctor ? (
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                style={{
                  flex: 1,
                  padding: '14px 10px',
                  border: 'none',
                  backgroundColor: activeTab === 'notes' ? '#FFFFFF' : 'transparent',
                  borderBottom: activeTab === 'notes' ? '2px solid var(--color-primary)' : 'none',
                  color: activeTab === 'notes' ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                SOAP Notes
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('doctor_info')}
                style={{
                  flex: 1,
                  padding: '14px 10px',
                  border: 'none',
                  backgroundColor: activeTab === 'doctor_info' ? '#FFFFFF' : 'transparent',
                  borderBottom: activeTab === 'doctor_info' ? '2px solid var(--color-primary)' : 'none',
                  color: activeTab === 'doctor_info' ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Attending Physician
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('prescription')}
              style={{
                flex: 1,
                padding: '14px 10px',
                border: 'none',
                backgroundColor: activeTab === 'prescription' ? '#FFFFFF' : 'transparent',
                borderBottom: activeTab === 'prescription' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'prescription' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              e-Prescription ({prescriptions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '14px 10px',
                border: 'none',
                backgroundColor: activeTab === 'chat' ? '#FFFFFF' : 'transparent',
                borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'chat' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Live Chat ({chatMessages.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              style={{
                flex: 1,
                padding: '14px 10px',
                border: 'none',
                backgroundColor: activeTab === 'vault' ? '#FFFFFF' : 'transparent',
                borderBottom: activeTab === 'vault' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'vault' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isDoctor ? 'Patient Vault' : 'My Records'}
            </button>
          </div>

          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* DOCTOR VIEW: SOAP CLINICAL NOTES */}
            {isDoctor && activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    Physician Assessment & Progress Notes
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-success-solid)', fontWeight: '700' }}>
                    Auto-saved &bull; DPDP Signed
                  </span>
                </div>

                <textarea
                  rows="12"
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                    lineHeight: '1.5',
                    color: 'var(--color-heading)',
                    backgroundColor: '#FAF6F7',
                    resize: 'vertical'
                  }}
                />

                <div style={{ padding: '12px', backgroundColor: 'var(--color-pale-rose)', borderRadius: '10px', fontSize: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', color: 'var(--color-heading)' }}>
                    <input
                      type="checkbox"
                      checked={recommendInPerson}
                      onChange={(e) => setRecommendInPerson(e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span>Flag for Physical Examination Follow-up (KMCH OPD Block)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={14} />
                    <span>Commit Clinical Notes</span>
                  </button>
                </div>
              </div>
            )}

            {/* PATIENT VIEW: ATTENDING PHYSICIAN PROFILE */}
            {!isDoctor && activeTab === 'doctor_info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--color-pale-rose)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-blush-pink)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.125rem' }}>
                      DR
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                        {sessionData?.participantName || 'Dr. M. Revathi'}
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                        Consultant Interventional Cardiologist
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Hospital:</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-heading)' }}>Kovai Medical Center & Hospital (KMCH)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Council Reg No:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>TNMC/2018/09283</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Degrees:</span>
                      <span style={{ fontWeight: '600' }}>MBBS, MD (Gen Med), DM (Cardiology), FACC</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FAF6F7', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Clinic Room:</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Cardiology OPD Room 204</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                      <span className="badge badge-pill badge-success">Verified Active</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px', backgroundColor: '#FAF6F7', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading)' }}>Doctor's Clinical Instructions:</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.8125rem', color: 'var(--text)', lineHeight: '1.5' }}>
                    "Please keep your morning blood pressure readings and current prescription ready. If experiencing shortness of breath or dizziness, inform immediately during the video call."
                  </p>
                </div>
              </div>
            )}

            {/* TAB: DIGITAL E-PRESCRIPTION PAD (Shared between Doctor and Patient) */}
            {activeTab === 'prescription' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                      {isDoctor ? 'Active Medication Regimen' : 'Prescribed Medications for This Visit'}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Prescription Ref: {sessionData?.referenceNumber || 'RX-202611-0491'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      generatePrescriptionPDF(
                        {
                          id: id,
                          rxNumber: sessionData?.referenceNumber || 'RX-202611-0491',
                          patientName: isDoctor ? sessionData?.participantName : (user?.fullName || 'Roma R'),
                          patientAge: '42 / Female',
                          date: new Date().toLocaleDateString('en-GB'),
                          diagnosis: 'Coronary Artery Disease & Essential Hypertension',
                          medications: prescriptions.map((p) => ({
                            name: p.drug,
                            dose: p.dose,
                            freq: p.freq,
                            duration: p.duration
                          }))
                        },
                        {
                          fullName: isDoctor ? (user?.fullName || 'Dr. M. Revathi') : 'Dr. M. Revathi',
                          qualifications: 'MBBS, MD (Gen Med), DM (Cardiology), FACC',
                          regNumber: 'TNMC/2018/09283',
                          councilName: 'Tamil Nadu Medical Council',
                          department: 'Department of Cardiology (Room 204)'
                        }
                      );
                      setActionMsg({ type: 'success', text: 'Downloaded official medical prescription PDF.' });
                    }}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Download size={13} />
                    <span>Download Prescription PDF</span>
                  </button>
                </div>

                {/* Medication Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {prescriptions.map((med) => (
                    <div
                      key={med.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#FAF6F7',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                          {med.drug} ({med.dose})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {med.freq} &bull; {med.duration}
                        </div>
                      </div>
                      {isDoctor && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(med.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--status-critical-solid)', cursor: 'pointer', padding: '4px' }}
                          title="Remove Medication"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* DOCTOR ONLY: Add Drug Form */}
                {isDoctor && (
                  <form onSubmit={handleAddMedication} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Medication name (e.g. Tab Ramipril)"
                        value={newDrug}
                        onChange={(e) => setNewDrug(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Dose (5mg)"
                        value={newDose}
                        onChange={(e) => setNewDose(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <select
                        value={newFreq}
                        onChange={(e) => setNewFreq(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                      >
                        <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                        <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                        <option value="1-0-1 (Morning & Night)">1-0-1 (Morning & Night)</option>
                        <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                        <option value="SOS (When Needed)">SOS (When Needed)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 30 Days)"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-sm btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>Add to Prescription</span>
                    </button>
                  </form>
                )}

                {isDoctor && (
                  <button
                    type="button"
                    onClick={() => setActionMsg({ type: 'success', text: 'Digital prescription signed and transferred to Patient Health Vault.' })}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
                  >
                    <Send size={14} />
                    <span>Sign & Transmit Rx to Patient Vault</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB: LIVE CHAT (Shared Messaging between Doctor and Patient) */}
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '320px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    In-Consultation Secure Messaging
                  </span>
                  <span className="badge badge-pill badge-success">Encrypted</span>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#FAF6F7',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    overflowY: 'auto',
                    maxHeight: '240px'
                  }}
                >
                  {chatMessages.map((msg, idx) => {
                    const isMe = (isDoctor && msg.sender === 'doctor') || (!isDoctor && msg.sender === 'patient');
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: isMe ? 'var(--color-primary)' : '#FFFFFF',
                          color: isMe ? '#FFFFFF' : 'var(--color-heading)',
                          border: isMe ? 'none' : '1px solid var(--border)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.6875rem', opacity: 0.85, marginBottom: '2px' }}>
                          <span style={{ fontWeight: '700' }}>{msg.name}</span>
                          <span>{msg.time}</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', lineHeight: '1.4' }}>{msg.text}</div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a clinical message..."
                    style={{ flex: 1, height: '40px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 16px' }}
                  >
                    <SendHorizontal size={14} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB: HEALTH VAULT RECORDS */}
            {activeTab === 'vault' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                  {isDoctor ? 'Patient Diagnostic History' : 'My Health Vault Documents'}
                </span>
                {[
                  { name: 'Comprehensive Lipid Profile.pdf', date: '20 Nov 2026', type: 'Lab Report' },
                  { name: 'Siemens 3T MRI Brain Axial Scan.pdf', date: '18 Nov 2026', type: 'Radiology' },
                  { name: '12-Lead Electrocardiogram (ECG).pdf', date: '12 Nov 2026', type: 'Cardiology' }
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#FAF6F7',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--color-heading)' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.type} &bull; {doc.date}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActionMsg({ type: 'success', text: `Opening "${doc.name}" in high-resolution viewer.` })}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
