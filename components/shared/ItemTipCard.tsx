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
      ? 'border-wibe bg-wibe-surface/80'
      : 'border-wibe bg-wibe-card';

  const iconBg =
    variant === 'highlight'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-wibe-surface text-wibe-secondary';

  const textColor =
    variant === 'highlight'
      ? 'text-foreground/85'
      : 'text-foreground/85';

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${styles} ${className}`}
      role="note"
      aria-label="نکته"
    >
      <div className="flex items-start gap-2.5 text-right" dir="rtl">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg wibe-caption ${iconBg}`}
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
