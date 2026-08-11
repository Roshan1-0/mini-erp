import type { ChallanStatus, CustomerStatus, MovementType } from '../types';

interface StatusBadgeProps {
  status: ChallanStatus | CustomerStatus | MovementType | string;
}

const classes: Record<string, string> = {
  DRAFT: 'badge-draft',
  CONFIRMED: 'badge-confirmed',
  CANCELLED: 'badge-cancelled',
  ACTIVE: 'badge-active',
  LEAD: 'badge-lead',
  INACTIVE: 'badge-inactive',
  IN: 'badge-confirmed',
  OUT: 'badge-draft',
  LOW: 'badge-low-stock',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = classes[status] || 'badge-inactive';
  return <span className={cls}>{status}</span>;
}
