'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import HomeSectionTitle from './HomeSectionTitle';
import {
  useForYouRecommendations,
  getForYouReasonLabel,
} from '@/hooks/useForYouRecommendations';

export default function ForYouSection({ embedded = false }: { embedded?: boolean }) {
  const { data: session } = useSession();
  const { lists, isPersonalized, isLoading } = useForYouRecommendations();
  const displayLists = lists.slice(0, 4);

  if (isLoading && displayLists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="space-y-3 px-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-lg bg-gray-100" />
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
      <div className="space-y-2 px-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {displayLists.length > 0 ? (
          displayLists.map((list) => {
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
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pl-2 pr-3">
                  {reason ? (
                    <p className="mb-1 wibe-caption font-medium text-primary">{reason}</p>
                  ) : null}
                  <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
                  <p className="mt-1.5 flex items-center gap-1 wibe-caption text-wibe-secondary">
                    <Bookmark className="h-3.5 w-3.5 text-primary" />
                    {list.saveCount.toLocaleString('fa-IR')} ذخیره · {list.itemCount} آیتم
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-wibe bg-wibe-card py-8 text-center">
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
      </div>
    </section>
  );
}
