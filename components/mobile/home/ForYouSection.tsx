'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';
import {
  useForYouRecommendations,
  getForYouReasonLabel,
} from '@/hooks/useForYouRecommendations';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';

export default function ForYouSection({ embedded = false }: { embedded?: boolean }) {
  const { data: session } = useSession();
  const { lists, isPersonalized, isLoading } = useForYouRecommendations();
  const displayLists = lists.slice(0, 8);

  if (isLoading && displayLists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="space-y-3 px-4 lg:px-0">
          {[1, 2].map((i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-lg bg-gray-100 lg:h-36" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={embedded ? '' : 'mb-6'}>
      {!embedded && (
        <HomeSectionTitle
          icon="✨"
          title="برای تو"
          subtitle={
            isPersonalized
              ? 'بر اساس ذخیره‌ها و علایق تو'
              : 'لیست‌های پیشنهادی برای شروع'
          }
          actionHref="/lists"
          actionLabel="همه"
        />
      )}
      {displayLists.length > 0 ? (
        <>
          <div className="space-y-2 px-4 lg:hidden">
            {displayLists.map((list) => {
              const reason = getForYouReasonLabel(list, isPersonalized);
              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  className="flex min-h-[120px] flex-row-reverse gap-4 overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-gray-200">
                    <ImageWithFallback
                      src={list.coverImage}
                      alt={list.title}
                      className="h-full w-full object-cover"
                      fallbackIcon={list.categories?.icon ?? '📋'}
                      fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200"
                      categorySlug={list.categories?.slug}
                      listSlug={list.slug}
                      listTitle={list.title}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pl-2 pr-3">
                    {reason ? (
                      <p className="mb-1 wibe-caption font-medium text-primary">{reason}</p>
                    ) : null}
                    <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                      {list.title}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1 wibe-caption text-wibe-secondary">
                      <Bookmark className="h-3.5 w-3.5 text-primary" />
                      {list.saveCount.toLocaleString('fa-IR')} ذخیره · {list.itemCount} آیتم
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

      <div
        className={`hidden lg:grid lg:overflow-visible lg:snap-none lg:px-0 ${HOME_FEED_GRID_CLASS}`}
      >
            {displayLists.map((list) => {
              const reason = getForYouReasonLabel(list, isPersonalized);
              return (
                <HomeGridListCard
                  key={list.id}
                  list={list}
                  badge={reason || null}
                  badgeClassName="bg-primary/90 text-white"
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="mx-4 rounded-lg border border-wibe bg-wibe-card py-8 text-center lg:mx-0">
          <p className="wibe-small text-wibe-secondary">
            {session?.user
              ? 'چند لیست ذخیره کن تا پیشنهادات شخصی‌تر ببینی'
              : 'وارد شو تا پیشنهادات شخصی ببینی'}
          </p>
          <Link
            href={session?.user ? '/lists' : '/login?callbackUrl=/'}
            className="mt-2 inline-block wibe-small font-medium text-primary"
          >
            {session?.user ? 'دیدن لیست‌ها' : 'ورود'}
          </Link>
        </div>
      )}
    </section>
  );
}
