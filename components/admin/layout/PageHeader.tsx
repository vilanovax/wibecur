'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={['mb-6', className].filter(Boolean).join(' ')} dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-admin-text-primary dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-admin-text-secondary dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
