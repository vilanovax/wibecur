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
  // به‌ترتیب اولویت (فوری‌ترین اول) تا فقط مهم‌ترین سیگنال‌ها دیده شوند، نه «سوپ badge»
  const badges: { label: string; show: boolean; className: string }[] = [
    {
      label: '↓ در حال افت',
      show: isDeclining,
      className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    },
    {
      label: '⚠️ تعامل پایین',
      show: isLowEngagement,
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    },
    {
      label: '💰 قابل درآمد',
      show: isMonetizable,
      className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
    },
    {
      label: '🔥 رشد سریع',
      show: isFastRising,
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    },
  ];

  // حداکثر ۲ badge — از شلوغی و سیگنال‌های رقیب جلوگیری می‌کند
  const visible = badges.filter((b) => b.show).slice(0, 2);
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
