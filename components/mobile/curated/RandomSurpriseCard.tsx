'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
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
    <section
      className="px-2.5 py-2 lg:px-0 lg:py-3"
      aria-labelledby="surprise-title"
    >
      <h2 id="surprise-title" className="sr-only">
        کشف تصادفی
      </h2>
      <button
        type="button"
        onClick={handleSurprise}
        className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-gradient-to-l from-primary/[0.06] to-violet-50/50 px-4 py-4 text-right transition-all hover:border-primary/45 hover:shadow-sm active:scale-[0.99] lg:mx-auto lg:max-w-lg"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block wibe-small font-bold text-foreground">سورپرایزم کن</span>
          <span className="mt-0.5 block wibe-caption text-wibe-secondary">
            یه پیشنهاد غیرمنتظره از لیست‌های داغ
          </span>
        </span>
      </button>
    </section>
  );
}
