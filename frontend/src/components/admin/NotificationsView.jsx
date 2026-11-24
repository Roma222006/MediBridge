import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  Bed,
  Check,
  X,
  Clock,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function NotificationsView({ onToast }) {
  const [filterCategory, setFilterCategory] = useState('All');

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('medibridge_hospital_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'notif-1',
        category: 'Critical 108 Alerts',
        title: 'Emergency 108 Acute Trauma Inbound Dispatch',
        message: 'Ambulance ALS-02 en route from Pollachi Road with acute multi-trauma patient. Triage Bay 2 requested.',
        time: '8 mins ago',
        read: false,
        urgency: 'high'
      },
      {
        id: 'notif-2',
        category: 'Doctor Verification',
        title: 'New Doctor Credential Submission',
        message: 'Dr. Lavanya S (Neurology) submitted State Medical Council permanent registration certificate for review.',
        time: '25 mins ago',
        read: false,
        urgency: 'medium'
      },
      {
        id: 'notif-3',
        category: 'Doctor Verification',
        title: 'Additional Certificate Uploaded',
        message: 'Dr. Priya Dharshini (Pediatrics) uploaded post-graduate degree certificate and fellowship credential.',
        time: '1 hour ago',
        read: true,
        urgency: 'medium'
      },
      {
        id: 'notif-4',
        category: 'Appointment Updates',
        title: 'Doctor Out-of-Office Leave Submitted',
        message: 'Dr. M. Revathi applied for CME Conference Leave on 24-25 Dec 2026 with Dr. Sundar M covering.',
        time: '2 hours ago',
        read: false,
        urgency: 'medium'
      },
      {
        id: 'notif-5',
        category: 'Appointment Updates',
        title: 'Replacement Specialist Reassigned',
        message: 'Patient Karthik S (T-104) successfully matched with Dr. Prakash R following emergency OT call.',
        time: '3 hours ago',
        read: true,
        urgency: 'low'
      },
      {
        id: 'notif-6',
        category: 'Facility Warnings',
        title: 'ICU Bed Capacity Threshold Alert',
        message: 'ICU available beds dipped to 5 beds. Emergency 3-bed reserve hold automatically activated.',
        time: '4 hours ago',
        read: true,
        urgency: 'high'
      }
    ];
  });

  const persistNotifications = (updated) => {
    setNotifications(updated);
    localStorage.setItem('medibridge_hospital_notifications', JSON.stringify(updated));
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    persistNotifications(updated);
    if (onToast) onToast({ type: 'success', text: 'All hospital operational notifications marked as read.' });
  };

  const handleToggleRead = (id) => {
    const updated = notifications.map((n) => {
      if (n.id === id) return { ...n, read: !n.read };
      return n;
    });
    persistNotifications(updated);
  };

  const handleDelete = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    persistNotifications(updated);
  };

  const filtered = notifications.filter((n) => {
    if (filterCategory === 'All') return true;
    return n.category === filterCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 4px 0' }}>
            Hospital Operational Notification Center
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time critical alerts, doctor credential submissions, appointment cancellations, and facility thresholds.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            fontSize: '0.8125rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'All', label: `All Alerts (${notifications.length})` },
          { key: 'Critical 108 Alerts', label: 'Critical 108 Alerts' },
          { key: 'Doctor Verification', label: 'Doctor Verification' },
          { key: 'Appointment Updates', label: 'Appointment Updates' },
          { key: 'Facility Warnings', label: 'Facility Warnings' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterCategory(tab.key)}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: filterCategory === tab.key ? 'var(--color-primary)' : '#FFFFFF',
              color: filterCategory === tab.key ? '#FFFFFF' : 'var(--color-heading)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: filterCategory === tab.key ? '0 2px 4px rgba(184, 61, 131, 0.2)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((n) => (
          <div
            key={n.id}
            className="card"
            style={{
              padding: '16px 20px',
              backgroundColor: n.read ? '#FFFFFF' : '#FAF6F7',
              border: n.urgency === 'high' && !n.read ? '1px solid #FCA5A5' : '1px solid var(--border)',
              borderLeft: n.urgency === 'high' ? '4px solid #B83245' : !n.read ? '4px solid var(--color-primary)' : '4px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: n.urgency === 'high' ? '#FEE2E2' : 'var(--surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {n.urgency === 'high' ? (
                  <AlertTriangle size={18} style={{ color: '#B83245' }} />
                ) : (
                  <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-heading)' }}>
                    {n.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#FAF6F7',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {n.category}
                  </span>
                  {!n.read && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text)' }}>
                  {n.message}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {n.time}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleToggleRead(n.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                {n.read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(n.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
