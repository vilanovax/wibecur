'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CuratedList } from '@/types/curated';
import { trackMoodExplorerClick } from '@/lib/analytics';
import { getListCardSubtitle } from '@/lib/lists-card-utils';

type Props = {
  lists: CuratedList[];
};

function pickRandom(lists: CuratedList[], excludeId?: string): CuratedList | null {
  const pool = excludeId ? lists.filter((l) => l.id !== excludeId) : lists;
  if (pool.length === 0) return lists[0] ?? null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export default function RandomSurpriseCard({ lists }: Props) {
  const [preview, setPreview] = useState<CuratedList | null>(null);

  const roll = useCallback(() => {
    const pick = pickRandom(lists, preview?.id);
    if (!pick) return;
    trackMoodExplorerClick('surprise', 'surprise', pick.slug);
    setPreview(pick);
  }, [lists, preview?.id]);

  if (lists.length === 0) return null;

  return (
    <section
      className="border-t border-wibe/40 px-2.5 py-3 lg:px-0 lg:py-4"
      aria-labelledby="surprise-title"
    >
      {!preview ? (
        <button
          type="button"
          onClick={roll}
          className="group relative w-full overflow-hidden rounded-2xl border border-wibe bg-wibe-card/80 p-4 text-right transition-colors hover:border-primary/30 hover:bg-primary/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:mx-auto lg:max-w-2xl lg:p-5"
        >
          <div className="relative flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="surprise-title" className="wibe-small font-bold text-foreground lg:wibe-body">
                نمی‌دونی چی می‌خوای؟
              </h2>
              <p className="mt-0.5 wibe-caption text-wibe-secondary">
                یک پیش‌نمایش ببین، بعد تصمیم بگیر
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/90 px-3.5 py-1.5 wibe-caption font-bold text-white">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                سورپرایزم کن
              </span>
            </div>
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wibe-surface text-2xl"
              aria-hidden
            >
              🎲
            </span>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-3 lg:mx-auto lg:max-w-2xl lg:p-4">
          <p id="surprise-title" className="mb-2.5 wibe-caption font-semibold text-primary">
            پیشنهاد سورپرایز
          </p>
          <div className="flex flex-row-reverse gap-3">
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-wibe-surface">
              <ImageWithFallback
                src={preview.coverUrl ?? ''}
                alt={preview.title}
                className="h-full w-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
                width={80}
                height={80}
              />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{preview.title}</h3>
              {getListCardSubtitle(preview) ? (
                <p className="mt-0.5 line-clamp-2 wibe-caption text-wibe-secondary">
                  {getListCardSubtitle(preview)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={roll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-wibe bg-wibe-card px-3 py-2 wibe-caption font-semibold text-foreground transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              یکی دیگه
            </button>
            <Link
              href={`/lists/${preview.slug}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 wibe-caption font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              برو به لیست
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
