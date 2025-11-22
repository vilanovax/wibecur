'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

const popularSearches = [
  { id: '1', label: '🎬 فیلم عاشقانه', query: 'فیلم عاشقانه' },
  { id: '2', label: '☕ کافه دنج', query: 'کافه دنج' },
  { id: '3', label: '📚 کتاب خواب‌آور', query: 'کتاب خواب' },
];

export default function EnhancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="px-4 mb-6">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="دنبال چی میگردی؟ فیلم، کافه، کتاب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-12 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200"
        />
        <button className="absolute left-3 top-1/2 -translate-y-1/2 hover:bg-gray-200 rounded-lg p-1.5 transition-colors">
          <SlidersHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Popular searches */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
        {popularSearches.map((search) => (
          <button
            key={search.id}
            onClick={() => setSearchQuery(search.query)}
            className="flex-shrink-0 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors whitespace-nowrap"
          >
            {search.label}
          </button>
        ))}
      </div>
    </div>
  );
}

