'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';

export default function HomeSearchBar() {
  return (
    <div className="px-4 pb-2 pt-1">
      <Link href="/lists" className="block">
        <p className="text-[14px] font-medium text-gray-700 mb-1.5 leading-[1.6]">امروز دنبال چی هستی؟</p>
        <div className="relative flex items-center gap-3 w-full pr-4 pl-4 py-3 bg-gray-100 rounded-2xl border-0 focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden />
          <span className="text-gray-500/80 text-[13px] flex-1 text-right leading-[1.6]">
            فیلم، کتاب، کافه، لیست خاص…
          </span>
        </div>
      </Link>
    </div>
  );
}
