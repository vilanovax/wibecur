'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categories } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'list_created' | 'bookmark' | 'like';
  title: string;
  description: string;
  image: string | null;
  slug?: string;
  category: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'>;
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500">فعالیتی یافت نشد</p>
      </div>
    );
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 4);

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => (
        <Link
          key={activity.id}
          href={`/lists/${activity.slug || activity.title.replace(/\s+/g, '-').toLowerCase()}`}
          className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
          {activity.image && (
            <div className="relative h-48">
              <Image
                src={activity.image}
                alt={activity.title}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{activity.category.icon}</span>
              <span className="text-xs text-gray-500">
                {activity.category.name}
              </span>
              <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                {getActivityIcon(activity.type)}
                {getActivityLabel(activity.type)}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">{activity.title}</h3>
            {activity.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {activity.description}
              </p>
            )}
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </Link>
      ))}

      {!showAll && activities.length > 4 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          مشاهده بیشتر ({activities.length - 4} مورد دیگر)
        </button>
      )}
    </div>
  );
}

