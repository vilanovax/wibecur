'use client';

import Link from 'next/link';
import { FolderOpen } from 'lucide-react';

/**
 * لینک آرام به کاتالوگ دسته‌ها در لیست‌ها — جایگزین گرید «بر اساس موضوع».
 * کاتالوگ دسته‌ها متعلق به /lists است؛ اکسپلور mood-first می‌ماند.
 */
export default function ExploreCategoriesBrowseLink() {
  return (
    <section
      id="categories"
      className="border-t border-border px-3 py-3 lg:px-0"
      aria-label="مرور دسته‌ها"
    >
      <Link
        href="/lists"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:w-auto"
      >
        <FolderOpen className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
        مرور دسته‌ها در لیست‌ها
      </Link>
    </section>
  );
}
