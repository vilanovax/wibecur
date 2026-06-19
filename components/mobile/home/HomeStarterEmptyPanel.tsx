'use client';

import Link from 'next/link';
import { Bookmark, Sparkles } from 'lucide-react';
import type { HomeListData } from '@/types/home-data';
import HomeGridListCard from './HomeGridListCard';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';

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

  const copy =
    variant === 'saved'
      ? {
          icon: '📌',
          title: 'هنوز چیزی ذخیره نکردی',
          description: 'از همین لیست‌های محبوب شروع کن — با یک ذخیره، فیدت شخصی‌تر می‌شود.',
          primary: 'دیدن لیست‌های ترند',
          primaryHref: '/lists?mode=trending',
          secondary: isGuest ? 'ورود برای ذخیره' : 'اولین لیستت را بساز',
        }
      : {
          icon: '✨',
          title: isGuest ? 'برای شروع کاوش کن' : 'چند لیست انتخاب کن',
          description: isGuest
            ? 'لیست‌های کیوریتد را ببین و بعد از ورود، ذخیره کن تا پیشنهاد شخصی بگیری.'
            : 'چند لیست ذخیره کن تا پیشنهادات دقیق‌تر بر اساس سلیقه‌ات ببینی.',
          primary: 'مشاهده همه لیست‌ها',
          primaryHref: '/lists',
          secondary: isGuest ? 'ورود' : 'ساخت اولین لیست',
        };

  return (
    <div className="mx-4 rounded-2xl border border-wibe bg-wibe-card p-4 lg:mx-0 lg:p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {copy.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="wibe-body font-semibold text-foreground">{copy.title}</h3>
          <p className="mt-1 wibe-small leading-relaxed text-wibe-secondary">{copy.description}</p>
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 wibe-small font-semibold text-white hover:bg-primary-dark"
        >
          <Sparkles className="h-4 w-4" />
          {copy.primary}
        </Link>
        {isGuest ? (
          <Link
            href="/login?callbackUrl=%2F&source=home_empty"
            className="inline-flex items-center rounded-lg border border-wibe px-4 py-2 wibe-small font-medium text-foreground hover:border-primary/30"
          >
            {copy.secondary}
          </Link>
        ) : (
          <button
            type="button"
            onClick={openHomeCreateSheet}
            className="inline-flex items-center rounded-lg border border-wibe px-4 py-2 wibe-small font-medium text-foreground hover:border-primary/30"
          >
            {copy.secondary}
          </button>
        )}
      </div>

      {variant === 'saved' ? (
        <p className="mt-3 flex items-center gap-1 wibe-caption text-wibe-secondary">
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          ذخیره‌ها در پروفایلت هم قابل دسترسی‌اند
        </p>
      ) : null}
    </div>
  );
}
