'use client';

import { User, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { CuratorIntelligenceRow as CuratorIntelligenceRowType } from '@/lib/admin/types';

const badgeConfig: Record<
  CuratorIntelligenceRowType['trustBadge'],
  { label: string; className: string; icon: typeof TrendingUp }
> = {
  high_growth: {
    label: 'رشد بالا',
    className: 'bg-emerald-100 text-emerald-700',
    icon: TrendingUp,
  },
  stable: {
    label: 'پایدار',
    className: 'bg-blue-100 text-blue-700',
    icon: Shield,
  },
  risky: {
    label: 'نیاز به بررسی',
    className: 'bg-amber-100 text-amber-700',
    icon: AlertCircle,
  },
};

interface CuratorIntelligenceProps {
  curators: CuratorIntelligenceRowType[];
}

export default function CuratorIntelligence({ curators }: CuratorIntelligenceProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          هوش کیوریتورها
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          برترین کیوریتورها بر اساس رشد و اعتماد
        </p>
      </div>
      <div className="divide-y divide-[var(--color-border-muted)]">
        {curators.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            داده کیوریتور در دسترس نیست.
          </div>
        ) : (
          curators.map((c) => {
            const badge = badgeConfig[c.trustBadge];
            const BadgeIcon = badge.icon;
            return (
              <Link
                key={c.id}
                href={`/admin/users/${c.id}`}
                className="flex items-center gap-4 px-4 sm:px-6 py-3 hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--color-text-muted)] w-6">
                  {c.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-text)] truncate">
                    {c.name}
                    {c.username && (
                      <span className="text-[var(--color-text-muted)] font-normal">
                        {' '}
                        @{c.username}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    میانگین ذخیره هر لیست: {c.avgSavesPerList.toLocaleString('fa-IR')}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums text-emerald-600 shrink-0">
                  +{c.growthPercent}٪
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium shrink-0 ${badge.className}`}
                >
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
