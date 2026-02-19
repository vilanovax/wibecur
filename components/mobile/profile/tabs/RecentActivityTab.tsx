'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Bookmark, Heart, Flame, FileText, ChevronLeft } from 'lucide-react';

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

interface RecentActivityTabProps {
  userId: string;
}

const TYPE_CONFIG: Record<
  ActivityType,
  { tag: string; label: string; icon: typeof FileText; dotClass: string; accentClass: string }
> = {
  list_created: {
    tag: '📝 ایجاد لیست',
    label: 'ایجاد لیست',
    icon: FileText,
    dotClass: 'bg-[#7C3AED]',
    accentClass: 'text-[#7C3AED]',
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
  return data.success ? (data.data.activities ?? []) : [];
}

export default function RecentActivityTab({ userId }: RecentActivityTabProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['user', userId, 'activity'],
    queryFn: fetchActivities,
  });
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3 px-4">
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

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-500 text-sm">فعالیتی یافت نشد</p>
      </div>
    );
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 8);

  return (
    <div className="space-y-0 px-4 pb-4">
      <div className="relative pr-5">
        <div className="absolute top-2 bottom-2 right-[9px] w-px bg-gray-200" />
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
            <div key={activity.id} className="relative pl-0 pb-4 last:pb-0">
              <div
                className={`absolute right-0 top-4 w-2 h-2 rounded-full border-2 border-white shadow-sm z-10 ${config.dotClass}`}
                aria-hidden
              />

              <Link
                href={listHref}
                className={`
                  block rounded-xl overflow-hidden transition-all duration-200
                  active:scale-[0.99] active:shadow
                  ${isViral ? 'p-5' : 'p-4'}
                  ${isViral
                    ? 'border bg-white shadow-sm border-orange-200/80 bg-gradient-to-b from-white to-orange-50/30'
                    : 'border border-gray-100 bg-white shadow-sm hover:shadow-md'}
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
                <p className="text-gray-900 font-bold text-base leading-snug">
                  «{activity.title}»
                </p>

                {/* Social context / stats */}
                {hasStats && (
                  <div className="mt-3 space-y-0.5">
                    {saveContext && (
                      <p className="text-xs text-gray-600">{saveContext}</p>
                    )}
                    <p className="text-[11px] text-gray-500">{statsText}</p>
                  </div>
                )}

                {/* CTA + time */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-primary font-medium text-sm inline-flex items-center gap-0.5">
                    مشاهده لیست
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </span>
                  <span className="text-[10px] text-gray-400">
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
          className="w-full py-3 mt-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          مشاهده بیشتر ({activities.length - 8} مورد دیگر)
        </button>
      )}
    </div>
  );
}
