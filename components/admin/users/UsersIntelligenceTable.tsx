'use client';

import { ArrowUp, ArrowDown, Minus, Bot } from 'lucide-react';
import Link from 'next/link';
import type { UserIntelligenceRow as Row } from '@/lib/admin/users-types';
import {
  USER_QUALITY_LABELS,
  USER_RISK_LABELS,
  USER_GROWTH_7D_LABEL,
} from '@/lib/admin/users-types';
import UserAvatar from '@/components/shared/UserAvatar';
import UserRowActionMenu from '@/components/admin/users/UserRowActionMenu';
import { isPhoneAuthEmail } from '@/lib/phone-auth';
import { faNumber } from '@/lib/utils';
import { getRoleLabel } from '@/lib/auth/roles';

const qualityClass: Record<Row['quality'], string> = {
  high_impact: 'bg-emerald-50 text-emerald-800',
  stable: 'bg-amber-50 text-amber-800',
  low_engagement: 'bg-(--color-bg) text-wibe-secondary',
};

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

function secondaryLine(user: Row): string | null {
  if (user.username) return `@${user.username}`;
  if (user.email && !isPhoneAuthEmail(user.email)) return user.email;
  return null;
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
    <div className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-(--color-bg)">
            <tr className="border-b border-(--color-border)">
              <th className="px-3 py-2 text-start text-sm font-medium text-wibe-secondary">
                کاربر
              </th>
              <th className="hidden px-3 py-2 text-start text-sm font-medium text-wibe-secondary sm:table-cell">
                کیفیت
              </th>
              <th
                className="px-3 py-2 text-start text-sm font-medium text-wibe-secondary"
                title="بوکمارک و لیست جدید در ۷ روز اخیر نسبت به ۷ روز قبل"
              >
                {USER_GROWTH_7D_LABEL}
              </th>
              <th className="px-3 py-2 text-start text-sm font-medium text-wibe-secondary">
                لیست
              </th>
              <th className="hidden px-3 py-2 text-start text-sm font-medium text-wibe-secondary md:table-cell">
                ذخیره
              </th>
              <th className="sticky inset-e-0 w-12 bg-(--color-bg) px-2 py-2 text-start text-sm font-medium text-wibe-secondary">
                <span className="sr-only">عمل</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {users.map((user) => {
              const meta = secondaryLine(user);
              const showRole = user.role !== 'USER';
              const showRisk = user.risk !== 'clean';
              return (
                <tr
                  key={user.id}
                  onClick={() => onUserClick(user)}
                  className={`cursor-pointer transition-colors hover:bg-(--color-bg) ${
                    !user.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={user.image}
                          name={user.name}
                          email={user.email}
                          size={36}
                        />
                        <span
                          className={`absolute inset-e-0 bottom-0 size-2 rounded-full border-2 border-(--color-surface) ${
                            user.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                          title={user.isActive ? 'فعال' : 'غیرفعال'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium leading-snug text-(--color-text)">
                            {user.name || 'بدون نام'}
                          </p>
                          {!user.isActive && (
                            <span className="rounded-md bg-red-50 px-2 py-0.5 text-sm text-red-700">
                              غیرفعال
                            </span>
                          )}
                          {showRole && (
                            <span className="rounded-md bg-(--color-bg) px-2 py-0.5 text-sm text-wibe-secondary">
                              {getRoleLabel(user.role)}
                            </span>
                          )}
                          {user.isBot && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-800">
                              <Bot className="size-3" strokeWidth={1.5} />
                              بات
                            </span>
                          )}
                          {showRisk && (
                            <span className="rounded-md bg-red-50 px-2 py-0.5 text-sm font-medium text-red-700">
                              {user.riskLabel ?? USER_RISK_LABELS[user.risk]}
                            </span>
                          )}
                        </div>
                        {meta && (
                          <p className="mt-1 truncate text-sm text-wibe-secondary">
                            {meta}
                          </p>
                        )}
                        <span
                          className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-sm font-medium sm:hidden ${qualityClass[user.quality]}`}
                        >
                          {USER_QUALITY_LABELS[user.quality]}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${qualityClass[user.quality]}`}
                    >
                      {USER_QUALITY_LABELS[user.quality]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                        user.growthPercent > 0
                          ? 'text-emerald-700'
                          : user.growthPercent < 0
                            ? 'text-red-700'
                            : 'text-wibe-secondary'
                      }`}
                      title={
                        user.growth7dRecent != null
                          ? `${faNumber(user.growth7dRecent)} فعالیت اخیر · ${faNumber(user.growth7dPrevious ?? 0)} دوره قبل`
                          : undefined
                      }
                    >
                      {user.growthPercent > 0 && (
                        <ArrowUp className="size-4" strokeWidth={2} />
                      )}
                      {user.growthPercent < 0 && (
                        <ArrowDown className="size-4" strokeWidth={2} />
                      )}
                      {user.growthPercent === 0 && (
                        <Minus className="size-4" strokeWidth={1.5} />
                      )}
                      {user.growthPercent > 0 ? '+' : ''}
                      {faNumber(user.growthPercent)}٪
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-(--color-text)">
                    {user.listsCount > 0 ? (
                      <Link
                        href={`/admin/lists?search=${encodeURIComponent(user.email)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline"
                      >
                        {faNumber(user.listsCount)}
                      </Link>
                    ) : (
                      faNumber(0)
                    )}
                  </td>
                  <td className="hidden px-3 py-2 tabular-nums text-(--color-text) md:table-cell">
                    {faNumber(user.bookmarksCount)}
                  </td>
                  <td
                    className="sticky inset-e-0 bg-(--color-surface) px-2 py-2 hover:bg-(--color-bg)"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <UserRowActionMenu
                      user={user}
                      onOpenDetail={onUserClick}
                      onToggleActiveRequest={onToggleActiveRequest}
                      onUnrestrictCommentRequest={onUnrestrictCommentRequest}
                      togglingId={togglingId}
                      liftingCommentId={liftingCommentId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="px-6 py-12 text-center">
          {emptyBecauseFilter || hasSearch ? (
            <>
              <p className="mb-1 text-sm font-medium text-(--color-text)">
                {hasSearch
                  ? 'نتیجه‌ای برای جستجوی شما نیست'
                  : `کاربری با فیلتر «${filterLabel ?? 'انتخاب‌شده'}» یافت نشد`}
              </p>
              <p className="text-sm text-wibe-secondary">
                فیلتر یا عبارت جستجو را عوض کنید.
              </p>
            </>
          ) : (
            <p className="text-sm text-wibe-secondary">کاربری یافت نشد.</p>
          )}
        </div>
      )}
    </div>
  );
}
