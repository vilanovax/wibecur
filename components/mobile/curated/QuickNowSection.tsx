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

/**
 * برچسب کوتاه — از تکرار «امشب» با مود free_night پرهیز می‌کند؛
 * چیپ‌ها میانبر همان مسیر راهنما هستند (زمان/جا).
 */
const SHORT_LABEL: Record<string, string> = {
  quick_30min: '۳۰ دقیقه',
  quick_tonight: 'فیلم در خانه',
  quick_out: 'بیرون رفتن',
};

export default function QuickNowSection({ onSelect, disabled = false }: Props) {
  return (
    <section
      className="border-t border-wibe/40 px-2.5 py-2 lg:px-0 lg:py-2.5"
      aria-labelledby="quick-now-title"
    >
      <div className="mb-1.5 flex flex-col gap-0.5">
        <h2 id="quick-now-title" className="wibe-caption font-semibold text-wibe-secondary">
          میانبر زمان و جا
        </h2>
        <p className="wibe-caption text-wibe-secondary/80">
          همان مسیر راهنما — فقط با قید زمان یا مکان
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_NOW_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(quickPillToSelection(pill))}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-wibe/80 bg-transparent px-2.5 py-1.5 wibe-caption font-medium text-wibe-secondary transition-colors hover:border-wibe hover:bg-wibe-card hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] disabled:opacity-50"
          >
            <span aria-hidden className="opacity-80">
              {pill.icon}
            </span>
            {SHORT_LABEL[pill.id] ?? pill.label}
          </button>
        ))}
      </div>
    </section>
  );
}
