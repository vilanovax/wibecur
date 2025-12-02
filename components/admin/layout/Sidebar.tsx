'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  List,
  Package,
  Users,
  Tag,
  BarChart3,
  Settings,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Ban,
  Shield,
} from 'lucide-react';

const menuItems = [
  {
    href: '/admin/dashboard',
    label: 'داشبورد',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    href: '/admin/categories',
    label: 'دسته‌بندی‌ها',
    icon: Tag,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    href: '/admin/lists',
    label: 'لیست‌ها',
    icon: List,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    href: '/admin/items',
    label: 'آیتم‌ها',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    href: '/admin/users',
    label: 'کاربران',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    href: '/admin/analytics',
    label: 'آنالیتیکس',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    href: '/admin/comments',
    label: 'کامنت‌ها',
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    href: '/admin/settings',
    label: 'تنظیمات',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-xl min-h-screen border-l border-gray-200">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">WibeCur</h2>
            <p className="text-xs text-gray-500">پنل مدیریت</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20'
                      : `${item.bgColor} group-hover:scale-110`
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : item.color
                    }`}
                  />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="mr-auto w-1 h-1 rounded-full bg-white"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center">
          <p>نسخه 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
