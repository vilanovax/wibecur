'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft } from 'lucide-react';
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
    <section className="px-2.5 py-3 lg:px-0 lg:py-4" aria-labelledby="surprise-title">
      <button
        type="button"
        onClick={handleSurprise}
        className="group relative w-full overflow-hidden rounded-3xl border-2 border-primary/25 bg-gradient-to-bl from-violet-100/90 via-primary/[0.08] to-amber-50/80 p-5 text-right shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99] lg:mx-auto lg:max-w-2xl lg:p-7"
      >
        <span
          className="pointer-events-none absolute -left-4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-6 -right-4 text-[7rem] opacity-[0.07] select-none"
          aria-hidden
        >
          ✨
        </span>

        <div className="relative flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 id="surprise-title" className="wibe-h3 font-bold text-foreground lg:text-xl">
              نمی‌دونی چی می‌خوای؟
            </h2>
            <p className="mt-1.5 wibe-body text-wibe-secondary lg:mt-2">
              بذار Wibe یه چیز خوب پیشنهاد بده
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 wibe-small font-bold text-white shadow-sm transition-transform group-hover:scale-[1.02]">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              سورپرایزم کن
              <ArrowLeft className="h-4 w-4 rotate-180" strokeWidth={2.5} />
            </span>
          </div>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-3xl shadow-sm backdrop-blur-sm lg:h-[4.5rem] lg:w-[4.5rem] lg:text-4xl">
            🎲
          </span>
        </div>
      </button>
    </section>
  );
}
