'use client';

import { Clock, Plus, Edit, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'user';
  title: string;
  description: string;
  timestamp: Date;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'create',
    title: 'لیست جدید ایجاد شد',
    description: 'بهترین فیلم‌های عاشقانه ۲۰۲۵',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: '2',
    type: 'edit',
    title: 'لیست ویرایش شد',
    description: 'بهترین کافه‌های روباز تهران',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    type: 'user',
    title: 'کاربر جدید ثبت‌نام کرد',
    description: 'کاربر: ali@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: '4',
    type: 'create',
    title: 'آیتم جدید اضافه شد',
    description: 'فیلم: The Notebook',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

const activityIcons = {
  create: Plus,
  edit: Edit,
  delete: Trash2,
  user: User,
};

const activityColors = {
  create: 'bg-blue-100 text-blue-600',
  edit: 'bg-yellow-100 text-yellow-600',
  delete: 'bg-red-100 text-red-600',
  user: 'bg-green-100 text-green-600',
};

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">فعالیت‌های اخیر</h3>
        <button className="text-sm text-primary hover:text-primary-dark transition-colors">
          مشاهده همه
        </button>
      </div>
      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className={`p-2 rounded-lg ${activityColors[activity.type]}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
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
  );
}

