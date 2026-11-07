'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  MOBILE_FEATURED_MOOD_IDS,
  MOOD_EXPLORER_CARDS,
  type MoodExplorerCard,
} from '@/lib/discovery/mood-explorer-config';
import MoodMissionCard from './MoodMissionCard';
import { Button } from '@/components/ui/button';
import { fa } from '@/lib/utils';

type Props = {
  onMoodSelect: (card: MoodExplorerCard) => void;
  disabled?: boolean;
};

const FEATURED_SET = new Set<string>(MOBILE_FEATURED_MOOD_IDS);
const EXTRA_COUNT = MOOD_EXPLORER_CARDS.length - MOBILE_FEATURED_MOOD_IDS.length;

export default function MoodExplorerHero({ onMoodSelect, disabled = false }: Props) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="mb-0">
      <header className="mb-4 lg:mb-5">
        <h2 className="text-balance wibe-h3 text-foreground">
          امروز دنبال چه وایبی هستی؟
        </h2>
        <p className="mt-1.5 max-w-md text-pretty wibe-small text-muted-foreground lg:mt-2">
          یک حال‌وهوا انتخاب کن؛ بقیه‌اش را ما جور می‌کنیم
        </p>
      </header>

      <div
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-2 lg:gap-3 xl:grid-cols-4"
        aria-label="کارت‌های حال و موقعیت"
      >
        {MOOD_EXPLORER_CARDS.map((card) => {
          const hidden = !showAll && !FEATURED_SET.has(card.id);
          if (hidden) return null;
          return (
            <div
              key={card.id}
              className={disabled ? 'pointer-events-none opacity-50' : undefined}
            >
              <MoodMissionCard card={card} onSelect={onMoodSelect} />
            </div>
          );
        })}
      </div>

      {EXTRA_COUNT > 0 && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-4 h-12 w-full gap-2 rounded-full"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll ? (
            <>
              بستن مودها
              <ChevronUp className="size-4" strokeWidth={2} aria-hidden />
            </>
          ) : (
            <>
              مودهای بیشتر ({fa(EXTRA_COUNT)})
              <ChevronDown className="size-4" strokeWidth={2} aria-hidden />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
