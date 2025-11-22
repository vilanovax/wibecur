'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function TopBar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در پنل مدیریت..."
              className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">نوتیفیکیشن‌ها</h3>
                  <button className="text-xs text-primary hover:text-primary-dark">
                    مشاهده همه
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-sm font-medium text-gray-900">
                      لیست جدید ایجاد شد
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      کاربر جدیدی یک لیست ایجاد کرده است
                    </p>
                    <p className="text-xs text-gray-400 mt-2">۵ دقیقه پیش</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">
                      آیتم جدید اضافه شد
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      یک آیتم جدید به لیست اضافه شده است
                    </p>
                    <p className="text-xs text-gray-400 mt-2">۱ ساعت پیش</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                ا
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">ادمین</p>
                <p className="text-xs text-gray-500">admin@wibecur.com</p>
              </div>
              <User className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors">
                  <User className="w-4 h-4" />
                  <span>پروفایل</span>
                </button>
                <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>تنظیمات</span>
                </button>
                <div className="my-2 border-t border-gray-200"></div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
