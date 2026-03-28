'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomeSearchBar() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0];

  const greeting = firstName
    ? `سلام ${firstName} 👋`
    : 'به وایب خوش اومدی 👋';

  return (
    <div className="px-4 pb-2 pt-1">
      <p className="text-[15px] font-semibold text-gray-800 mb-1 leading-[1.6]">{greeting}</p>
      <Link href="/lists" className="block">
        <div className="relative flex items-center gap-3 w-full pr-4 pl-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden />
          <span className="text-gray-500/80 text-[13px] flex-1 text-right leading-[1.6]">
            امروز دنبال چی هستی؟ فیلم، کتاب، کافه…
          </span>
        </div>
      </Link>
    </div>
  );
}
