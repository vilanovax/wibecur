'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  PowerOff,
  ExternalLink,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import UserAvatar from '@/components/shared/UserAvatar';
import { getRoleLabel, isAdminRole } from '@/lib/auth/roles';
import { usePermissions } from '@/hooks/usePermissions';
import { CommentRestrictionStatusBadge } from '@/components/admin/comments/UserPenaltyBadge';
import type { CommentPermissionStatus } from '@/lib/comment-permission';
import { PasswordInput } from '@/components/ui/password-input';
import {
  authEmailToPhone,
  formatIranPhoneDisplay,
  isPhoneAuthEmail,
} from '@/lib/phone-auth';
import { fa, faNumber } from '@/lib/utils';

interface UserDetailModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleActiveRequest: (user: {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
  }) => void;
  onCommentRestrictionLifted?: () => void;
}

interface UserDetails {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
  emailVerified: string | null;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    lists: number;
    list_likes: number;
    bookmarks: number;
    comments: number;
    comment_likes: number;
    comment_reports: number;
    suggested_items: number;
    suggested_lists: number;
    user_violations: number;
  };
}

function getInsightBadge(d: UserDetails): { label: string; className: string } {
  const { lists, bookmarks, comments } = d._count;
  const total = lists + bookmarks + comments;
  const created = new Date(d.createdAt);
  const isNew = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) < 30;

  if (isNew && total < 3) {
    return { label: 'کاربر جدید', className: 'bg-amber-50 text-amber-800' };
  }
  if (lists >= 5 || bookmarks >= 20 || total >= 30) {
    return { label: 'سازنده فعال', className: 'bg-emerald-50 text-emerald-800' };
  }
  if (lists >= 1 || bookmarks >= 2) {
    return { label: 'کاربر فعال', className: 'bg-sky-50 text-sky-800' };
  }
  return { label: 'کاربر جدید', className: 'bg-amber-50 text-amber-800' };
}

function getRiskBadge(d: UserDetails): { label: string; className: string } {
  const total = d._count.user_violations + d._count.comment_reports;
  if (total >= 3) return { label: 'ریسک بالا', className: 'bg-red-50 text-red-800' };
  if (total >= 1) {
    return { label: 'نیاز به بررسی', className: 'bg-amber-50 text-amber-800' };
  }
  return { label: 'سالم', className: 'bg-emerald-50 text-emerald-800' };
}

function accountContact(email: string): string {
  if (isPhoneAuthEmail(email)) {
    const phone = authEmailToPhone(email);
    return phone ? formatIranPhoneDisplay(phone) : email;
  }
  return email;
}

export default function UserDetailModal({
  userId,
  isOpen,
  onClose,
  onToggleActiveRequest,
  onCommentRestrictionLifted,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentStatus, setCommentStatus] = useState<CommentPermissionStatus | null>(
    null
  );
  const [liftingComment, setLiftingComment] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const { can } = usePermissions();

  useEffect(() => {
    if (isOpen && userId) {
      void fetchUserDetails();
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    setCommentStatus(null);
    try {
      const [userRes, moderationRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch(`/api/admin/comments/violations/user/${userId}`),
      ]);
      const userData = await userRes.json();
      if (!userRes.ok || !userData.success) {
        throw new Error(userData.error || 'خطا در دریافت جزئیات');
      }
      setUser(userData.data);

      if (moderationRes.ok) {
        const moderationJson = await moderationRes.json();
        if (moderationJson.success && moderationJson.data?.commentStatus) {
          setCommentStatus(moderationJson.data.commentStatus);
        }
      }
    } catch (e) {
      console.error(e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiftCommentRestriction = async () => {
    if (!user) return;
    setLiftingComment(true);
    try {
      const res = await fetch(`/api/admin/comments/violations/user/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unrestrict' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در رفع محدودیت');
      }
      setCommentStatus('allowed');
      onCommentRestrictionLifted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLiftingComment(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ذخیره رمز');
      }
      setPasswordSuccess(json.message || 'رمز ذخیره شد');
      setNewPassword('');
      setConfirmPassword('');
      setUser((prev) => (prev ? { ...prev, hasPassword: true } : prev));
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'خطا در ذخیره رمز');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!isOpen) return null;

  const canToggleActive =
    user &&
    (can('suspend_user') || (isAdminRole(user.role) && can('manage_roles')));
  const canSetPassword = can('manage_users');

  const avgSaves =
    user && user._count.lists > 0
      ? user._count.bookmarks / user._count.lists
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-(--color-surface) shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-3">
          <h2
            id="user-detail-title"
            className="text-lg font-bold leading-snug text-(--color-text)"
          >
            جزئیات کاربر
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-(--color-bg)"
          >
            <X className="size-5 text-wibe-secondary" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" strokeWidth={1.5} />
            </div>
          ) : user ? (
            <>
              <div className="flex items-start gap-3">
                <UserAvatar
                  src={user.image}
                  name={user.name}
                  email={user.email}
                  size={56}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold leading-snug text-(--color-text)">
                    {user.name || 'بدون نام'}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-wibe-secondary" dir="ltr">
                    {accountContact(user.email)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-(--color-bg) px-2 py-0.5 text-sm font-medium text-(--color-text)">
                      {getRoleLabel(user.role)}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-sm font-medium ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-sm font-medium ${getInsightBadge(user).className}`}
                    >
                      {getInsightBadge(user).label}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-sm font-medium ${
                        user.hasPassword
                          ? 'bg-sky-50 text-sky-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {user.hasPassword ? 'دارای رمز' : 'بدون رمز'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-wibe-secondary">
                    آخرین فعالیت {formatRelativeTime(user.updatedAt)} · عضویت{' '}
                    {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>

              <section className="rounded-xl border border-(--color-border) p-4">
                <h4 className="mb-3 text-sm font-semibold text-(--color-text)">
                  فعالیت و کیفیت
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  <Stat label="لیست‌ها" value={faNumber(user._count.lists)} />
                  <Stat label="ذخیره‌ها" value={faNumber(user._count.bookmarks)} />
                  <Stat label="کامنت‌ها" value={faNumber(user._count.comments)} />
                  <Stat label="لایک‌ها" value={faNumber(user._count.list_likes)} />
                  <Stat
                    label="میانگین ذخیره / لیست"
                    value={
                      avgSaves != null
                        ? fa(avgSaves.toFixed(1).replace('.', '٫'))
                        : '—'
                    }
                  />
                  <Stat
                    label="پیشنهادها"
                    value={faNumber(
                      user._count.suggested_items + user._count.suggested_lists
                    )}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-(--color-border) p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-(--color-text)">
                    مودریشن و ریسک
                  </h4>
                  <span
                    className={`rounded-md px-2 py-0.5 text-sm font-medium ${getRiskBadge(user).className}`}
                  >
                    {getRiskBadge(user).label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Stat
                    label="ریپورت کامنت"
                    value={faNumber(user._count.comment_reports)}
                  />
                  <Stat
                    label="تخلفات"
                    value={faNumber(user._count.user_violations)}
                  />
                </div>
                {commentStatus && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-wibe-secondary">وضعیت کامنت</span>
                    <CommentRestrictionStatusBadge status={commentStatus} />
                  </div>
                )}
              </section>

              {canSetPassword && (
                <section className="rounded-xl border border-(--color-border) p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <KeyRound className="size-4 text-wibe-secondary" strokeWidth={1.5} />
                    <h4 className="text-sm font-semibold text-(--color-text)">
                      {user.hasPassword ? 'تغییر رمز عبور' : 'ایجاد رمز عبور'}
                    </h4>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-wibe-secondary">
                    {user.hasPassword
                      ? 'رمز فعلی کاربر عوض می‌شود؛ برای ورود بعدی همین رمز جدید را بدهد.'
                      : 'این حساب هنوز رمز ندارد. با تنظیم رمز می‌تواند علاوه بر پیامک با رمز هم وارد شود.'}
                  </p>
                  <form onSubmit={handleSavePassword} className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-(--color-text)">
                        رمز جدید
                      </label>
                      <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="حداقل ۸ کاراکتر"
                        strength
                        required
                        minLength={8}
                        maxLength={64}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-(--color-text)">
                        تکرار رمز جدید
                      </label>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="همان رمز را دوباره وارد کنید"
                        required
                        minLength={8}
                        maxLength={64}
                      />
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-700">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-emerald-700">{passwordSuccess}</p>
                    )}
                    <button
                      type="submit"
                      disabled={
                        passwordSaving ||
                        newPassword.length < 8 ||
                        confirmPassword.length < 8
                      }
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {passwordSaving && (
                        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                      )}
                      {user.hasPassword ? 'ذخیره رمز جدید' : 'تنظیم رمز'}
                    </button>
                  </form>
                </section>
              )}

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-(--color-text)">اکشن‌ها</h4>
                <div className="flex flex-col gap-2">
                  {user.username && (
                    <a
                      href={`/u/${encodeURIComponent(user.username)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-(--color-border) px-3 text-sm font-medium text-(--color-text) hover:bg-(--color-bg)"
                    >
                      <ExternalLink className="size-4" strokeWidth={1.5} />
                      مشاهده پروفایل
                    </a>
                  )}
                  {commentStatus &&
                    (commentStatus === 'restricted' ||
                      commentStatus === 'banned' ||
                      user._count.user_violations > 0) && (
                      <button
                        type="button"
                        onClick={handleLiftCommentRestriction}
                        disabled={liftingComment}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 px-3 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {liftingComment ? (
                          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                        ) : (
                          <ShieldCheck className="size-4" strokeWidth={1.5} />
                        )}
                        رفع محدودیت کامنت
                      </button>
                    )}
                  {canToggleActive && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleActiveRequest({
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          isActive: user.isActive,
                        })
                      }
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <PowerOff className="size-4" strokeWidth={1.5} />
                      {user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    </button>
                  )}
                </div>
              </section>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-(--color-border) text-sm font-medium text-(--color-text) hover:bg-(--color-bg)"
              >
                بستن
              </button>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-wibe-secondary">
              خطا در بارگذاری اطلاعات کاربر
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-wibe-secondary">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-(--color-text)">
        {value}
      </p>
    </div>
  );
}
