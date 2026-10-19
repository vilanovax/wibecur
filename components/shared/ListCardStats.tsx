import { Bookmark, Package } from 'lucide-react';

interface ListCardStatsProps {
  saves: number;
  itemCount: number;
  /** ذخیره در بازهٔ اخیر (مثلاً ۷ روز) — اولویت نمایش در overlay */
  periodSaves?: number;
  periodLabel?: string;
  /** compact = یک خط کوتاه | overlay = روی عکس کاور */
  variant?: 'default' | 'compact' | 'overlay' | 'minimal' | 'items-only';
  className?: string;
}

/** Save-first — ذخیره برجسته، تعداد آیتم ثانویه */
export default function ListCardStats({
  saves,
  itemCount,
  periodSaves,
  periodLabel = 'این هفته',
  variant = 'default',
  className = '',
}: ListCardStatsProps) {
  const saveLabel = saves.toLocaleString('fa-IR');
  const itemLabel = itemCount.toLocaleString('fa-IR');
  const periodLabelText =
    periodSaves != null && periodSaves > 0
      ? `+${periodSaves.toLocaleString('fa-IR')} ${periodLabel}`
      : `${saveLabel} ذخیره`;

  if (variant === 'overlay') {
    return (
      <p
        className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs leading-tight text-background/95 tabular-nums lg:gap-x-1.5 ${className}`}
      >
        <Bookmark className="h-3 w-3 shrink-0 max-lg:opacity-90 lg:h-4 lg:w-4" />
        <span className="line-clamp-1">
          {periodLabelText} · {itemLabel} آیتم
        </span>
      </p>
    );
  }

  if (variant === 'minimal') {
    return (
      <p className={`wibe-caption text-muted-foreground tabular-nums ${className}`}>
        {saveLabel} ذخیره · {itemLabel} آیتم
      </p>
    );
  }

  if (variant === 'items-only') {
    return (
      <p className={`inline-flex items-center gap-1 wibe-caption text-muted-foreground ${className}`}>
        <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="tabular-nums">{itemLabel} آیتم</span>
      </p>
    );
  }

  if (variant === 'compact') {
    return (
      <p className={`flex items-center gap-2 wibe-caption text-muted-foreground ${className}`}>
        <span className="inline-flex items-center gap-1 font-medium text-brand">
          <Bookmark className="w-3.5 h-3.5" />
          {saveLabel} ذخیره
        </span>
        <span className="text-muted-foreground/60">·</span>
        <span className="inline-flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          {itemLabel} آیتم
        </span>
      </p>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-2 mt-2 ${className}`}>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <Bookmark className="w-4 h-4" />
        {saveLabel} ذخیره
      </span>
      <span className="inline-flex items-center gap-1 wibe-caption text-muted-foreground">
        <Package className="w-3.5 h-3.5" />
        {itemLabel} آیتم
      </span>
    </div>
  );
}
