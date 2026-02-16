'use client';

import { List, TrendingUp, AlertCircle, Flag } from 'lucide-react';
import type { ListPulse } from '@/lib/admin/lists-intelligence';

const cards: Array<{
  key: keyof ListPulse;
  label: string;
  icon: typeof List;
  gradient: string;
  iconBg: string;
}> = [
  {
    key: 'totalLists',
    label: 'کل لیست‌ها',
    icon: List,
    gradient: 'from-[var(--primary)]/10 to-[var(--primary)]/5 border-[var(--primary)]/20',
    iconBg: 'bg-[var(--primary)]/15',
  },
  {
    key: 'risingLists',
    label: 'در حال رشد',
    icon: TrendingUp,
    gradient: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50',
    iconBg: 'bg-emerald-100',
  },
  {
    key: 'lowEngagementLists',
    label: 'کم‌تعامل',
    icon: AlertCircle,
    gradient: 'from-amber-500/10 to-amber-600/5 border-amber-200/50',
    iconBg: 'bg-amber-100',
  },
  {
    key: 'flaggedLists',
    label: 'پرچم‌دار',
    icon: Flag,
    gradient: 'from-red-500/10 to-red-600/5 border-red-200/50',
    iconBg: 'bg-red-100',
  },
];

interface ListPulseSummaryProps {
  pulse: ListPulse;
}

export default function ListPulseSummary({ pulse }: ListPulseSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, gradient, iconBg }) => (
        <div
          key={key}
          className={`rounded-2xl border bg-gradient-to-br ${gradient} p-4 shadow-[var(--shadow-card)]`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className={`p-2 rounded-xl ${iconBg}`}>
              <Icon className="w-4 h-4 text-[var(--color-text)]" />
            </span>
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              {label}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
            {pulse[key].toLocaleString('fa-IR')}
          </p>
        </div>
      ))}
    </div>
  );
}
