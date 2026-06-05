'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Hash, Zap, Bookmark, Clock, Layers } from 'lucide-react';
import type { ListTrendingDebugData } from '@/lib/admin/trending-debug';

const STATUS = {
  rising: { label: 'صعودی', Icon: TrendingUp, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  stable: { label: 'ثابت', Icon: Minus, className: 'text-[var(--color-text-muted)] bg-[var(--color-bg)] border-[var(--color-border-muted)]' },
  declining: { label: 'نزولی', Icon: TrendingDown, className: 'text-red-600 bg-red-50 border-red-200' },
};

interface ListEditIntelligenceBarProps {
  intelligence: (ListTrendingDebugData & { list?: { createdAt?: string } }) | null;
  saveCount: number;
  itemCount: number;
  avgSavesPerItem: string;
  ownerName: string;
  ownerLink: string | null;
}

export default function ListEditIntelligenceBar({
  intelligence,
  saveCount,
  itemCount,
  avgSavesPerItem,
  ownerName,
  ownerLink,
}: ListEditIntelligenceBarProps) {
  const raw = intelligence?.rawMetrics;
  const score = intelligence?.scoreBreakdown?.finalScore;
  const scoreNegative = typeof score === 'number' && score < 0;
  const statusConf = intelligence?.status ? STATUS[intelligence.status] : null;
  const StatusIcon = statusConf?.Icon ?? Minus;

  const cells = [
    {
      label: 'رتبه',
      value: intelligence?.currentRank != null ? `#${intelligence.currentRank}` : '—',
      icon: Hash,
    },
    {
      label: 'امتیاز',
      value: score != null ? score.toLocaleString('fa-IR') : '—',
      icon: Zap,
      valueClass: scoreNegative ? 'text-red-600' : 'text-[var(--primary)]',
    },
    {
      label: '۲۴س',
      value: `+${(raw?.saves24h ?? 0).toLocaleString('fa-IR')}`,
      icon: TrendingUp,
      valueClass: (raw?.saves24h ?? 0) > 0 ? 'text-emerald-600' : 'text-[var(--color-text-muted)]',
    },
    {
      label: 'ذخیره',
      value: saveCount.toLocaleString('fa-IR'),
      icon: Bookmark,
    },
    {
      label: 'آیتم',
      value: itemCount.toLocaleString('fa-IR'),
      icon: Layers,
    },
    {
      label: 'تعامل',
      value: raw?.engagementRatio != null ? `${raw.engagementRatio}٪` : '—',
      icon: TrendingUp,
    },
    {
      label: 'سن',
      value: raw?.ageDays != null ? `${raw.ageDays} روز` : '—',
      icon: Clock,
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]" dir="rtl">
      <div className="flex flex-wrap items-stretch divide-x divide-x-reverse divide-[var(--color-border-muted)]">
        {cells.map(({ label, value, icon: Icon, valueClass }) => (
          <div key={label} className="flex-1 min-w-[72px] px-3 py-2.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className="w-3 h-3 text-[var(--color-text-muted)]" />
              <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
            </div>
            <p className={`text-sm font-bold tabular-nums ${valueClass ?? 'text-[var(--color-text)]'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-[var(--color-border-muted)] bg-[var(--color-bg)]/40 text-xs">
        <span className="text-[var(--color-text-muted)]">
          مالک:{' '}
          {ownerLink ? (
            <Link href={ownerLink} className="font-medium text-[var(--primary)] hover:underline">
              {ownerName}
            </Link>
          ) : (
            <strong className="text-[var(--color-text)]">{ownerName}</strong>
          )}
          <span className="mx-2 opacity-30">·</span>
          میانگین ذخیره/آیتم: <strong className="text-[var(--color-text)]">{avgSavesPerItem}</strong>
        </span>
        {statusConf && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-medium ${statusConf.className}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConf.label}
          </span>
        )}
      </div>
    </div>
  );
}
