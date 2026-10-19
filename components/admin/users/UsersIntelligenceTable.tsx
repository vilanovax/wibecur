'use client';

import {
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
import UserRowActionMenu from '@/components/admin/users/UserRowActionMenu';

const qualityClass: Record<Row['quality'], string> = {
  high_impact: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  stable: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low_engagement: 'bg-gray-100 text-[var(--color-text-muted)] dark:bg-gray-700/50 dark:text-[var(--color-text-subtle)]',
};

const roleColors: Record<string, string> = {
  USER: 'bg-gray-100 text-[var(--color-text)] dark:bg-gray-700/50 dark:text-gray-200',
  EDITOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

/** ماسک ایمیل برای نمای فهرست — جلوگیری از نمایش انبوه PII (ایمیل کامل در مدال جزئیات) */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const shown = local.slice(0, 2);
  const dots = '•'.repeat(Math.max(1, Math.min(local.length - shown.length, 4)));
  return `${shown}${dots}@${domain}`;
}

interface UsersIntelligenceTableProps {
  users: Row[];
  onToggleActiveRequest: (user: Row) => void;
  onUnrestrictCommentRequest?: (user: Row) => void;
  togglingId: string | null;
  liftingCommentId?: string | null;
  onUserClick: (user: Row) => void;
  emptyBecauseFilter?: boolean;
  filterLabel?: string;
  hasSearch?: boolean;
}

export default function UsersIntelligenceTable({
  users,
  onToggleActiveRequest,
  onUnrestrictCommentRequest,
  togglingId,
  liftingCommentId = null,
  onUserClick,
  emptyBecauseFilter = false,
  filterLabel,
  hasSearch = false,
}: UsersIntelligenceTableProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
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
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px] font-medium">
                            <Bot className="w-3 h-3" />
                            بات
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                      {user.username && user.email && (
                        <p className="text-[11px] text-[var(--color-text-subtle)] truncate" title="ایمیل کامل در جزئیات کاربر">
                          {maskEmail(user.email)}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-[var(--color-text-muted)] dark:bg-gray-700/50 dark:text-[var(--color-text-subtle)]'
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
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      {user.riskLabel ?? USER_RISK_LABELS[user.risk]}
                    </span>
                  )}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <UserRowActionMenu
                    user={user}
                    onToggleActiveRequest={onToggleActiveRequest}
                    onUnrestrictCommentRequest={onUnrestrictCommentRequest}
                    togglingId={togglingId}
                    liftingCommentId={liftingCommentId}
                  />
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
