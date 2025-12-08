'use client';

import { Plus, Package, Users, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const actions = [
  {
    title: 'ایجاد لیست',
    description: 'لیست کیوریتد جدید بسازید',
    icon: Plus,
    href: '/admin/lists/new',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    title: 'افزودن آیتم',
    description: 'آیتم جدید به لیست اضافه کنید',
    icon: Package,
    href: '/admin/items/new',
    gradient: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  {
    title: 'مدیریت کاربران',
    description: 'کاربران را مدیریت کنید',
    icon: Users,
    href: '/admin/users',
    gradient: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    title: 'تنظیمات',
    description: 'تنظیمات سیستم را تغییر دهید',
    icon: Settings,
    href: '/admin/settings',
    gradient: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-500',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">عملیات سریع</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group relative overflow-hidden rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:border-transparent"
            >
              {/* Hover gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10 flex items-center gap-4">
                <div className={`${action.iconBg} group-hover:bg-white/20 p-3 rounded-xl transition-colors duration-300`}>
                  <Icon className={`w-5 h-5 ${action.iconColor} group-hover:text-white transition-colors duration-300`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-white transition-colors duration-300">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-white/80 mt-0.5 transition-colors duration-300">
                    {action.description}
                  </p>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

