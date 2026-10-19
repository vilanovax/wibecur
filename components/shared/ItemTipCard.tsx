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
      ? 'border-warning/25 bg-warning/[0.08]'
      : 'border-wibe bg-wibe-card';

  const iconBg =
    variant === 'highlight'
      ? 'bg-warning/15'
      : 'bg-wibe-surface';

  const textColor =
    variant === 'highlight'
      ? 'text-foreground'
      : 'text-foreground/85';

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 ${styles} ${className}`}
      role="note"
      aria-label="نکته"
    >
      <div className="flex items-start gap-2.5 text-start" dir="rtl">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${iconBg}`}
          aria-hidden
        >
          {variant === 'highlight' ? '💡' : '📝'}
        </span>
        <p className={`min-w-0 flex-1 pt-0.5 wibe-small leading-relaxed whitespace-pre-line ${textColor}`}>
          {text}
        </p>
      </div>
    </div>
  );
}
