import React from 'react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#0E242E',
        color: '#8CA1AC',
        fontSize: '0.8125rem',
        padding: '24px 16px',
        borderTop: '1px solid #1A3E4E',
        marginTop: 'auto'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div>
            <strong style={{ color: '#D9EAE6' }}>MediBridge Healthcare Coordination Platform</strong> &bull; Visionet Techthon 2026 Round 2
          </div>
          <div>
            Built by <strong>Roma R</strong>, <strong>Ragavi R</strong>, <strong>Rithika KP</strong> &bull; Sri Shakthi Institute of Engineering and Technology
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(217, 234, 230, 0.1)', paddingTop: '10px', fontSize: '0.75rem', color: '#6A808C' }}>
          <strong>Clinical Safety Notice:</strong> MediBridge coordinates logistics and verifies facility, specialist and bed availability. MediBridge does not provide clinical diagnosis, medical counseling, or prescriptions. In life-threatening emergencies, proceed directly to the nearest trauma center or dial <strong>108</strong> immediately.
        </div>
      </div>
    </footer>
  );
}
