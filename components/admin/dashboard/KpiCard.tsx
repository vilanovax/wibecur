'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { KpiItem } from '@/lib/admin/types';

interface KpiCardProps {
  item: KpiItem;
}

export default function KpiCard({ item }: KpiCardProps) {
  const { label, value, delta, trend = 'neutral' } = item;
  const deltaUp = trend === 'up';
  const deltaDown = trend === 'down';

  return (
    <div
      className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ padding: 'var(--spacing-lg) var(--spacing-xl)' }}
    >
      <p className="text-[13px] text-[var(--color-text-muted)] font-medium mb-1">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <p className="text-[28px] sm:text-[32px] font-bold text-[var(--color-text)] tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </p>
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium ${
              deltaUp
                ? 'bg-emerald-100 text-emerald-700'
                : deltaDown
                  ? 'bg-red-100 text-red-700'
                  : 'bg-[var(--gray-100)] text-[var(--color-text-muted)]'
            }`}
          >
            {deltaUp && <ArrowUp className="w-3 h-3" />}
            {deltaDown && <ArrowDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            {delta !== 0 && (
              <span>
                {delta > 0 ? '+' : ''}
                {delta.toLocaleString('fa-IR')}٪
              </span>
            )}
          </span>
        )}
      </div>
      {item.sparkline && item.sparkline.length > 0 && (
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {item.sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 min-w-0 rounded-t bg-[var(--primary)]/20"
              style={{ height: `${Math.max(4, (v / Math.max(...item.sparkline!)) * 100)}%` }}
              title={String(v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
