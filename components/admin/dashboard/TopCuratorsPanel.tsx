'use client';

import { User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { TopCurator } from '@/lib/admin/types';

const reliabilityLabel: Record<string, string> = {
  high: 'قابل اعتماد',
  medium: 'متوسط',
  low: 'نیاز به بررسی',
};

interface TopCuratorsPanelProps {
  curators: TopCurator[];
}

export default function TopCuratorsPanel({ curators }: TopCuratorsPanelProps) {
  return (
    <div className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          برترین کیوریتورها
        </h3>
        <Link
          href="/admin/users"
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          همه
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
      <ul className="space-y-2 flex-1">
        {curators.length === 0 ? (
          <li className="text-sm text-[var(--color-text-muted)] py-4">
            کیوریتوری یافت نشد.
          </li>
        ) : (
          curators.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/users/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {c.name}
                    {c.username && (
                      <span className="text-[var(--color-text-muted)] font-normal">
                        {' '}
                        @{c.username}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {c.followers.toLocaleString('fa-IR')} دنبال‌کننده ·{' '}
                    {c.saves.toLocaleString('fa-IR')} ذخیره
                    {c.growthPercent != null && (
                      <span className="text-emerald-600"> · +{c.growthPercent}٪</span>
                    )}
                  </p>
                </div>
                {c.reliability && (
                  <span
                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${
                      c.reliability === 'high'
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.reliability === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-[var(--color-text-muted)]'
                    }`}
                  >
                    {reliabilityLabel[c.reliability] ?? c.reliability}
                  </span>
                )}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
