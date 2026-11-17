import React from 'react';

export default function StatusBadge({ status, label = null }) {
  const cleanStatus = (status || '').toUpperCase();

  let variant = 'badge-neutral';
  let displayLabel = label || status;

  switch (cleanStatus) {
    case 'CONFIRMED':
    case 'ACCEPTED':
    case 'COMPLETED':
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'CLEAN':
      variant = 'badge-success';
      break;

    case 'REASSIGNMENT_PENDING':
      variant = 'badge-warning';
      displayLabel = displayLabel || 'Reassignment Pending';
      break;

    case 'HOLD':
    case 'UNDER_REVIEW':
    case 'SENT':
    case 'RECEIVED':
    case 'PATIENT_NOTIFIED':
    case 'CHECKED_IN':
    case 'IN_CONSULTATION':
      variant = 'badge-info';
      break;

    case 'CANCELLED':
    case 'REJECTED':
    case 'BLOCKED_LEAVE':
    case 'EXPIRED':
    case 'REVOKED':
    case 'INFECTED':
      variant = 'badge-danger';
      break;

    case 'DEMO_NOT_VERIFIED':
      variant = 'badge-warning';
      displayLabel = 'Demo, not verified';
      break;

    default:
      variant = 'badge-neutral';
  }

  return (
    <span className={`badge ${variant}`}>
      {displayLabel}
    </span>
  );
}
