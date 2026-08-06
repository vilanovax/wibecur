'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { track } from '@/lib/analytics';

const vibeChips = [
  { id: '1', label: '😴 قبل خواب', query: 'قبل خواب' },
  { id: '2', label: '🎬 فیلم', query: 'فیلم' },
  { id: '3', label: '☕ کافه دنج', query: 'کافه دنج' },
  { id: '4', label: '🎧 تمرکز', query: 'تمرکز' },
];

export default function EnhancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="px-4 mb-6">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="فیلم برای آخر شب، کافه دنج، کتاب قبل خواب…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              track('search', { query: searchQuery.trim(), source: 'input' });
            }
          }}
          className="w-full pr-11 pl-4 py-3 bg-gray-100 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-primary focus:bg-white transition-colors duration-200"
          aria-label="جستجوی لیست‌ها"
        />
      </div>
      <p className="text-gray-400 text-xs mt-1.5 px-0.5">
        هرچی حالتو توصیف می‌کنه بنویس
      </p>

      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
        {vibeChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => {
              setSearchQuery(chip.query);
              track('search', { query: chip.query, source: 'chip' });
            }}
            className="flex-shrink-0 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors whitespace-nowrap"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

