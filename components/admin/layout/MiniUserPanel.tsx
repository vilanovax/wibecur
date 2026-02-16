'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { User, KeyRound, LogOut } from 'lucide-react';
import { getRoleLabel } from '@/lib/auth/roles';
import Tooltip from './Tooltip';
import clsx from 'clsx';

export interface MiniUserPanelProps {
  collapsed: boolean;
  user: {
    name: string;
    email?: string | null;
    role?: string;
    image?: string | null;
    online?: boolean;
  };
}

export default function MiniUserPanel({ collapsed, user }: MiniUserPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const roleLabel = getRoleLabel(user.role);
  const displayName = user.name || user.email || 'کاربر';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const avatar = (
    <div className="relative shrink-0">
      {user.image ? (
        <img
          src={user.image}
          alt=""
          className="h-10 w-10 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
        />
      ) : (
        <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {displayName.charAt(0)}
        </div>
      )}
      {user.online !== false && (
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-admin-card dark:border-gray-800"
          aria-hidden
        />
      )}
    </div>
  );

  if (collapsed) {
    const trigger = (
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="rounded-xl hover:bg-admin-muted dark:hover:bg-gray-700 transition-colors p-1"
        aria-label="منوی کاربر"
      >
        {avatar}
      </button>
    );
    return (
      <div ref={panelRef} className="relative mt-auto p-3 border-t border-admin-border dark:border-gray-600">
        {dropdownOpen ? (
          <div className="w-full flex justify-center">{trigger}</div>
        ) : (
          <Tooltip
            content={
              <div className="text-right">
                <p className="font-semibold">{displayName}</p>
                <p className="text-xs text-admin-text-tertiary dark:text-gray-400 mt-0.5">{roleLabel}</p>
                {user.online !== false && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">● آنلاین</p>}
              </div>
            }
            side="left"
            className="w-full flex justify-center"
          >
            {trigger}
          </Tooltip>
        )}
        {dropdownOpen && (
          <div className="absolute left-full bottom-full mb-2 ml-2 w-52 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-admin-border dark:border-gray-600 z-50">
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-admin-text-primary dark:text-gray-200 hover:bg-admin-muted dark:hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="h-4 w-4" />
              مشاهده پروفایل
            </Link>
            <Link
              href="/admin/settings?tab=password"
              className="flex items-center gap-2 px-4 py-2 text-sm text-admin-text-primary dark:text-gray-200 hover:bg-admin-muted dark:hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              <KeyRound className="h-4 w-4" />
              تغییر رمز
            </Link>
            <div className="my-2 border-t border-admin-border dark:border-gray-600" />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-right"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={panelRef} className="relative mt-auto p-4 border-t border-admin-border dark:border-gray-600">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={clsx(
          'w-full flex items-center gap-3 rounded-xl p-2 -m-2 transition-colors text-right',
          'hover:bg-admin-muted dark:hover:bg-gray-700/50'
        )}
      >
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-admin-text-primary dark:text-white truncate">{displayName}</p>
          <p className="text-xs text-admin-text-tertiary dark:text-gray-400">{roleLabel}</p>
          {user.online !== false && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">● آنلاین</p>
          )}
        </div>
      </button>
      {dropdownOpen && (
        <div className="absolute right-full ml-2 bottom-0 mb-0 w-52 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-admin-border dark:border-gray-600 z-50">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm text-admin-text-primary dark:text-gray-200 hover:bg-admin-muted dark:hover:bg-gray-700"
            onClick={() => setDropdownOpen(false)}
          >
            <User className="h-4 w-4" />
            مشاهده پروفایل
          </Link>
          <Link
            href="/admin/settings?tab=password"
            className="flex items-center gap-2 px-4 py-2 text-sm text-admin-text-primary dark:text-gray-200 hover:bg-admin-muted dark:hover:bg-gray-700"
            onClick={() => setDropdownOpen(false)}
          >
            <KeyRound className="h-4 w-4" />
            تغییر رمز
          </Link>
          <div className="my-2 border-t border-admin-border dark:border-gray-600" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-right"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      )}
    </div>
  );
}
