'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Loader2, ShieldBan, ShieldCheck, X } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { CommentRestrictionStatusBadge } from './UserPenaltyBadge';
import {
  resolveCommentStatus,
  type CommentPermissionStatus,
  type PenaltyThresholds,
} from '@/lib/comment-permission';

type ViolationDetail = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isActive: boolean;
    commentRestrictedUntil: string | null;
    commentBanReason: string | null;
    createdAt: string;
  };
  totalPenaltyScore: number;
  violationCount: number;
  thresholds: PenaltyThresholds;
  penalties: Array<{
    id: string;
    penaltyScore: number;
    action: string;
    createdAt: string;
    commentPreview: string | null;
  }>;
};

type Props = {
  userId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function ViolationUserDrawer({ userId, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detail, setDetail] = useState<ViolationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/comments/violations/user/${userId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا');
      setDetail(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در بارگذاری');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchDetail();
    else setDetail(null);
  }, [userId, fetchDetail]);

  const runAction = async (action: 'restrict' | 'unrestrict' | 'ban', days?: number) => {
    if (!userId) return;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/comments/violations/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, days }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا');
      await fetchDetail();
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در اعمال محدودیت');
    } finally {
      setActionLoading(null);
    }
  };

  if (!userId) return null;

  const status: CommentPermissionStatus = detail
    ? resolveCommentStatus(
        detail.totalPenaltyScore,
        detail.user.commentRestrictedUntil
          ? new Date(detail.user.commentRestrictedUntil)
          : null,
        detail.user.isActive,
        detail.thresholds
      )
    : 'allowed';

  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 left-0 z-[130] w-full max-w-md bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl flex flex-col"
        dir="rtl"
        role="dialog"
        aria-label="جزئیات کاربر خاطی"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-base font-bold text-[var(--color-text)]">جزئیات کاربر</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[var(--color-bg)]"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              <div className="flex items-start gap-3">
                <UserAvatar
                  src={detail.user.image}
                  name={detail.user.name}
                  email={detail.user.email}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text)]">
                    {detail.user.name || 'بدون نام'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {detail.user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CommentRestrictionStatusBadge status={status} />
                    <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800 tabular-nums">
                      امتیاز منفی: {detail.totalPenaltyScore.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {detail.violationCount.toLocaleString('fa-IR')} تخلف
                    </span>
                  </div>
                </div>
              </div>

              {detail.user.commentBanReason && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {detail.user.commentBanReason}
                  {detail.user.commentRestrictedUntil && (
                    <p className="mt-1">
                      تا:{' '}
                      {new Date(detail.user.commentRestrictedUntil).toLocaleDateString('fa-IR')}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-[var(--color-border)] p-2">
                  <p className="text-[var(--color-text-muted)]">اخطار</p>
                  <p className="font-bold tabular-nums">{detail.thresholds.warn}+</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] p-2">
                  <p className="text-[var(--color-text-muted)]">محدود</p>
                  <p className="font-bold tabular-nums">{detail.thresholds.restrict}+</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] p-2">
                  <p className="text-[var(--color-text-muted)]">مسدود</p>
                  <p className="font-bold tabular-nums">{detail.thresholds.ban}+</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionLoading != null}
                  onClick={() => runAction('restrict', detail.thresholds.restrictDays)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {actionLoading === 'restrict' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldBan className="h-4 w-4" />
                  )}
                  محدود {detail.thresholds.restrictDays} روز
                </button>
                <button
                  type="button"
                  disabled={actionLoading != null}
                  onClick={() => runAction('ban')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {actionLoading === 'ban' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldBan className="h-4 w-4" />
                  )}
                  مسدود کامل
                </button>
                <button
                  type="button"
                  disabled={actionLoading != null}
                  onClick={() => runAction('unrestrict')}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
                >
                  {actionLoading === 'unrestrict' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  رفع محدودیت
                </button>
              </div>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                  تاریخچه امتیاز منفی
                </h3>
                {detail.penalties.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">ثبت نشده</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.penalties.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-rose-700 tabular-nums">
                            -{p.penaltyScore}
                          </span>
                          <span className="text-[var(--color-text-muted)]">{p.action}</span>
                        </div>
                        {p.commentPreview && (
                          <p className="mt-1 line-clamp-2 text-[var(--color-text)]">
                            {p.commentPreview}
                          </p>
                        )}
                        <p className="mt-1 text-[var(--color-text-muted)]">
                          {formatDistanceToNow(new Date(p.createdAt), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
