'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import HomeSectionTitle from './HomeSectionTitle';

async function fetchInteractionCount(): Promise<{ total: number }> {
  const res = await fetch('/api/user/interaction-count');
  const json = await res.json();
  return json?.data ?? { total: 0 };
}

export default function ForYouSection() {
  const { data: session } = useSession();
  const { data: interactionData } = useQuery({
    queryKey: ['user', 'interaction-count'],
    queryFn: fetchInteractionCount,
    staleTime: 2 * 60 * 1000,
    enabled: !!session?.user,
  });
  const { data: homeData, isLoading } = useHomeData();

  const hasEnoughInteractions = (interactionData?.total ?? 0) >= 3;

  if (isLoading && !homeData) {
    return (
      <section className="mb-6">
        <div className="px-4 mb-3">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="mx-4 rounded-lg p-4 bg-primary/5 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg h-28 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const lists = [...(homeData?.recommendations ?? []), ...(homeData?.trending ?? [])]
    .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)
    .slice(0, 2);

  const reasons = hasEnoughInteractions
    ? ['چون فیلم ذخیره کردی…', 'چون به کافه علاقه داری…']
    : ['پیشنهاد بر اساس علایقت', 'شاید دوست داشته باشی'];

  return (
    <section className="mb-6">
      <HomeSectionTitle
        icon="✨"
        title="برای تو"
        subtitle="بر اساس علایق و ذخیره‌های قبلی"
      />
      <div className="mx-4 rounded-lg p-4 bg-wibe-card border border-wibe shadow-sm">
        <div className="space-y-3">
          {lists.length > 0 ? (
            lists.map((list, idx) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="flex flex-row-reverse gap-4 rounded-lg overflow-hidden bg-wibe-surface border border-wibe active:scale-[0.99] transition-transform min-h-[120px]"
              >
                <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden bg-gray-200">
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    fallbackIcon={list.categories?.icon ?? '📋'}
                    fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                    categorySlug={list.categories?.slug}
                    listSlug={list.slug}
                    listTitle={list.title}
                  />
                </div>
                <div className="flex-1 py-3 pr-3 pl-2 min-w-0 flex flex-col justify-center">
                  <p className="wibe-caption text-primary font-medium mb-1">{reasons[idx] ?? ''}</p>
                  <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
                  <p className="wibe-caption text-wibe-secondary mt-1.5 flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 text-primary" />
                    {list.saveCount.toLocaleString('fa-IR')} ذخیره · {list.itemCount} آیتم
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="wibe-small text-wibe-secondary">چند لیست ذخیره کن تا پیشنهادات شخصی ببینی</p>
              <Link href="/lists" className="text-primary wibe-small font-medium mt-2 inline-block">
                دیدن لیست‌ها
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
