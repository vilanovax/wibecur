'use client';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 12-column responsive grid for Control Tower layout.
 * Use Tailwind col-span-* on children.
 */
export default function DashboardGrid({ children, className = '' }: DashboardGridProps) {
  return (
    <div
      className={`grid grid-cols-12 gap-4 md:gap-6 ${className}`}
      style={{ gap: 'var(--spacing-lg)' }}
    >
      {children}
    </div>
  );
}
