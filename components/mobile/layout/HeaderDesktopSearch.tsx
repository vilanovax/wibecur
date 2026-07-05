'use client';

import { useSearch } from '@/contexts/SearchContext';
import SearchShortcutHint from '@/components/shared/SearchShortcutHint';

/** دکمه جستجو برای هدر دسکتاپ */
export default function HeaderDesktopSearch() {
  const { openSearch } = useSearch();

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      className="flex w-full items-center gap-3 rounded-xl border border-wibe bg-wibe-surface px-4 py-2.5 text-right transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      aria-label="باز کردن جستجو"
    >
      <svg
        className="h-5 w-5 shrink-0 text-wibe-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <span className="flex-1 wibe-small text-wibe-secondary">فیلم، کتاب، کافه، لیست…</span>
      <SearchShortcutHint />
    </button>
  );
}
