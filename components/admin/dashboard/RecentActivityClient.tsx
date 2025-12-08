'use client';

import { Clock, Plus, Edit, Trash2, User, ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'user';
  title: string;
  description: string;
  timestamp: Date;
}

interface RecentActivityClientProps {
  activities: Activity[];
}

const activityIcons = {
  create: Plus,
  edit: Edit,
  delete: Trash2,
  user: User,
};

const activityStyles = {
  create: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    ring: 'ring-blue-100',
  },
  edit: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    ring: 'ring-amber-100',
  },
  delete: {
    bg: 'bg-gradient-to-br from-red-500 to-red-600',
    ring: 'ring-red-100',
  },
  user: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    ring: 'ring-emerald-100',
  },
};

export default function RecentActivityClient({ activities }: RecentActivityClientProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
        <h3 className="text-lg font-bold text-gray-900 mb-6">فعالیت‌های اخیر</h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mb-3 opacity-50" />
          <p>هنوز فعالیتی ثبت نشده است</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">فعالیت‌های اخیر</h3>
        <Link
          href="/admin/analytics"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-0 right-5 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-transparent" />

        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type];
            const styles = activityStyles[activity.type];
            return (
              <div
                key={activity.id}
                className="relative flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group"
              >
                <div className={`relative z-10 p-2.5 rounded-xl ${styles.bg} text-white shadow-lg ring-4 ${styles.ring} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
