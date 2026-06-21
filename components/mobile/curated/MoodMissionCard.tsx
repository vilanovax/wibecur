'use client';

import type { MoodExplorerCard } from '@/lib/discovery/mood-explorer-config';

type Props = {
  card: MoodExplorerCard;
  onSelect: (card: MoodExplorerCard) => void;
};

export default function MoodMissionCard({ card, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      className={`group flex w-[11.5rem] shrink-0 snap-start flex-col rounded-2xl border bg-gradient-to-br p-4 text-right shadow-sm transition-all hover:shadow-md active:scale-[0.98] lg:w-full lg:min-h-[8.5rem] ${card.gradient}`}
    >
      <span className="mb-2 text-2xl" aria-hidden>
        {card.icon}
      </span>
      <p className="wibe-small font-bold text-foreground group-hover:text-primary">{card.title}</p>
      <p className="mt-1 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
        {card.subtitle}
      </p>
    </button>
  );
}
