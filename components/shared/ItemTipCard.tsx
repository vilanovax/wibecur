type Props = {
  tip: string;
  className?: string;
  variant?: 'note' | 'highlight';
};

/** نکتهٔ ویژه — variant note برای مترجم/نکته ملایم */
export default function ItemTipCard({
  tip,
  className = '',
  variant = 'note',
}: Props) {
  const text = tip.trim();
  if (!text) return null;

  const styles =
    variant === 'highlight'
      ? 'border-amber-200/80 bg-amber-50/70'
      : 'border-wibe bg-wibe-card';

  const iconBg =
    variant === 'highlight'
      ? 'bg-amber-100/90'
      : 'bg-gray-100';

  const textColor =
    variant === 'highlight'
      ? 'text-amber-950/90'
      : 'text-foreground/85';

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 ${styles} ${className}`}
      role="note"
      aria-label="نکته"
    >
      <div className="flex items-start gap-2.5 text-right" dir="rtl">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${iconBg}`}
          aria-hidden
        >
          {variant === 'highlight' ? '💡' : '📝'}
        </span>
        <p className={`min-w-0 flex-1 pt-0.5 wibe-small leading-[1.7] whitespace-pre-line ${textColor}`}>
          {text}
        </p>
      </div>
    </div>
  );
}
