import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'tertiary' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'dense'
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
    danger: 'btn-danger'
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm: 'btn-sm',
    dense: 'btn-dense',
    md: '',
    lg: 'btn-lg'
  }[size] || '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
