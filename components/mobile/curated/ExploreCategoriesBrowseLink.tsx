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
      className="border-t border-wibe/40 px-2.5 py-2.5 lg:px-0 lg:py-3"
      aria-label="مرور دسته‌ها"
    >
      <Link
        href="/lists"
        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 wibe-caption font-medium text-wibe-secondary transition-colors hover:bg-wibe-card hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:inline-flex lg:w-auto lg:px-4"
      >
        <FolderOpen className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
        مرور دسته‌ها در لیست‌ها
      </Link>
    </section>
  );
}
