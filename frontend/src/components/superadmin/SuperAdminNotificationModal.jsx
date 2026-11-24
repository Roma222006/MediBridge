import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building2,
  X,
  ExternalLink,
  Check
} from 'lucide-react';

export default function SuperAdminNotificationModal({ isOpen, onClose, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('[Notifications] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/super-admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('[Mark Read] Error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/super-admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('[Mark All Read] Error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingTop: '64px',
        paddingRight: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border, #E8E3E5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border, #E8E3E5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--color-primary, #B83D83)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
              Platform Notifications
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--color-primary, #B83D83)',
                cursor: 'pointer'
              }}
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '12px', overflowY: 'auto', flex: 1, maxHeight: '65vh', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.8125rem' }}>
              Loading platform notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #702B59)', fontSize: '0.8125rem' }}>
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: n.read ? '#FFFFFF' : '#FAF6F7',
                  border: n.read ? '1px solid var(--border, #E8E3E5)' : '1px solid var(--color-primary, #B83D83)',
                  transition: 'background-color 0.12s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.8125rem', color: 'var(--color-heading, #702B59)' }}>
                    {n.title}
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n._id)}
                      title="Mark as read"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary, #B83D83)', padding: 0 }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text, #29252A)', lineHeight: '1.4' }}>
                  {n.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>
                  <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {n.link && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigate) onNavigate(n.link);
                        onClose();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary, #B83D83)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Open Module &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
