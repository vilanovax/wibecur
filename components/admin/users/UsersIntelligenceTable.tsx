'use client';

import { useState } from 'react';
import {
  MoreVertical,
  BarChart3,
  Power,
  ArrowUp,
  ArrowDown,
  Minus,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import type { UserIntelligenceRow as Row } from '@/lib/admin/users-types';
import {
  USER_QUALITY_LABELS,
  USER_RISK_LABELS,
  USER_GROWTH_7D_LABEL,
} from '@/lib/admin/users-types';
import UserAvatar from '@/components/shared/UserAvatar';

const qualityClass: Record<Row['quality'], string> = {
  high_impact: 'bg-emerald-100 text-emerald-700',
  stable: 'bg-amber-100 text-amber-700',
  low_engagement: 'bg-gray-100 text-gray-600',
};

const roleColors: Record<string, string> = {
  USER: 'bg-gray-100 text-gray-800',
  EDITOR: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-red-100 text-red-800',
};

interface UsersIntelligenceTableProps {
  users: Row[];
  onToggleActiveRequest: (user: Row) => void;
  togglingId: string | null;
  onUserClick: (user: Row) => void;
  emptyBecauseFilter?: boolean;
  filterLabel?: string;
  hasSearch?: boolean;
}

export default function UsersIntelligenceTable({
  users,
  onToggleActiveRequest,
  togglingId,
  onUserClick,
  emptyBecauseFilter = false,
  filterLabel,
  hasSearch = false,
}: UsersIntelligenceTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead className="bg-[var(--color-bg)] sticky top-0 z-10">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                کاربر
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                وضعیت
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                نقش
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                کیفیت
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]"
                title="بوکمارک و لیست جدید در ۷ روز اخیر نسبت به ۷ روز قبل"
              >
                {USER_GROWTH_7D_LABEL}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                لیست‌ها
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                ذخیره‌ها
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                ریسک
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] w-14">
                اکشن
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-muted)]">
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => onUserClick(user)}
                className={`hover:bg-[var(--color-bg)] transition-colors cursor-pointer group ${
                  !user.isActive ? 'opacity-75' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <UserAvatar
                        src={user.image}
                        name={user.name}
                        email={user.email}
                        size={44}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-surface)] ${
                          user.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                        title={user.isActive ? 'فعال' : 'غیرفعال'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[var(--color-text)] truncate">
                          {user.name || 'بدون نام'}
                        </p>
                        {user.isBot && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-medium">
                            <Bot className="w-3 h-3" />
                            بات
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                      {user.username && (
                        <p className="text-[11px] text-[var(--color-text-subtle)] truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${roleColors[user.role] ?? roleColors.USER}`}
                  >
                    {user.role === 'ADMIN'
                      ? 'مدیر'
                      : user.role === 'EDITOR'
                        ? 'ویرایشگر'
                        : 'کاربر'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${qualityClass[user.quality]}`}
                  >
                    {USER_QUALITY_LABELS[user.quality]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${
                      user.growthPercent > 0
                        ? 'text-emerald-600'
                        : user.growthPercent < 0
                          ? 'text-red-600'
                          : 'text-[var(--color-text-muted)]'
                    }`}
                    title={
                      user.growth7dRecent != null
                        ? `${user.growth7dRecent} فعالیت اخیر · ${user.growth7dPrevious ?? 0} دوره قبل`
                        : undefined
                    }
                  >
                    {user.growthPercent > 0 && <ArrowUp className="w-3.5 h-3.5" />}
                    {user.growthPercent < 0 && <ArrowDown className="w-3.5 h-3.5" />}
                    {user.growthPercent === 0 && <Minus className="w-3.5 h-3.5" />}
                    {user.growthPercent > 0 ? '+' : ''}
                    {user.growthPercent.toLocaleString('fa-IR')}٪
                  </span>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                  {user.listsCount > 0 ? (
                    <Link
                      href={`/admin/lists?search=${encodeURIComponent(user.email)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--primary)] hover:underline"
                    >
                      {user.listsCount.toLocaleString('fa-IR')}
                    </Link>
                  ) : (
                    '۰'
                  )}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                  {user.bookmarksCount.toLocaleString('fa-IR')}
                </td>
                <td className="px-4 py-3">
                  {user.risk === 'clean' ? (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {USER_RISK_LABELS.clean}
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                      {user.riskLabel ?? USER_RISK_LABELS[user.risk]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
                      aria-label="منوی عملیات"
                    >
                      <MoreVertical className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    {openMenuId === user.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg py-1">
                          <Link
                            href={`/admin/analytics?user=${user.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <BarChart3 className="w-4 h-4" />
                            آنالیتیکس
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleActiveRequest(user);
                              setOpenMenuId(null);
                            }}
                            disabled={togglingId === user.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            <Power className="w-4 h-4" />
                            {user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="py-14 px-6 text-center">
          {emptyBecauseFilter || hasSearch ? (
            <>
              <p className="text-sm font-medium text-[var(--color-text)] mb-1">
                {hasSearch
                  ? 'نتیجه‌ای برای جستجوی شما نیست'
                  : `کاربری با فیلتر «${filterLabel ?? 'انتخاب‌شده'}» یافت نشد`}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                فیلتر یا عبارت جستجو را تغییر دهید — شمارش روی کل دیتابیس (با احتساب مخفی‌سازی بات) است.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">کاربری یافت نشد.</p>
          )}
        </div>
      )}
    </div>
  );
}
