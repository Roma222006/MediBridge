import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Settings,
  Shield,
  Bell,
  HardDrive,
  Wrench,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Clock,
  Database,
  Info
} from 'lucide-react';

export default function SystemSettingsView({ onToast }) {
  const [settings, setSettings] = useState([]);
  const [backupInfo, setBackupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('general');

  // Edit / Form state map
  const [formValues, setFormValues] = useState({});
  const [changeReasons, setChangeReasons] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      if (res.data?.success) {
        setSettings(res.data.data.settings || []);
        setBackupInfo(res.data.data.backupInfo || null);

        const initialValues = {};
        (res.data.data.settings || []).forEach((s) => {
          initialValues[s.key] = s.value;
        });
        setFormValues(initialValues);
      }
    } catch (err) {
      console.error('[Settings] Error:', err);
      if (onToast) onToast('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (key, val) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleReasonChange = (key, val) => {
    setChangeReasons((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSetting = async (key) => {
    const newVal = formValues[key];
    const reason = changeReasons[key] || 'Platform configuration updated by Super Administrator';

    setSavingKey(key);
    try {
      const res = await api.put(`/super-admin/settings/${key}`, {
        value: newVal,
        reason: reason.trim()
      });

      if (res.data?.success) {
        if (onToast) onToast(`Setting ${key} updated successfully.`);
        fetchSettings();
      }
    } catch (err) {
      console.error('[Update Setting] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to update setting.');
    } finally {
      setSavingKey(null);
    }
  };

  const currentCategorySettings = settings.filter((s) => s.category === activeCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.625rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            System Settings & Platform Governance
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Statewide platform configuration, authentication security policies, maintenance windows, and backup integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border, #E8E3E5)',
            backgroundColor: '#FFFFFF',
            color: 'var(--color-heading, #702B59)',
            fontSize: '0.8125rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Reload Settings</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '10px', overflowX: 'auto' }}>
        {[
          { id: 'general', label: 'General Configuration', icon: Settings },
          { id: 'security', label: 'Authentication & Security', icon: Shield },
          { id: 'notification', label: 'Notification Policies', icon: Bell },
          { id: 'maintenance', label: 'Platform Maintenance', icon: Lock },
          { id: 'backup', label: 'Data Management & Backup', icon: Database }
        ].map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSelected ? 'var(--color-blush-pink, #F8DDE3)' : 'transparent',
                color: isSelected ? 'var(--color-primary, #B83D83)' : 'var(--text, #29252A)',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? '800' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Backup Status Overview (Shown when in backup category) */}
      {activeCategory === 'backup' && backupInfo && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
            Database Backup & Storage Resilience
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.8125rem' }}>
            <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted, #702B59)', fontSize: '0.75rem', fontWeight: '700' }}>STATUS</span>
              <div style={{ fontWeight: '800', color: '#15803D', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} />
                <span>{backupInfo.status}</span>
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted, #702B59)', fontSize: '0.75rem', fontWeight: '700' }}>LAST BACKUP</span>
              <div style={{ fontWeight: '700', color: 'var(--text, #29252A)', marginTop: '2px' }}>
                {new Date(backupInfo.lastSuccessfulBackup).toLocaleDateString()} {new Date(backupInfo.lastSuccessfulBackup).toLocaleTimeString()}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted, #702B59)', fontSize: '0.75rem', fontWeight: '700' }}>SNAPSHOT FREQUENCY</span>
              <div style={{ fontWeight: '700', color: 'var(--text, #29252A)', marginTop: '2px' }}>
                {backupInfo.backupFrequency}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#FAF6F7', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted, #702B59)', fontSize: '0.75rem', fontWeight: '700' }}>PRIMARY STORAGE</span>
              <div style={{ fontWeight: '700', color: 'var(--text, #29252A)', marginTop: '2px' }}>
                {backupInfo.backupStorageLocation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings List for Active Category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', color: 'var(--text-muted, #702B59)' }}>
            Loading platform configuration parameters...
          </div>
        ) : currentCategorySettings.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border, #E8E3E5)', color: 'var(--text-muted, #702B59)' }}>
            No configurable parameters in this section.
          </div>
        ) : (
          currentCategorySettings.map((setting) => {
            const isBool = typeof setting.value === 'boolean';
            const isNum = typeof setting.value === 'number';
            const currentVal = formValues[setting.key] !== undefined ? formValues[setting.key] : setting.value;
            const isSaving = savingKey === setting.key;

            return (
              <div
                key={setting.key}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--border, #E8E3E5)',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-heading, #702B59)' }}>
                      {setting.key.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)', marginTop: '2px' }}>
                      {setting.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveSetting(setting.key)}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-primary, #B83D83)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save size={12} />
                    <span>{isSaving ? 'Updating...' : 'Save Parameter'}</span>
                  </button>
                </div>

                {/* Input Control */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted, #702B59)', marginBottom: '4px' }}>
                      CONFIGURED VALUE
                    </label>
                    {isBool ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700' }}>
                        <input
                          type="checkbox"
                          checked={currentVal}
                          onChange={(e) => handleValueChange(setting.key, e.target.checked)}
                          style={{ accentColor: 'var(--color-primary, #B83D83)', width: '18px', height: '18px' }}
                        />
                        <span>{currentVal ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : isNum ? (
                      <input
                        type="number"
                        value={currentVal}
                        onChange={(e) => handleValueChange(setting.key, Number(e.target.value))}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #E8E3E5)',
                          fontSize: '0.8125rem'
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={currentVal}
                        onChange={(e) => handleValueChange(setting.key, e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #E8E3E5)',
                          fontSize: '0.8125rem'
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted, #702B59)', marginBottom: '4px' }}>
                      JUSTIFICATION / REASON FOR MODIFICATION
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Directorate directive CBE/2026/SEC"
                      value={changeReasons[setting.key] || ''}
                      onChange={(e) => handleReasonChange(setting.key, e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border, #E8E3E5)',
                        fontSize: '0.8125rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
