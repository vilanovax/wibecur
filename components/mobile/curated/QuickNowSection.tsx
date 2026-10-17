'use client';

import {
  QUICK_NOW_PILLS,
  type MoodExplorerSelection,
  quickPillToSelection,
} from '@/lib/discovery/mood-explorer-config';
import { prefetchGuidedDiscovery } from '@/lib/discovery/guided-client';
import { preloadGuidedDiscoverySheet } from './explore-lazy-sections';
import { Button } from '@/components/ui/button';

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

function warmQuickPill(pill: (typeof QUICK_NOW_PILLS)[number]) {
  preloadGuidedDiscoverySheet();
  const selection = quickPillToSelection(pill);
  prefetchGuidedDiscovery({
    scenario: selection.scenario,
    location: selection.preset?.location,
    timeBudget: selection.preset?.timeBudget,
  });
}

export default function QuickNowSection({ onSelect, disabled = false }: Props) {
  return (
    <section
      className="px-4 pb-2 pt-4 lg:px-0 lg:py-3"
      aria-labelledby="quick-now-title"
    >
      <div className="mb-1.5 flex flex-col gap-0.5">
        <h2 id="quick-now-title" className="text-xs font-semibold text-muted-foreground">
          میانبر زمان و جا
        </h2>
        <p className="text-xs text-muted-foreground/80">
          همان مسیر راهنما — فقط با قید زمان یا مکان
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_NOW_PILLS.map((pill) => (
          <Button
            key={pill.id}
            type="button"
            variant="outline"
            size="sm"
            className="h-11"
            disabled={disabled}
            onPointerDown={() => warmQuickPill(pill)}
            onClick={() => onSelect(quickPillToSelection(pill))}
          >
            <span aria-hidden className="opacity-80">
              {pill.icon}
            </span>
            {SHORT_LABEL[pill.id] ?? pill.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
