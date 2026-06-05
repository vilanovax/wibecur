'use client';

import Link from 'next/link';
import { Flame, ChevronLeft } from 'lucide-react';

interface TrendingRow {
  listId: string;
  title: string;
  rank: number;
  score: number;
}

interface PulseLiveTrendingProps {
  lists: TrendingRow[];
  dense?: boolean;
}

export default function PulseLiveTrending({ lists, dense }: PulseLiveTrendingProps) {
  if (lists.length === 0) return null;
  const top = lists.slice(0, dense ? 5 : 8);

  return (
    <section
      className={
        dense
          ? 'rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-2.5 shadow-sm h-full min-h-0 flex flex-col'
          : 'rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-3 shadow-sm'
      }
    >
      <div className="flex items-center justify-between gap-1 mb-1.5 shrink-0">
        <h2 className="text-xs font-semibold text-admin-text-primary flex items-center gap-1">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          ترند الان
        </h2>
        <Link
          href="/admin/pulse?tab=trend"
          className="text-[10px] text-violet-600 hover:underline inline-flex items-center"
        >
          همه
          <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>
      <ul className={dense ? 'space-y-0.5 flex-1 min-h-0 overflow-y-auto' : 'space-y-0.5'}>
        {top.map((t) => (
          <li key={t.listId}>
            <Link
              href={`/admin/lists/${t.listId}/edit`}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-admin-muted dark:hover:bg-gray-700/40 transition-colors group"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-100 dark:bg-violet-500/25 text-[10px] font-bold text-violet-700">
                {t.rank}
              </span>
              <span className="flex-1 truncate text-xs font-medium text-admin-text-primary">
                {t.title}
              </span>
              <span className="text-[9px] tabular-nums text-admin-text-tertiary shrink-0">
                {t.score.toLocaleString('fa-IR')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
