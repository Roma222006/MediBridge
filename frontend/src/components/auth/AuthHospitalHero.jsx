import React from 'react';
import hospitalBg from '../../assets/hospital-login-bg.jpg';
import { Hospital, ShieldCheck, Activity } from 'lucide-react';

export default function AuthHospitalHero() {
  return (
    <div
      className="auth-hero-section"
      style={{
        flex: '1 1 58%',
        minHeight: '100vh',
        backgroundImage: `url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 40px',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Right Edge Transition to Form Panel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(112, 43, 89, 0.15) 0%, rgba(255, 255, 255, 0) 30%, rgba(252, 239, 237, 0.1) 85%, rgba(255, 255, 255, 0.35) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* TOP ROW: Brand Watermark & ECG Heartbeat with Heart Symbol in Sky */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%'
        }}
      >
        {/* Brand Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            padding: '7px 16px',
            borderRadius: '9999px',
            boxShadow: '0 4px 14px rgba(112, 43, 89, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(248, 221, 227, 0.8)'
          }}
        >
          <Hospital size={18} style={{ color: 'var(--color-primary, #B83D83)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', letterSpacing: '-0.01em' }}>
            MediBridge
          </span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-primary, #B83D83)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted, #702B59)' }}>
            State Health Network
          </span>
        </div>

        {/* ECG Heartbeat & Heart Symbol in the Sky (Reproducing Reference Art) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '8px 18px',
            borderRadius: '9999px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(184, 61, 131, 0.18)',
            border: '1px solid rgba(242, 185, 202, 0.8)'
          }}
        >
          <svg width="190" height="34" viewBox="0 0 190 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* ECG Pulse Line */}
            <path
              d="M 4 17 L 36 17 L 42 12 L 48 17 L 54 17 L 62 4 L 72 30 L 80 8 L 86 24 L 92 17 L 112 17"
              stroke="#B83D83"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Heart Outline Symbol Connected to Line */}
            <path
              d="M 148 13 C 144 8 135 9 131 15 C 127 9 118 8 114 13 C 109 19 110 27 131 32 C 152 27 153 19 148 13 Z"
              stroke="#B83D83"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(14, -2) scale(0.92)"
            />
          </svg>
        </div>
      </div>

      {/* BOTTOM ROW: Hospital Information Banner */}
      <div
        className="auth-hero-bottom-card"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '520px'
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            padding: '18px 24px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(112, 43, 89, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(248, 221, 227, 0.9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#477B67',
                display: 'inline-block'
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-primary, #B83D83)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tamil Nadu State Health Systems
            </span>
          </div>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.125rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            Unified Healthcare Coordination Platform
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text, #29252A)', lineHeight: '1.45' }}>
            Real-time OPD appointment booking, tertiary referral transit, and live 108 emergency bed availability across empanelled healthcare centers.
          </p>
        </div>
      </div>
    </div>
  );
}
