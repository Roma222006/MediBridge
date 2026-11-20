import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function Toast({
  type = 'info', // 'success' | 'warning' | 'error' | 'info'
  message,
  onDismiss
}) {
  const icons = {
    success: <CheckCircle2 size={18} strokeWidth={1.75} style={{ color: 'var(--status-success-accent)' }} />,
    warning: <AlertTriangle size={18} strokeWidth={1.75} style={{ color: 'var(--status-warning-accent)' }} />,
    error: <AlertCircle size={18} strokeWidth={1.75} style={{ color: 'var(--status-critical-solid)' }} />,
    info: <Info size={18} strokeWidth={1.75} style={{ color: 'var(--color-primary)' }} />
  };

  return (
    <div className="toast" role="status">
      {icons[type] || icons.info}
      <span style={{ flex: 1, fontSize: 'var(--text-body-staff)' }}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-tertiary"
          aria-label="Dismiss notification"
          style={{ height: '24px', width: '24px', padding: 0 }}
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
