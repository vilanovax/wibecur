'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CuratedList } from '@/types/curated';
import { trackMoodExplorerClick } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      className="border-t border-border px-3 py-3 lg:px-0"
      aria-labelledby="surprise-title"
    >
      {!preview ? (
        <button
          type="button"
          onClick={roll}
          className="flex h-auto w-full items-center gap-3 rounded-surface border border-border bg-popover px-4 py-3 text-start transition-colors hover:border-brand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:mx-auto lg:max-w-xl"
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl"
            aria-hidden
          >
            🎲
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="surprise-title" className="wibe-small font-bold text-foreground">
              نمی‌دونی چی می‌خوای؟
            </h2>
            <p className="mt-0.5 wibe-caption text-muted-foreground">یک پیش‌نمایش ببین</p>
          </div>
          <span className="inline-flex h-11 shrink-0 items-center gap-1 rounded-control bg-brand px-3 text-xs font-bold text-brand-foreground">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            سورپرایز
          </span>
        </button>
      ) : (
        <Card className="border-brand/30 bg-brand/5 p-3 lg:mx-auto lg:max-w-xl">
          <p id="surprise-title" className="mb-2 text-xs font-semibold text-brand">
            پیشنهاد سورپرایز
          </p>
          <div className="flex gap-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <ImageWithFallback
                src={preview.coverUrl ?? ''}
                alt={preview.title}
                className="h-full w-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-lg"
                width={64}
                height={64}
                categorySlug={preview.category?.slug}
                listSlug={preview.slug}
                listTitle={preview.title}
              />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{preview.title}</h3>
              {getListCardSubtitle(preview) ? (
                <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">
                  {getListCardSubtitle(preview)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-start gap-2">
            <Button type="button" variant="outline" size="lg" onClick={roll}>
              <RefreshCw aria-hidden />
              یکی دیگه
            </Button>
            <Link
              href={`/lists/${preview.slug}`}
              className="inline-flex h-12 items-center gap-1 rounded-control bg-brand px-4 text-sm font-semibold text-brand-foreground"
            >
              برو به لیست
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
