import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Select({
  label,
  id,
  name,
  options = [],
  helperText,
  error,
  required = false,
  className = '',
  children,
  ...props
}) {
  const selectId = id || name;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span aria-hidden="true" style={{ color: 'var(--status-critical-text)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        className={`form-select ${className}`.trim()}
        {...props}
      >
        {options.length > 0
          ? options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {helperText && !error && (
        <div id={`${selectId}-helper`} className="form-helper">
          {helperText}
        </div>
      )}
      {error && (
        <div id={`${selectId}-error`} className="form-error" role="alert">
          <AlertCircle size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
