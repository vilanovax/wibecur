'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';

export default function HomeSearchBar() {
  return (
    <div className="px-4 pb-2 pt-1">
      <Link href="/lists" className="block">
        <p className="wibe-small text-wibe-secondary mb-1.5">امروز دنبال چی هستی؟</p>
        <div className="relative flex items-center gap-3 w-full px-4 py-3 bg-wibe-card rounded-lg border border-wibe focus-within:ring-2 focus-within:ring-primary/30 shadow-sm">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden />
          <span className="wibe-small text-wibe-secondary flex-1 text-right">
            فیلم، کتاب، کافه، لیست خاص…
          </span>
        </div>
      </Link>
    </div>
  );
}
