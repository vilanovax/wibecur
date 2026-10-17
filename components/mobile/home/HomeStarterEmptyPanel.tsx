'use client';

import Link from 'next/link';
import { Bookmark, Sparkles, Pin } from 'lucide-react';
import type { HomeListData } from '@/types/home-data';
import HomeGridListCard from './HomeGridListCard';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';
import { ACTIVATION } from '@/lib/activation-copy';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <Card className="mx-4 border-dashed bg-popover p-4 lg:mx-0 lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-balance wibe-h3 text-foreground">{copy.title}</h3>
          <p className="mt-1.5 text-pretty wibe-small leading-relaxed text-muted-foreground">
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
              badgeClassName="bg-brand text-brand-foreground"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={copy.primaryHref}
          className="inline-flex h-12 items-center gap-1.5 rounded-control bg-brand px-4 text-sm font-semibold text-brand-foreground"
        >
          <Sparkles className="size-4" aria-hidden />
          {copy.primary}
        </Link>
        {isGuest ? (
          <Link
            href="/login?callbackUrl=%2F&source=home_empty"
            className="inline-flex h-12 items-center rounded-control border border-border bg-popover px-4 text-sm font-medium text-foreground"
          >
            {copy.secondary}
          </Link>
        ) : (
          <Button type="button" variant="outline" size="lg" onClick={openHomeCreateSheet}>
            {copy.secondary}
          </Button>
        )}
      </div>

      {variant === 'saved' ? (
        <p className="mt-3 flex items-center gap-1 wibe-caption text-muted-foreground">
          <Bookmark className="size-4 text-brand" aria-hidden />
          {saved.footer}
        </p>
      ) : null}
    </Card>
  );
}
