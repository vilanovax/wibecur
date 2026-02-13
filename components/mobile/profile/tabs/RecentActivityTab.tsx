'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { categories } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'list_created' | 'bookmark' | 'like';
  title: string;
  description: string;
  image: string | null;
  slug?: string;
  category: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null;
  createdAt: string;
}

interface RecentActivityTabProps {
  userId: string;
}

export default function RecentActivityTab({ userId }: RecentActivityTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/activity?type=all&limit=20');
      const data = await response.json();

      if (data.success) {
        setActivities(data.data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'list_created':
        return '✨';
      case 'bookmark':
        return '⭐';
      case 'like':
        return '❤️';
      default:
        return '📝';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'list_created':
        return 'ایجاد شد';
      case 'bookmark':
        return 'ذخیره شد';
      case 'like':
        return 'لایک شد';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[20px] p-4 animate-pulse shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
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
    <div className="space-y-3 px-4">
      <div className="relative pr-4 border-r-2 border-gray-100 border-dashed">
        {displayedActivities.map((activity, index) => (
          <div key={activity.id} className="relative pl-6 pb-5 last:pb-0">
            <div className="absolute right-[-17px] top-1.5 w-3 h-3 rounded-full bg-[#7C3AED]/60 border-2 border-white shadow-sm" />
            <Link
              href={
                activity.slug
                  ? `/lists/${activity.slug}`
                  : `/lists/${activity.title.replace(/\s+/g, '-').toLowerCase()}`
              }
              className="block bg-white rounded-[20px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-gray-100"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{getActivityIcon(activity.type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-gray-900 font-medium text-sm leading-snug">
                    {activity.type === 'list_created' && <>لیست «{activity.title}» ایجاد شد</>}
                    {activity.type === 'bookmark' && <>لیست «{activity.title}» ذخیره شد</>}
                    {activity.type === 'like' && <>لیست «{activity.title}» لایک شد</>}
                    {!['list_created', 'bookmark', 'like'].includes(activity.type) && activity.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      {!showAll && activities.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-white text-[#7C3AED] rounded-[20px] border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          مشاهده بیشتر ({activities.length - 8} مورد دیگر)
        </button>
      )}
    </div>
  );
}

