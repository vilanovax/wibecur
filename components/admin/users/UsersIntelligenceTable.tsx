'use client';

import { useState } from 'react';
import {
  MoreVertical,
  BarChart3,
  Star,
  EyeOff,
  Power,
  Trash2,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { UserIntelligenceRow as Row } from '@/lib/admin/users-types';
import { USER_QUALITY_LABELS, USER_RISK_LABELS } from '@/lib/admin/users-types';

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
  onToggleActive: (userId: string, current: boolean) => void;
  togglingId: string | null;
  onUserClick: (user: Row) => void;
}

export default function UsersIntelligenceTable({
  users,
  onToggleActive,
  togglingId,
  onUserClick,
}: UsersIntelligenceTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[var(--color-bg)] sticky top-0 z-10">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                کاربر
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                نقش
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                کیفیت
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                رشد
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
                className="hover:bg-[var(--color-bg)] transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={user.image}
                          alt={user.name || ''}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                        <span className="text-[var(--primary)] font-semibold">
                          {(user.name || user.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-text)] truncate">
                        {user.name || 'بدون نام'}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${roleColors[user.role] ?? roleColors.USER}`}
                  >
                    {user.role === 'ADMIN' ? 'مدیر' : user.role === 'EDITOR' ? 'ویرایشگر' : 'کاربر'}
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
                  >
                    {user.growthPercent > 0 && <ArrowUp className="w-3.5 h-3.5" />}
                    {user.growthPercent < 0 && <ArrowDown className="w-3.5 h-3.5" />}
                    {user.growthPercent === 0 && <Minus className="w-3.5 h-3.5" />}
                    {user.growthPercent > 0 ? '+' : ''}
                    {user.growthPercent.toLocaleString('fa-IR')}٪
                  </span>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                  {user.listsCount.toLocaleString('fa-IR')}
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
                    >
                      <MoreVertical className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    {openMenuId === user.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg py-1">
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
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <Star className="w-4 h-4" />
                            ارتقا به کیوریتور
                          </button>
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <EyeOff className="w-4 h-4" />
                            Shadow Ban
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleActive(user.id, user.isActive);
                              setOpenMenuId(null);
                            }}
                            disabled={togglingId === user.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            <Power className="w-4 h-4" />
                            {user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                          </button>
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
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
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          کاربری یافت نشد.
        </div>
      )}
    </div>
  );
}
