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
    <div className="mb-0.5">
      <header className="mb-4 lg:mb-5">
        <p className="mb-1.5 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 wibe-caption font-semibold text-primary">
          اکسپلور
        </p>
        <h2 className="text-balance text-h1 font-bold tracking-tight text-foreground lg:text-3xl">
          امروز دنبال چه وایبی هستی؟
        </h2>
        <p className="mt-1.5 max-w-md text-pretty wibe-small text-wibe-secondary lg:mt-2 lg:text-base">
          یک حال‌وهوا انتخاب کن؛ بقیه‌اش را ما جور می‌کنیم
        </p>
      </header>

      <div
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3.5"
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
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-full border border-wibe bg-wibe-card py-3 wibe-caption font-semibold text-primary transition-colors hover:border-primary/30 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:hidden"
        >
          مودهای بیشتر ({EXTRA_MOBILE_COUNT.toLocaleString('fa-IR')})
          <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}
