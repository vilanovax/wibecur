'use client';

import {
  moodCardToSelection,
  type MoodExplorerCard,
} from '@/lib/discovery/mood-explorer-config';
import { prefetchGuidedDiscovery } from '@/lib/discovery/guided-client';
import { preloadGuidedDiscoverySheet } from './explore-lazy-sections';
import { Card } from '@/components/ui/card';

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
      className="w-full rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <Card className="flex min-h-32 flex-col bg-popover p-4 lg:min-h-36">
      <span
        className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl"
        aria-hidden
      >
        {card.icon}
      </span>

      <p className="text-balance wibe-small font-semibold text-foreground">
        {card.title}
      </p>
      <p className="relative mt-1 line-clamp-2 text-balance wibe-small text-muted-foreground">
        {card.subtitle}
      </p>
      </Card>
    </button>
  );
}
