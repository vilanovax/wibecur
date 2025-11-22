'use client';

import { Plus, FileText, Package, Users, Settings } from 'lucide-react';
import Link from 'next/link';

const actions = [
  {
    title: 'ایجاد لیست',
    description: 'لیست کیوریتد جدید بسازید',
    icon: Plus,
    href: '/admin/lists',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'افزودن آیتم',
    description: 'آیتم جدید به لیست اضافه کنید',
    icon: Package,
    href: '/admin/items',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: 'مدیریت کاربران',
    description: 'کاربران را مدیریت کنید',
    icon: Users,
    href: '/admin/users',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'تنظیمات',
    description: 'تنظیمات سیستم را تغییر دهید',
    icon: Settings,
    href: '/admin/settings',
    color: 'bg-gray-500 hover:bg-gray-600',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">عملیات سریع</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 group"
            >
              <div
                className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {action.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

