'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { adminRadius } from '@/lib/admin/design-system/tokens';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface IntelligenceHeaderBarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  /** دکمه‌ها یا لینک‌های اکشن در سمت چپ (در RTL) */
  actions?: React.ReactNode;
  className?: string;
}

export default function IntelligenceHeaderBar({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}: IntelligenceHeaderBarProps) {
  return (
    <header
      className={[
        adminRadius.card,
        'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm p-5',
        className,
      ].join(' ')}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
              {breadcrumbs.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-4 w-4 rotate-180" />}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
