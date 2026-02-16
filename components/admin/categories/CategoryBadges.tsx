'use client';

interface CategoryBadgesProps {
  isFastRising: boolean;
  isLowEngagement: boolean;
  isMonetizable: boolean;
  isDeclining: boolean;
}

const badgeClass = 'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0';

export default function CategoryBadges({
  isFastRising,
  isLowEngagement,
  isMonetizable,
  isDeclining,
}: CategoryBadgesProps) {
  const badges: { label: string; show: boolean; className: string }[] = [
    { label: '🔥 Fast Rising', show: isFastRising, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
    { label: '⚠️ Low Engagement', show: isLowEngagement, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
    { label: '💰 Monetizable', show: isMonetizable, className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200' },
    { label: '↓ Declining', show: isDeclining, className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
  ];

  const visible = badges.filter((b) => b.show);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" dir="rtl">
      {visible.map((b) => (
        <span key={b.label} className={`${badgeClass} ${b.className}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
