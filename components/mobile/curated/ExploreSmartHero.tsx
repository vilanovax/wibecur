'use client';

import { useRef } from 'react';
import { Search } from 'lucide-react';

const EXPLORE_MODES = [
  { id: 'trending', label: 'ترند', icon: '🔥' },
  { id: 'foryou', label: 'برای تو', icon: '🎯' },
  { id: 'elite', label: 'الیت', icon: '🏆' },
  { id: 'rising', label: 'در حال رشد', icon: '🌱' },
  { id: 'categories', label: 'دسته‌ها', icon: '🗂' },
] as const;

interface ExploreSmartHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onModeScroll: (id: string) => void;
}

export default function ExploreSmartHero({
  searchQuery,
  onSearchChange,
  onModeScroll,
}: ExploreSmartHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="px-4 pt-2 pb-4 bg-wibe-surface border-b border-wibe"
      style={{ maxHeight: 180 }}
      aria-label="اکسپلور هوشمند"
    >
      <h2 className="wibe-h3 mb-2">امروز چی کشف می‌کنی؟</h2>
      <div className="relative mb-3">
        <input
          ref={inputRef}
          type="search"
          placeholder="فیلم آرامش‌بخش؟ کافه دنج؟ سریال دهه ۹۰؟"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 rounded-lg bg-wibe-card border border-wibe wibe-small placeholder:text-wibe-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          aria-label="جستجوی اکسپلور"
        />
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wibe-secondary pointer-events-none"
          aria-hidden
        />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {EXPLORE_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeScroll(m.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg wibe-small font-medium whitespace-nowrap bg-wibe-card text-wibe-secondary border border-wibe hover:border-primary/30 transition-colors flex-shrink-0"
            aria-label={`اسکرول به ${m.label}`}
          >
            <span aria-hidden>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
    </section>
  );
}
