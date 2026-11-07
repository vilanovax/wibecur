'use client';

import {
  moodCardToSelection,
  type MoodExplorerCard,
} from '@/lib/discovery/mood-explorer-config';
import { prefetchGuidedDiscovery } from '@/lib/discovery/guided-client';
import { preloadGuidedDiscoverySheet } from './explore-lazy-sections';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
      className="group w-full rounded-xl text-start transition-transform duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <Card
        className={cn(
          'flex min-h-36 flex-col justify-between overflow-hidden bg-linear-to-bl p-4 shadow-none lg:min-h-40 lg:p-5',
          'lg:transition-shadow lg:duration-200 lg:group-hover:shadow-sm',
          card.gradient
        )}
      >
        <span
          className={cn(
            'mb-3 flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl',
            'lg:transition-transform lg:duration-200 lg:group-hover:scale-105',
            'motion-reduce:lg:group-hover:scale-100',
            card.accent
          )}
          aria-hidden
        >
          {card.icon}
        </span>

        <div className="min-w-0">
          <p className="text-balance wibe-small font-semibold leading-snug text-foreground">
            {card.title}
          </p>
          <p className="mt-1 line-clamp-2 text-pretty wibe-caption leading-relaxed text-muted-foreground">
            {card.subtitle}
          </p>
        </div>
      </Card>
    </button>
  );
}
