'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { adminRadius, adminMotion } from '@/lib/admin/design-system/tokens';

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantStyles: Record<ActionButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:border-indigo-500',
  secondary:
    'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
  ghost:
    'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 border-red-600 dark:bg-red-500 dark:hover:bg-red-600 dark:border-red-500',
};

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function ActionButton({
  variant = 'primary',
  children,
  icon,
  className = '',
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        adminRadius.button,
        adminMotion.hover,
        'inline-flex items-center justify-center gap-2 border px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
