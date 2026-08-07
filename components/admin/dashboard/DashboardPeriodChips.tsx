'use client';

import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, ChevronLeft, BarChart3 } from 'lucide-react';
import type { PeriodSnapshot } from '@/lib/admin/types';

const RANGE_LABELS: Record<PeriodSnapshot['range'], string> = {
  today: 'امروز',
  '7d': '۷ روز',
  '30d': '۳۰ روز',
};

interface DashboardPeriodChipsProps {
  snapshot: PeriodSnapshot;
  pulseCards?: { label: string; value: string | number }[];
}

function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]">
        <Minus className="w-3 h-3" />
        ۰٪
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
        up ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {up ? '+' : ''}
      {delta.toLocaleString('fa-IR')}٪
    </span>
  );
}

function KpiGrowthLink() {
  return (
    <Link
      href="/admin/kpi"
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors mr-auto sm:mr-0"
    >
      <BarChart3 className="w-3.5 h-3.5" />
      جزئیات رشد
      <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
    </Link>
  );
}

export default function DashboardPeriodChips({
  snapshot,
  pulseCards = [],
}: DashboardPeriodChipsProps) {
  const chips = [
    { label: 'کاربر جدید', value: snapshot.newUsers, delta: snapshot.usersDelta },
    { label: 'لیست جدید', value: snapshot.newLists, delta: snapshot.listsDelta },
    { label: 'ذخیره', value: snapshot.saves, delta: snapshot.savesDelta },
  ];

  const allZero = chips.every((c) => c.value === 0);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-xs text-[var(--color-text-muted)] shrink-0">
        فعالیت {RANGE_LABELS[snapshot.range]}:
      </span>

      {allZero ? (
        <span className="inline-flex items-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg)]/50 px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">
          فعالیتی در این بازه ثبت نشده
        </span>
      ) : (
        chips.map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
          >
            <span className="text-[var(--color-text-muted)]">{chip.label}</span>
            <strong className="tabular-nums text-[var(--color-text)]">
              {chip.value.toLocaleString('fa-IR')}
            </strong>
            <DeltaChip delta={chip.delta} />
          </span>
        ))
      )}

      {pulseCards.map((card) => (
        <span
          key={card.label}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-2.5 py-1.5 text-xs"
        >
          <span className="text-[var(--color-text-muted)]">{card.label}</span>
          <strong className="tabular-nums text-[var(--color-text)]">
            {typeof card.value === 'number'
              ? card.value.toLocaleString('fa-IR')
              : card.value}
          </strong>
        </span>
      ))}

      <KpiGrowthLink />
    </div>
  );
}
