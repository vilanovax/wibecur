'use client';

import {
  moodCardToSelection,
  type MoodExplorerCard,
} from '@/lib/discovery/mood-explorer-config';
import { prefetchGuidedDiscovery } from '@/lib/discovery/guided-client';
import { preloadGuidedDiscoverySheet } from './explore-lazy-sections';

type Props = {
  card: MoodExplorerCard;
  onSelect: (card: MoodExplorerCard) => void;
};

function warmMoodOpen(card: MoodExplorerCard) {
  preloadGuidedDiscoverySheet();
  const selection = moodCardToSelection(card);
  // Skip prefetch when a question is still required (bored without timeBudget)
  if (selection.scenario === 'bored' && !selection.preset?.timeBudget) {
    return;
  }
  if (selection.scenario === 'weekend' && !selection.preset?.location) {
    return;
  }
  // going_out («با دوستی؟») always has location=out via preset — prefetch hits guest cache
  prefetchGuidedDiscovery({
    scenario: selection.scenario,
    location: selection.preset?.location,
    timeBudget: selection.preset?.timeBudget,
  });
}

export default function MoodMissionCard({ card, onSelect }: Props) {
  return (
    <button
      type="button"
      onPointerDown={() => warmMoodOpen(card)}
      onClick={() => onSelect(card)}
      className={`group relative flex w-full min-h-[7.5rem] flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 text-right shadow-vibe-sm transition-[colors,transform] hover:-translate-y-0.5 hover:shadow-vibe-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] lg:min-h-[8.5rem] lg:p-4 ${card.gradient}`}
    >
      <span
        className={`relative mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ring-black/[0.04] lg:h-10 lg:w-10 ${card.accent}`}
        aria-hidden
      >
        {card.icon}
      </span>

      <p className="relative wibe-small font-bold text-foreground transition-colors group-hover:text-primary">
        {card.title}
      </p>
      <p className="relative mt-1 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
        {card.subtitle}
      </p>
    </button>
  );
}
