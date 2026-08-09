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
