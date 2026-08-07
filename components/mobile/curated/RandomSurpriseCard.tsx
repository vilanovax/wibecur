'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, ChevronLeft } from 'lucide-react';
import type { CuratedList } from '@/types/curated';
import { trackMoodExplorerClick } from '@/lib/analytics';

type Props = {
  lists: CuratedList[];
};

export default function RandomSurpriseCard({ lists }: Props) {
  const router = useRouter();

  if (lists.length === 0) return null;

  const handleSurprise = () => {
    const pick = lists[Math.floor(Math.random() * lists.length)];
    trackMoodExplorerClick('surprise', 'surprise', pick.slug);
    router.push(`/lists/${pick.slug}`);
  };

  return (
    <section className="px-3.5 py-2 lg:px-0 lg:py-3" aria-labelledby="surprise-title">
      <button
        type="button"
        onClick={handleSurprise}
        className="group relative w-full overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/[0.08] via-wibe-card to-amber-50/60 p-4 text-right shadow-sm transition-colors hover:border-primary/35 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:mx-auto lg:max-w-2xl lg:p-6"
      >
        <div className="relative flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-wibe-card text-3xl shadow-sm ring-1 ring-wibe/80 lg:h-16 lg:w-16 lg:text-4xl">
            🎲
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="surprise-title" className="wibe-h3 font-bold text-foreground">
              نمی‌دونی چی می‌خوای؟
            </h2>
            <p className="mt-1 wibe-caption text-wibe-secondary lg:wibe-small">
              بذار Wibe یه چیز خوب پیشنهاد بده
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 wibe-caption font-bold text-white shadow-sm transition-transform group-hover:scale-[1.02] lg:wibe-small">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              سورپرایزم کن
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
