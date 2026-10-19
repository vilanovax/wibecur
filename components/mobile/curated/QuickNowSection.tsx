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

export default function QuickNowSection({ onSelect, disabled = false }: Props) {
  return (
    <section
      className="border-t border-wibe/50 px-3.5 py-5 lg:px-0 lg:py-6"
      aria-labelledby="quick-now-title"
    >
      <h2 id="quick-now-title" className="mb-3 wibe-h3 text-foreground">
        برای همین الان
      </h2>
      <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {QUICK_NOW_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(quickPillToSelection(pill))}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-wibe bg-wibe-card px-3.5 wibe-caption font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] disabled:opacity-50 lg:h-11 lg:wibe-small"
          >
            <span aria-hidden>{pill.icon}</span>
            {pill.label}
          </button>
        ))}
      </div>
    </section>
  );
}
