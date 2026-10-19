import { Card } from '@/components/ui/card';

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
      ? 'border-brand/30 bg-brand/5'
      : 'bg-popover';

  const iconBg =
    variant === 'highlight'
      ? 'bg-brand/10 text-brand'
      : 'bg-muted text-muted-foreground';

  const textColor =
    variant === 'highlight'
      ? 'text-foreground/85'
      : 'text-foreground/85';

  return (
    <Card
      className={`px-3 py-2.5 ${styles} ${className}`}
      role="note"
      aria-label="نکته"
    >
      <div className="flex items-start gap-2.5 text-start">
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
    </Card>
  );
}
