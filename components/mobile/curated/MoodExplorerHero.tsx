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
      <header className="mb-3.5 lg:mb-4">
        <h2 className="text-balance text-xl font-bold leading-tight">
          امروز دنبال چه وایبی هستی؟
        </h2>
        <p className="mt-1.5 max-w-md text-pretty text-sm text-muted-foreground lg:mt-2 lg:text-base">
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
          className="mt-3 w-full"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll ? (
            <>
              بستن مودها
              <ChevronUp className="h-4 w-4" strokeWidth={2} aria-hidden />
            </>
          ) : (
            <>
              مودهای بیشتر ({EXTRA_COUNT.toLocaleString('fa-IR')})
              <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
