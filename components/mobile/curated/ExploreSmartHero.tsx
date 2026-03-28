'use client';

import { useRef } from 'react';

interface ExploreSmartHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function ExploreSmartHero({
  searchQuery,
  onSearchChange,
}: ExploreSmartHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="px-4 pt-2 pb-4 bg-white border-b border-gray-100"
      aria-label="جستجوی اکسپلور"
    >
      <h2 className="text-[18px] font-bold text-gray-900 mb-2">
        امروز چی کشف می‌کنی؟
      </h2>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="فیلم آرامش‌بخش؟ کافه دنج؟ سریال دهه ۹۰؟"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-10 rounded-[18px] bg-gray-50 border border-gray-200 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          aria-label="جستجوی اکسپلور"
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg cursor-pointer"
          onClick={() => inputRef.current?.focus()}
          aria-hidden
        >
          🔍
        </span>
      </div>
    </section>
  );
}
