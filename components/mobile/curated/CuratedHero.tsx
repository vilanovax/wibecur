'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function CuratedHero() {
  return (
    <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-wibe-card to-amber-50/50 p-5 shadow-vibe-sm">
      <div
        className="pointer-events-none absolute -left-8 top-0 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="mb-1 inline-flex items-center gap-1.5 wibe-caption font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          کیوریشن وایب
        </p>
        <h2 className="wibe-h3 text-foreground">لیست‌هایی با سلیقه و تخصص</h2>
        <p className="mt-1 wibe-small leading-relaxed text-wibe-secondary">
          از کیوریتورها یاد بگیر یا لیست حرفه‌ای خودت را بساز
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <Link
            href="/explore?openCreate=1"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            ساخت لیست حرفه‌ای
          </Link>
          <Link
            href="/curated/guide"
            className="inline-flex items-center justify-center rounded-xl border border-wibe bg-wibe-card/90 px-5 py-2.5 wibe-small font-medium text-foreground transition-colors hover:border-primary/30"
          >
            چگونه کیوریتور شویم؟
          </Link>
        </div>
      </div>
    </div>
  );
}
