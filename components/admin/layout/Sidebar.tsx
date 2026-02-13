'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import * as React from 'react';
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
  ChevronDown,
  ChevronLeft,
  Lightbulb,
  Activity,
  TrendingUp,
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
    href: '/admin/pulse',
    label: 'پالس وایب',
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    href: '/admin/kpi',
    label: 'داشبورد رشد (KPI)',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
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
    submenu: [
      { href: '/admin/lists', label: 'همه لیست‌ها', icon: List },
      { href: '/admin/lists/user-created', label: 'لیست‌های کاربران', icon: Users },
    ],
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
    submenu: [
      { href: '/admin/comments', label: 'همه کامنت‌ها', icon: MessageSquare },
      { href: '/admin/comments/reports', label: 'ریپورت کامنت‌ها', icon: AlertTriangle },
      { href: '/admin/comments/item-reports', label: 'ریپورت آیتم‌ها', icon: Package },
      { href: '/admin/comments/bad-words', label: 'کلمات بد', icon: Ban },
      { href: '/admin/comments/violations', label: 'کاربران خاطی', icon: Shield },
    ],
  },
  {
    href: '/admin/suggestions',
    label: 'پیشنهادها',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    submenu: [
      { href: '/admin/suggestions?tab=lists', label: 'پیشنهادات لیست', icon: List },
      { href: '/admin/suggestions?tab=items', label: 'پیشنهادات آیتم', icon: Package },
    ],
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
  // Auto-expand menus if on any subpage
  const shouldExpandComments = pathname?.startsWith('/admin/comments');
  const shouldExpandSuggestions = pathname?.startsWith('/admin/suggestions');
  const shouldExpandLists = pathname?.startsWith('/admin/lists');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    shouldExpandComments ? '/admin/comments' 
    : shouldExpandSuggestions ? '/admin/suggestions'
    : shouldExpandLists ? '/admin/lists'
    : null
  );

  // Update expanded state when pathname changes
  React.useEffect(() => {
    if (shouldExpandComments && expandedMenu !== '/admin/comments') {
      setExpandedMenu('/admin/comments');
    } else if (shouldExpandSuggestions && expandedMenu !== '/admin/suggestions') {
      setExpandedMenu('/admin/suggestions');
    } else if (shouldExpandLists && expandedMenu !== '/admin/lists') {
      setExpandedMenu('/admin/lists');
    }
  }, [pathname, shouldExpandComments, shouldExpandSuggestions, shouldExpandLists]);

  const isCommentsPage = pathname?.startsWith('/admin/comments');
  const isSuggestionsPage = pathname?.startsWith('/admin/suggestions');
  const isListsPage = pathname?.startsWith('/admin/lists');

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
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenu === item.href;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <>
                    <Link
                      href={item.href}
                      className={`group w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        (isCommentsPage && item.href === '/admin/comments') ||
                        (isSuggestionsPage && item.href === '/admin/suggestions') ||
                        (isListsPage && item.href === '/admin/lists')
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('button')) {
                          e.preventDefault();
                          setExpandedMenu(isExpanded ? null : item.href);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-md transition-all duration-200 ${
                            ((isCommentsPage && item.href === '/admin/comments') ||
                             (isSuggestionsPage && item.href === '/admin/suggestions'))
                              ? 'bg-white/20'
                              : `${item.bgColor} group-hover:scale-110`
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              ((isCommentsPage && item.href === '/admin/comments') ||
                               (isSuggestionsPage && item.href === '/admin/suggestions'))
                                ? 'text-white'
                                : item.color
                            }`}
                          />
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpandedMenu(isExpanded ? null : item.href);
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronLeft className="w-4 h-4" />
                        )}
                      </button>
                    </Link>
                    {isExpanded && (
                      <div className="mr-4 mt-1 space-y-1 border-r-2 border-gray-200">
                        {item.submenu?.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                                isSubActive
                                  ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
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
                )}
              </div>
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
