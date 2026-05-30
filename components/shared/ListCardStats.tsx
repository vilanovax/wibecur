import { Bookmark, Package } from 'lucide-react';

interface ListCardStatsProps {
  saves: number;
  itemCount: number;
  /** compact = یک خط کوتاه | inline = داخل overlay سفید */
  variant?: 'default' | 'compact' | 'overlay' | 'minimal';
  className?: string;
}

/** Save-first — ذخیره برجسته، تعداد آیتم ثانویه */
export default function ListCardStats({
  saves,
  itemCount,
  variant = 'default',
  className = '',
}: ListCardStatsProps) {
  const saveLabel = saves.toLocaleString('fa-IR');

  if (variant === 'overlay') {
    return (
      <p className={`flex items-center gap-1 wibe-caption text-white/90 tabular-nums ${className}`}>
        <Bookmark className="w-3.5 h-3.5 shrink-0" />
        {saveLabel} ذخیره · {itemCount.toLocaleString('fa-IR')} آیتم
      </p>
    );
  }

  if (variant === 'minimal') {
    return (
      <p className={`wibe-caption text-wibe-secondary tabular-nums ${className}`}>
        {saveLabel} ذخیره · {itemCount.toLocaleString('fa-IR')} آیتم
      </p>
    );
  }

  if (variant === 'compact') {
    return (
      <p className={`flex items-center gap-2 wibe-caption text-wibe-secondary ${className}`}>
        <span className="inline-flex items-center gap-1 text-primary font-medium">
          <Bookmark className="w-3.5 h-3.5" />
          {saveLabel}
        </span>
        <span className="text-wibe-secondary/60">·</span>
        <span className="inline-flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          {itemCount} آیتم
        </span>
      </p>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-2 mt-2 ${className}`}>
      <span className="inline-flex items-center gap-1 wibe-small font-semibold text-primary">
        <Bookmark className="w-4 h-4" />
        {saveLabel} ذخیره
      </span>
      <span className="inline-flex items-center gap-1 wibe-caption text-wibe-secondary">
        <Package className="w-3.5 h-3.5" />
        {itemCount} آیتم
      </span>
    </div>
  );
}
