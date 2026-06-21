'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  MOBILE_FEATURED_MOOD_IDS,
  MOOD_EXPLORER_CARDS,
  type MoodExplorerCard,
} from '@/lib/discovery/mood-explorer-config';
import MoodMissionCard from './MoodMissionCard';

type Props = {
  onMoodSelect: (card: MoodExplorerCard) => void;
  disabled?: boolean;
};

const FEATURED_SET = new Set<string>(MOBILE_FEATURED_MOOD_IDS);
const EXTRA_MOBILE_COUNT = MOOD_EXPLORER_CARDS.length - MOBILE_FEATURED_MOOD_IDS.length;

export default function MoodExplorerHero({ onMoodSelect, disabled = false }: Props) {
  const [showAllMobile, setShowAllMobile] = useState(false);

  return (
    <div className="mb-1">
      <h2 className="mb-3 wibe-h3 lg:mb-4">امروز دنبال چه وایبی هستی؟</h2>
      <div
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3"
        aria-label="کارت‌های حال و موقعیت"
      >
        {MOOD_EXPLORER_CARDS.map((card) => {
          const hiddenOnMobile = !showAllMobile && !FEATURED_SET.has(card.id);
          return (
            <div
              key={card.id}
              className={`${hiddenOnMobile ? 'hidden lg:block' : ''} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
            >
              <MoodMissionCard card={card} onSelect={onMoodSelect} />
            </div>
          );
        })}
      </div>

      {!showAllMobile && EXTRA_MOBILE_COUNT > 0 && (
        <button
          type="button"
          onClick={() => setShowAllMobile(true)}
          className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl border border-wibe bg-wibe-card py-2.5 wibe-caption font-semibold text-primary transition-colors active:scale-[0.99] hover:bg-primary/5 lg:hidden"
        >
          مودهای بیشتر ({EXTRA_MOBILE_COUNT.toLocaleString('fa-IR')})
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
