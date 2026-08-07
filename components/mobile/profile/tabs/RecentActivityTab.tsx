'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Bookmark, Heart, Flame, FileText, ChevronLeft, RefreshCw } from 'lucide-react';

const VIRAL_LIKE_THRESHOLD = 50;

type ActivityType = 'list_created' | 'bookmark' | 'like' | 'item_like';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  image: string | null;
  slug?: string;
  category: { id: string; name: string; slug: string; icon: string; color?: string } | null;
  createdAt: string;
  likeCount?: number;
  viewCount?: number;
  saveCount?: number;
  itemId?: string;
}

import type { ProfileActivitySSR } from '@/lib/profile-ssr-types';

interface RecentActivityTabProps {
  userId: string;
  /** داخل ProfileActivityPanel — بدون padding اضافه */
  embedded?: boolean;
  initialActivities?: ProfileActivitySSR[];
}

const TYPE_CONFIG: Record<
  ActivityType,
  { tag: string; label: string; icon: typeof FileText; dotClass: string; accentClass: string }
> = {
  list_created: {
    tag: '📝 ایجاد لیست',
    label: 'ایجاد لیست',
    icon: FileText,
    dotClass: 'bg-primary',
    accentClass: 'text-primary',
  },
  bookmark: {
    tag: '🔖 ذخیره شد',
    label: 'ذخیره لیست',
    icon: Bookmark,
    dotClass: 'bg-amber-500',
    accentClass: 'text-amber-600',
  },
  like: {
    tag: '❤️ لایک',
    label: 'لایک',
    icon: Heart,
    dotClass: 'bg-rose-500',
    accentClass: 'text-rose-600',
  },
  item_like: {
    tag: '❤️ لایک آیتم',
    label: 'لایک آیتم',
    icon: Heart,
    dotClass: 'bg-rose-400',
    accentClass: 'text-rose-500',
  },
};

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

async function fetchActivities(): Promise<Activity[]> {
  const res = await fetch('/api/user/activity?type=all&limit=20');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در دریافت فعالیت‌ها');
  }
  return data.data.activities ?? [];
}

export default function RecentActivityTab({
  userId,
  embedded = false,
  initialActivities,
}: RecentActivityTabProps) {
  const hasInitial = Boolean(initialActivities?.length);

  const { data: activities = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId, 'activity'],
    queryFn: fetchActivities,
    staleTime: 30_000,
    initialData: hasInitial ? (initialActivities as Activity[]) : undefined,
  });
  const [showAll, setShowAll] = useState(false);

  if (isLoading && !hasInitial) {
    return (
      <div className={`space-y-3 ${embedded ? 'px-4 lg:px-0' : 'px-4'}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
            <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (isError && activities.length === 0) {
    return (
      <div className={`py-8 ${embedded ? 'px-4 lg:px-0' : 'px-4'}`}>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="wibe-small text-red-600">
            {error instanceof Error ? error.message : 'خطا در بارگذاری فعالیت‌ها'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white wibe-small font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`py-10 text-center ${embedded ? 'px-4 lg:px-0' : 'px-4'}`}>
        <p className="wibe-small text-wibe-secondary">فعالیتی یافت نشد</p>
      </div>
    );
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 8);

  return (
    <div className={`space-y-0 pb-4 ${embedded ? 'px-4 lg:px-0' : 'px-4'}`}>
      <div className="relative pr-5 lg:grid lg:grid-cols-2 lg:gap-4 lg:pr-0 xl:grid-cols-3">
        <div className="absolute top-2 bottom-2 right-[9px] w-px bg-gray-200 lg:hidden" aria-hidden />
        {displayedActivities.map((activity) => {
          const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.list_created;
          const Icon = config.icon;
          const isViral =
            (activity.type === 'list_created' || activity.type === 'bookmark') &&
            (activity.likeCount ?? 0) >= VIRAL_LIKE_THRESHOLD;
          const listHref = activity.slug
            ? `/lists/${activity.slug}`
            : `/lists/${activity.title.replace(/\s+/g, '-').toLowerCase()}`;

          const hasStats =
            (activity.likeCount ?? 0) > 0 ||
            (activity.viewCount ?? 0) > 0 ||
            (activity.saveCount ?? 0) > 0;
          const statsParts: string[] = [];
          if (activity.saveCount != null && activity.saveCount > 0)
            statsParts.push(`${formatStat(activity.saveCount)} ذخیره`);
          if (activity.viewCount != null && activity.viewCount > 0)
            statsParts.push(`👁 ${formatStat(activity.viewCount)}`);
          if (activity.likeCount != null && activity.likeCount > 0)
            statsParts.push(`❤️ ${formatStat(activity.likeCount)}`);
          const statsText = statsParts.join(' • ');
          const saveContext =
            isViral && activity.saveCount != null && activity.saveCount > 0
              ? `${formatStat(activity.saveCount)} نفر این لیست را ذخیره کرده‌اند`
              : null;

          return (
            <div key={activity.id} className="relative pb-4 pl-0 last:pb-0 lg:pb-0">
              <div
                className={`absolute right-0 top-4 z-10 h-2 w-2 rounded-full border-2 border-white shadow-sm lg:hidden ${config.dotClass}`}
                aria-hidden
              />

              <Link
                href={listHref}
                className={`
                  block overflow-hidden rounded-xl transition-colors duration-200
                  active:scale-[0.99] active:shadow
                  ${isViral ? 'p-5 lg:p-4' : 'p-4 lg:p-3'}
                  ${isViral
                    ? 'border bg-white shadow-sm border-orange-200/80 bg-gradient-to-b from-white to-orange-50/30'
                    : 'border border-gray-100 bg-white shadow-sm hover:shadow-md lg:hover:border-primary/15'}
                `}
              >
                {/* Tag pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium
                      ${isViral ? 'bg-orange-100 text-orange-700' : `bg-gray-100 ${config.accentClass}`}
                    `}
                  >
                    {isViral ? (
                      <>
                        <Flame className="w-3 h-3" />
                        وایرال
                      </>
                    ) : (
                      config.tag
                    )}
                  </span>
                </div>

                {/* Title */}
                <p className="text-base font-bold leading-snug text-foreground lg:line-clamp-2 lg:text-sm">
                  «{activity.title}»
                </p>

                {/* Social context / stats */}
                {hasStats && (
                  <div className="mt-3 space-y-0.5">
                    {saveContext && (
                      <p className="text-xs text-wibe-secondary">{saveContext}</p>
                    )}
                    <p className="text-[11px] text-wibe-secondary">{statsText}</p>
                  </div>
                )}

                {/* CTA + time */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-primary font-medium text-sm inline-flex items-center gap-0.5">
                    مشاهده لیست
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </span>
                  <span className="text-[10px] text-wibe-secondary">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: faIR })}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {!showAll && activities.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-wibe-secondary transition-colors hover:bg-gray-50 lg:max-w-xs lg:mx-auto"
        >
          مشاهده بیشتر ({activities.length - 8} مورد دیگر)
        </button>
      )}
    </div>
  );
}
