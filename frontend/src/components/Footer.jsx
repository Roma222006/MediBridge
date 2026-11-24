import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer" style={{ borderTop: '1px solid var(--border)', backgroundColor: '#FFFFFF', padding: '18px 24px', marginTop: 'auto' }}>
      <div className="footer-inner" style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="footer-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--color-heading)' }}>MediBridge Healthcare Coordination Platform</strong>
            <span>&bull;</span>
            <span>State Health Network & Facility Registry</span>
          </div>
          <div style={{ fontWeight: '600', color: 'var(--color-heading)' }}>
            &copy; 2026 MediBridge Healthcare Systems. All rights reserved.
          </div>
        </div>
        <div className="footer-bottom" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px solid #F0ECEE', paddingTop: '8px' }}>
          <strong style={{ color: 'var(--color-heading)' }}>Clinical Safety & Statutory Notice:</strong> MediBridge coordinates logistics and verifies facility, specialist and bed availability. MediBridge does not provide clinical diagnosis, medical counseling, or autonomous prescriptions. In life-threatening emergencies, proceed directly to the nearest verified trauma center or dial <strong>108 / 112</strong> immediately.
        </div>
      </div>
    </footer>
  );
}
