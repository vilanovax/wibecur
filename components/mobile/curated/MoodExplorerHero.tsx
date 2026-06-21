'use client';

import {
  MOOD_EXPLORER_CARDS,
  type MoodExplorerCard,
} from '@/lib/discovery/mood-explorer-config';
import MoodMissionCard from './MoodMissionCard';

type Props = {
  onMoodSelect: (card: MoodExplorerCard) => void;
  disabled?: boolean;
};

export default function MoodExplorerHero({ onMoodSelect, disabled = false }: Props) {
  return (
    <div className="mb-1">
      <h2 className="mb-3 wibe-h3 lg:mb-4">امروز دنبال چه وایبی هستی؟</h2>
      <div
        className="scrollbar-hide -mx-2.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-2.5 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:snap-none lg:px-0 xl:grid-cols-3"
        aria-label="کارت‌های حال و موقعیت"
      >
        {MOOD_EXPLORER_CARDS.map((card) => (
          <div key={card.id} className={disabled ? 'pointer-events-none opacity-50' : undefined}>
            <MoodMissionCard card={card} onSelect={onMoodSelect} />
          </div>
        ))}
      </div>
    </div>
  );
}
