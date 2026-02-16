'use client';

import { adminRadius, adminShadow, adminMotion } from '@/lib/admin/design-system/tokens';

export type AdminCardVariant = 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const variantStyles: Record<AdminCardVariant, string> = {
  default:
    'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50',
  success:
    'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  warning:
    'border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10',
  danger:
    'border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10',
  neutral:
    'border-gray-200 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-800/60',
  info:
    'border-blue-200 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10',
};

interface AdminCardProps {
  variant?: AdminCardVariant;
  children: React.ReactNode;
  className?: string;
  padding?: 'default' | 'compact';
  hover?: boolean;
}

export default function AdminCard({
  variant = 'default',
  children,
  className = '',
  padding = 'default',
  hover = true,
}: AdminCardProps) {
  const paddingClass = padding === 'compact' ? 'p-3' : 'p-5';
  return (
    <div
      className={[
        adminRadius.card,
        adminShadow.card,
        adminMotion.hover,
        paddingClass,
        variantStyles[variant],
        hover ? 'hover:shadow-md' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
