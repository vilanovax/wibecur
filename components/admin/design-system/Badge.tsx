'use client';

import { adminRadius } from '@/lib/admin/design-system/tokens';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'trending';

const variantStyles: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-500/30',
  warning:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/50 dark:border-amber-500/30',
  danger:
    'bg-red-500/15 text-red-700 dark:text-red-300 border-red-300/50 dark:border-red-500/30',
  neutral:
    'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  trending:
    'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-300/50 dark:border-violet-500/30',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        adminRadius.badge,
        'inline-flex items-center border px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
