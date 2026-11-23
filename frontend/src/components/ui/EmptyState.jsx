import React from 'react';
import Button from './Button';

export function EmptyState({
  message = 'No data available for this view.',
  actionLabel = null,
  onAction = null,
  actionVariant = 'secondary',
  className = ''
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <Button variant={actionVariant} size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
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
