'use client';

import { Settings2, Sparkles, Target, Users } from 'lucide-react';

interface CommentSeedStatsBarProps {
  campaignCount: number;
  personaCount: number;
  rulesCount: number;
  targetItemCount: number | null;
  showTarget: boolean;
}

export default function CommentSeedStatsBar({
  campaignCount,
  personaCount,
  rulesCount,
  targetItemCount,
  showTarget,
}: CommentSeedStatsBarProps) {
  const items = [
    { icon: Sparkles, label: 'کمپین', value: campaignCount },
    { icon: Users, label: 'پرسونا', value: personaCount },
    { icon: Settings2, label: 'قانون', value: rulesCount },
    ...(showTarget && targetItemCount != null
      ? [{ icon: Target, label: 'آیتم هدف', value: targetItemCount }]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs"
        >
          <Icon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <span className="text-[var(--color-text-muted)]">{label}</span>
          <span className="font-bold tabular-nums text-[var(--color-text)]">
            {value.toLocaleString('fa-IR')}
          </span>
        </div>
      ))}
    </div>
  );
}
