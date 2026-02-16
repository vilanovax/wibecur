'use client';

import { ArrowUp, ArrowDown, Minus, type LucideIcon } from 'lucide-react';
import { adminRadius, adminShadow, adminMotion } from '@/lib/admin/design-system/tokens';

export type MetricTrend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number | string;
  trend?: MetricTrend;
  icon?: LucideIcon;
  className?: string;
  /** عدد را با toLocaleString('fa-IR') نمایش بده */
  valueLocale?: boolean;
}

export default function MetricCard({
  title,
  value,
  delta,
  trend = 'neutral',
  icon: Icon,
  className = '',
  valueLocale = true,
}: MetricCardProps) {
  const displayValue =
    typeof value === 'number' && valueLocale ? value.toLocaleString('fa-IR') : String(value);

  const trendStyles = {
    up: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20',
    down: 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20',
    neutral: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50',
  };

  return (
    <div
      className={[
        adminRadius.card,
        adminShadow.card,
        adminMotion.hover,
        'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 hover:shadow-md',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
        {displayValue}
      </p>
      {(delta !== undefined && delta !== null) || trend !== 'neutral' ? (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium ${trendStyles[trend]}`}
          >
            {trend === 'up' && <ArrowUp className="w-3 h-3" />}
            {trend === 'down' && <ArrowDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            {typeof delta === 'number' && (
              <span>
                {delta > 0 ? '+' : ''}
                {delta.toLocaleString('fa-IR')}٪
              </span>
            )}
            {typeof delta === 'string' && <span>{delta}</span>}
          </span>
        </div>
      ) : null}
    </div>
  );
}
