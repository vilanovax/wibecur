'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { PLACEHOLDER_COVER_SMALL } from '@/lib/placeholder-images';

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
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        </div>
        <div className="mx-4 rounded-2xl p-4 bg-primary/5 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl h-28 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const lists = [...(homeData?.recommendations ?? []), ...(homeData?.trending ?? [])]
    .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)
    .slice(0, 2)
    .map((l) => ({ ...l, coverImage: l.coverImage || PLACEHOLDER_COVER_SMALL }));

  const reasons = hasEnoughInteractions
    ? ['چون فیلم ذخیره کردی…', 'چون به کافه علاقه داری…']
    : ['پیشنهاد بر اساس علایقت', 'شاید دوست داشته باشی'];

  return (
    <section className="mb-6">
      <div className="px-4 mb-3">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-gray-900 flex items-center gap-2">
          <span>✨</span>
          برای تو
        </h2>
        <p className="text-[13px] text-gray-500/80 leading-[1.6] mt-0.5">بر اساس علایق و ذخیره‌های قبلی</p>
      </div>
      <div className="mx-4 rounded-2xl p-4 bg-gradient-to-b from-primary/5 to-primary/[0.02] border border-primary/10">
        <div className="space-y-4">
          {lists.length > 0 ? (
            lists.map((list, idx) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="flex flex-row-reverse gap-4 rounded-[18px] overflow-hidden bg-white border border-gray-100 shadow-vibe-card hover:shadow-vibe-card active:scale-[0.99] transition-all p-0 min-h-[140px]"
              >
                <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    fallbackIcon="📋"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                  />
                </div>
                <div className="flex-1 py-4 pr-4 pl-0 min-w-0 flex flex-col justify-center">
                  <p className="text-[13px] text-primary/80 font-medium mb-1 leading-[1.6]">{reasons[idx] ?? ''}</p>
                  <h3 className="font-semibold text-[15px] leading-[1.4] text-gray-900 line-clamp-2">{list.title}</h3>
                  <p className="text-[13px] text-gray-500/80 mt-1 line-clamp-1 leading-[1.6]">{list.description}</p>
                  <p className="text-[12px] font-medium text-gray-500/75 mt-1.5">{list.itemCount} آیتم · ⭐ {list.saveCount}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">چند لیست ذخیره کن تا پیشنهادات شخصی ببینی</p>
              <Link href="/lists" className="text-primary text-sm font-medium mt-2 inline-block">
                دیدن لیست‌ها
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
