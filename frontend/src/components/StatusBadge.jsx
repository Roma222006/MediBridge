import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';

export default function StatusBadge({ status, label = null }) {
  const cleanStatus = (status || '').toUpperCase();

  let variant = 'badge-neutral';
  let displayLabel = label || status;
  let IconComponent = Info;

  switch (cleanStatus) {
    case 'CONFIRMED':
    case 'ACCEPTED':
    case 'COMPLETED':
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'CLEAN':
    case 'VERIFIED':
      variant = 'badge-success';
      IconComponent = CheckCircle2;
      break;

    case 'REASSIGNMENT_PENDING':
      variant = 'badge-warning';
      displayLabel = displayLabel || 'Reassignment Pending';
      IconComponent = AlertTriangle;
      break;

    case 'UNVERIFIED':
      variant = 'badge-warning';
      IconComponent = AlertTriangle;
      break;

    case 'HOLD':
    case 'UNDER_REVIEW':
    case 'SENT':
    case 'RECEIVED':
    case 'PATIENT_NOTIFIED':
    case 'CHECKED_IN':
    case 'IN_CONSULTATION':
      variant = 'badge-info';
      IconComponent = Clock;
      break;

    case 'CANCELLED':
    case 'REJECTED':
    case 'BLOCKED_LEAVE':
    case 'EXPIRED':
    case 'REVOKED':
    case 'INFECTED':
    case 'CRITICAL':
      variant = 'badge-danger';
      IconComponent = XCircle;
      break;

    case 'STALE_DATA':
      variant = 'badge-danger';
      displayLabel = displayLabel || 'Stale data';
      IconComponent = AlertCircle;
      break;

    case 'NOT_COVERED':
      variant = 'badge-not-covered';
      displayLabel = displayLabel || 'Not covered';
      IconComponent = XCircle;
      break;

    case 'DEMO_NOT_VERIFIED':
      variant = 'badge-demo';
      displayLabel = 'Demo, not verified';
      IconComponent = AlertTriangle;
      break;

    default:
      variant = 'badge-neutral';
      IconComponent = Info;
  }

  return (
    <span className={`badge ${variant}`}>
      <IconComponent size={13} strokeWidth={1.75} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
