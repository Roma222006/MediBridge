import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <strong style={{ color: 'var(--color-heading)' }}>MediBridge Healthcare Coordination Platform</strong> &bull; Visionet Techthon 2026 Round 2
          </div>
          <div>
            Built by <strong>Roma R</strong>, <strong>Ragavi R</strong>, <strong>Rithika KP</strong> &bull; Sri Shakthi Institute of Engineering and Technology
          </div>
        </div>
        <div className="footer-bottom">
          <strong>Clinical Safety Notice:</strong> MediBridge coordinates logistics and verifies facility, specialist and bed availability. MediBridge does not provide clinical diagnosis, medical counseling, or prescriptions. In life-threatening emergencies, proceed directly to the nearest trauma center or dial <strong>108</strong> immediately.
        </div>
      </div>
    </footer>
  );
}
