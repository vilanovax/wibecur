type Props = {
  tip: string;
  className?: string;
};

/** نکتهٔ ویژهٔ ادمین — جدا از توضیحات عمومی آیتم */
export default function ItemTipCard({ tip, className = '' }: Props) {
  const text = tip.trim();
  if (!text) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-3 ${className}`}
      role="note"
      aria-label="نکته"
    >
      <div className="flex items-start gap-2.5 text-start">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100/90 text-sm"
          aria-hidden
        >
          💡
        </span>
        <p className="min-w-0 flex-1 pt-0.5 wibe-small leading-[1.7] text-amber-950/90 whitespace-pre-line">
          {text}
        </p>
      </div>
    </div>
  );
}
