'use client';

import { Users, TrendingUp, Brain, AlertTriangle } from 'lucide-react';
import type { UserPulseSummary as UserPulseSummaryType } from '@/lib/admin/users-types';

const cards: {
  key: keyof UserPulseSummaryType;
  label: string;
  icon: typeof Users;
  bg: string;
}[] = [
  { key: 'activeUsers7d', label: 'کاربران فعال (۷ روز)', icon: Users, bg: 'from-blue-500/10 to-blue-600/5 border-blue-200/50' },
  { key: 'highGrowthCount', label: 'در حال رشد', icon: TrendingUp, bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50' },
  { key: 'curatorCandidatesCount', label: 'نامزد کیوریتور', icon: Brain, bg: 'from-violet-500/10 to-violet-600/5 border-violet-200/50' },
  { key: 'suspiciousCount', label: 'مشکوک', icon: AlertTriangle, bg: 'from-amber-500/10 to-amber-600/5 border-amber-200/50' },
];

interface UserPulseSummaryProps {
  data: UserPulseSummaryType;
}

export default function UserPulseSummary({ data }: UserPulseSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ key, label, icon: Icon, bg }) => (
        <div
          key={key}
          className={`rounded-2xl border bg-gradient-to-br ${bg} p-4 shadow-sm transition-shadow hover:shadow-md`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-white/60">
              <Icon className="w-4 h-4 text-[var(--color-text)]" />
            </span>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
              {label}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
            {(data[key] as number).toLocaleString('fa-IR')}
          </p>
          {key === 'activeUsers7d' && data.activeUsers7dDelta != null && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {data.activeUsers7dDelta >= 0 ? '+' : ''}
              {data.activeUsers7dDelta}٪ نسبت به دوره قبل
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
