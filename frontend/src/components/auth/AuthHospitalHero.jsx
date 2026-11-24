import React from 'react';
import hospitalBg from '../../assets/hospital-login-bg.jpg';

export default function AuthHospitalHero() {
  return (
    <div
      className="auth-hero-section"
      style={{
        flex: '1 1 58%',
        minHeight: '100vh',
        height: '100%',
        backgroundImage: `url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Right Edge Transition to Form Panel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(112, 43, 89, 0.05) 0%, rgba(255, 255, 255, 0) 50%, rgba(252, 239, 237, 0.15) 85%, rgba(255, 255, 255, 0.4) 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
