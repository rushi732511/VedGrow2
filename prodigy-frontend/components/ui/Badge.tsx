interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-medium
        ${variantClasses[variant]}
      `}
    >
      {children}
    </span>
  );
}

// ─── Convenience helpers for common status values ─────────────────────────────
export function ApplicationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    SUBMITTED:       { label: 'Submitted',    variant: 'info' },
    PAYMENT_PENDING: { label: 'Pending Pay',  variant: 'warning' },
    ENROLLED:        { label: 'Enrolled',     variant: 'success' },
    COMPLETED:       { label: 'Completed',    variant: 'success' },
    WITHDRAWN:       { label: 'Withdrawn',    variant: 'danger' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PENDING:   { label: 'Pending',   variant: 'warning' },
    COMPLETED: { label: 'Paid',      variant: 'success' },
    FAILED:    { label: 'Failed',    variant: 'danger' },
    REFUNDED:  { label: 'Refunded',  variant: 'info' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function BatchStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    OPEN:      { label: 'Open',      variant: 'info' },
    ACTIVE:    { label: 'Active',    variant: 'success' },
    COMPLETED: { label: 'Completed', variant: 'default' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}