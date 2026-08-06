'use client';

import Link from 'next/link';
import { Bookmark, Sparkles, Pin } from 'lucide-react';
import type { HomeListData } from '@/types/home-data';
import HomeGridListCard from './HomeGridListCard';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';
import { ACTIVATION } from '@/lib/activation-copy';

type Props = {
  lists: HomeListData[];
  isGuest: boolean;
  variant?: 'foryou' | 'saved';
};

export default function HomeStarterEmptyPanel({
  lists,
  isGuest,
  variant = 'foryou',
}: Props) {
  const preview = lists.slice(0, 4);
  const forYou = ACTIVATION.forYouEmpty;
  const saved = ACTIVATION.savedEmpty;

  const copy =
    variant === 'saved'
      ? {
          Icon: Pin,
          title: saved.title,
          description: saved.description,
          primary: saved.primary,
          primaryHref: saved.primaryHref,
          secondary: isGuest ? saved.guestSecondary : saved.userSecondary,
        }
      : {
          Icon: Sparkles,
          title: isGuest ? forYou.guestTitle : forYou.userTitle,
          description: isGuest ? forYou.guestDescription : forYou.userDescription,
          primary: forYou.primary,
          primaryHref: forYou.primaryHref,
          secondary: isGuest ? forYou.guestSecondary : forYou.userSecondary,
        };

  const Icon = copy.Icon;

  return (
    <div className="mx-4 rounded-2xl border border-dashed border-wibe bg-wibe-card/80 p-4 lg:mx-0 lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-balance wibe-h3 text-foreground">{copy.title}</h3>
          <p className="mt-1.5 text-pretty wibe-small leading-relaxed text-wibe-secondary">
            {copy.description}
          </p>
        </div>
      </div>

      {preview.length > 0 ? (
        <div
          className={`mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:overflow-visible lg:snap-none ${HOME_FEED_GRID_CLASS}`}
        >
          {preview.map((list) => (
            <HomeGridListCard
              key={list.id}
              list={list}
              badge="پیشنهاد شروع"
              badgeClassName="bg-primary/90 text-white"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={copy.primaryHref}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {copy.primary}
        </Link>
        {isGuest ? (
          <Link
            href="/login?callbackUrl=%2F&source=home_empty"
            className="inline-flex items-center rounded-xl border border-wibe bg-wibe-card px-4 py-2.5 wibe-small font-medium text-foreground transition-colors hover:border-primary/30"
          >
            {copy.secondary}
          </Link>
        ) : (
          <button
            type="button"
            onClick={openHomeCreateSheet}
            className="inline-flex items-center rounded-xl border border-wibe bg-wibe-card px-4 py-2.5 wibe-small font-medium text-foreground transition-colors hover:border-primary/30"
          >
            {copy.secondary}
          </button>
        )}
      </div>

      {variant === 'saved' ? (
        <p className="mt-3 flex items-center gap-1 wibe-caption text-wibe-secondary">
          <Bookmark className="h-3.5 w-3.5 text-primary" aria-hidden />
          {saved.footer}
        </p>
      ) : null}
    </div>
  );
}
