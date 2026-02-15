'use client';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div
      className={`rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] ${className}`}
      style={{ padding: 'var(--spacing-xl)' }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="min-h-[200px]">{children}</div>
    </div>
  );
}
