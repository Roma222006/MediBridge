import React from 'react';
import Button from './Button';

export function EmptyState({
  title = null,
  description = null,
  message = 'No data available for this view.',
  actionLabel = null,
  onAction = null,
  actionVariant = 'secondary',
  className = ''
}) {
  const displayTitle = title;
  const displayDesc = description || (title ? null : message);

  return (
    <div className={`empty-state ${className}`.trim()} style={{ textAlign: 'center', padding: '32px 16px' }}>
      {displayTitle && (
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-heading)' }}>
          {displayTitle}
        </h4>
      )}
      {displayDesc && (
        <p className="empty-state-message" style={{ margin: '0 auto', maxWidth: '440px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {displayDesc}
        </p>
      )}
      {actionLabel && onAction && (
        <div style={{ marginTop: '14px' }}>
          <Button variant={actionVariant} size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  message = 'An unexpected error occurred while loading this view.',
  onRetry = null,
  className = ''
}) {
  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry Action
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
