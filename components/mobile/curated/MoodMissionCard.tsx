'use client';

import { ChevronLeft } from 'lucide-react';
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
      className={`group relative flex w-full min-h-[8.5rem] flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 text-right shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] lg:min-h-[10rem] lg:p-5 ${card.gradient}`}
    >
      <span
        className="pointer-events-none absolute -bottom-1 -start-1 select-none text-6xl leading-none opacity-[0.1] transition-transform duration-300 group-hover:scale-105"
        aria-hidden
      >
        {card.icon}
      </span>
      <span
        className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl"
        aria-hidden
      />

      <span
        className={`relative mb-2.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm ring-1 ring-black/[0.04] lg:mb-3 lg:h-12 lg:w-12 lg:rounded-2xl lg:text-3xl ${card.accent}`}
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
      <span className="relative mt-auto inline-flex items-center gap-0.5 pt-2.5 wibe-caption font-semibold text-primary lg:pt-3.5">
        ببین چی داریم
        <ChevronLeft
          className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
      </span>
    </button>
  );
}
