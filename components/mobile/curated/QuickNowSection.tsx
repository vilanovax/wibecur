'use client';

import {
  QUICK_NOW_PILLS,
  type MoodExplorerSelection,
  quickPillToSelection,
} from '@/lib/discovery/mood-explorer-config';

type Props = {
  onSelect: (selection: MoodExplorerSelection) => void;
  disabled?: boolean;
};

/** برچسب کوتاه برای چیپ‌ها */
const SHORT_LABEL: Record<string, string> = {
  quick_30min: '۳۰ دقیقه',
  quick_tonight: 'امشب',
  quick_out: 'بیرون',
};

export default function QuickNowSection({ onSelect, disabled = false }: Props) {
  return (
    <section
      className="border-t border-wibe/60 px-2.5 py-3 lg:px-0 lg:py-4"
      aria-labelledby="quick-now-title"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="quick-now-title" className="wibe-small font-bold text-foreground">
          زمان و جا
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_NOW_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(quickPillToSelection(pill))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-wibe bg-wibe-card px-3 py-2 wibe-caption font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] disabled:opacity-50"
          >
            <span aria-hidden>{pill.icon}</span>
            {SHORT_LABEL[pill.id] ?? pill.label}
          </button>
        ))}
      </div>
    </section>
  );
}
