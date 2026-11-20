import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  helperText,
  error,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span aria-hidden="true" style={{ color: 'var(--status-critical-text)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`form-input ${className}`.trim()}
        {...props}
      />
      {helperText && !error && (
        <div id={`${inputId}-helper`} className="form-helper">
          {helperText}
        </div>
      )}
      {error && (
        <div id={`${inputId}-error`} className="form-error" role="alert">
          <AlertCircle size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
