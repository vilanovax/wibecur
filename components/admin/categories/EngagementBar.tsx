'use client';

interface EngagementBarProps {
  percentage: number;
  className?: string;
}

export default function EngagementBar({ percentage, className = '' }: EngagementBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const barColor =
    clamped > 20
      ? 'bg-emerald-500 dark:bg-emerald-500'
      : clamped >= 10
        ? 'bg-amber-500 dark:bg-amber-500'
        : 'bg-red-400 dark:bg-red-500';

  return (
    <div className={`w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`} dir="ltr">
      <div
        className={`h-full rounded-full transition-[width] ${barColor}`}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
