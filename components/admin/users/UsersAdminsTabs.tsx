'use client';

import Link from 'next/link';
import { Shield, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export type UsersHubTab = 'users' | 'admins';

export default function UsersAdminsTabs({ active }: { active: UsersHubTab }) {
  const { can } = usePermissions();
  const showAdmins = can('manage_roles');

  return (
    <header className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold leading-snug text-(--color-text)">
          {active === 'admins' ? 'مدیریت ادمین‌ها' : 'مدیریت کاربران'}
        </h1>
        <p className="mt-1 text-sm text-wibe-secondary">
          {active === 'admins'
            ? 'تعریف ادمین و پرونده برای دسترسی، رمز، ورود و عملیات.'
            : 'برای جزئیات و تنظیم رمز روی ردیف کلیک کنید.'}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="بخش کاربران"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <Link
          href="/admin/users"
          role="tab"
          aria-selected={active === 'users'}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
            active === 'users'
              ? 'bg-primary text-white'
              : 'border border-(--color-border) bg-(--color-surface) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
          }`}
        >
          <Users className="size-4" strokeWidth={active === 'users' ? 2 : 1.5} />
          کاربران
        </Link>
        {showAdmins && (
          <Link
            href="/admin/users?tab=admins"
            role="tab"
            aria-selected={active === 'admins'}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
              active === 'admins'
                ? 'bg-primary text-white'
                : 'border border-(--color-border) bg-(--color-surface) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
            }`}
          >
            <Shield className="size-4" strokeWidth={active === 'admins' ? 2 : 1.5} />
            ادمین‌ها
          </Link>
        )}
      </div>
    </header>
  );
}
