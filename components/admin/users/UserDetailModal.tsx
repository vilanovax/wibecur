'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  PowerOff,
  Star,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import UserAvatar from '@/components/shared/UserAvatar';

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

  if (isNew && total < 3) return { label: 'کاربر جدید', className: 'bg-amber-100 text-amber-800' };
  if (lists >= 5 || bookmarks >= 20 || total >= 30) return { label: 'سازنده فعال', className: 'bg-emerald-100 text-emerald-800' };
  if (lists >= 1 || bookmarks >= 2) return { label: 'کاربر فعال', className: 'bg-blue-100 text-blue-800' };
  return { label: 'کاربر جدید', className: 'bg-amber-100 text-amber-800' };
}

function getEngagementBadge(d: UserDetails): { label: string; className: string } {
  const { lists, bookmarks } = d._count;
  const ratio = lists > 0 ? bookmarks / lists : 0;

  if (lists >= 3 && ratio >= 5) return { label: 'اثر بالا', className: 'bg-emerald-100 text-emerald-800' };
  if (lists >= 1 || bookmarks >= 2) return { label: 'پایدار', className: 'bg-amber-100 text-amber-800' };
  return { label: 'تعامل کم', className: 'bg-gray-100 text-gray-600' };
}

function getRiskBadge(d: UserDetails): { label: string; className: string } {
  const { user_violations, comment_reports } = d._count;
  const total = user_violations + comment_reports;

  if (total >= 3) return { label: 'ریسک بالا', className: 'bg-red-100 text-red-800' };
  if (total >= 1) return { label: 'نیاز به بررسی', className: 'bg-amber-100 text-amber-800' };
  return { label: 'سالم', className: 'bg-emerald-100 text-emerald-800' };
}

export default function UserDetailModal({
  userId,
  isOpen,
  onClose,
  onToggleActiveRequest,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) fetchUserDetails();
  }, [isOpen, userId]);

  // بستن با Escape
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
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'خطا در دریافت جزئیات');
      setUser(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const roleLabels: Record<string, string> = {
    USER: 'کاربر',
    EDITOR: 'ویرایشگر',
    ADMIN: 'مدیر',
  };

  const roleColors: Record<string, string> = {
    USER: 'bg-gray-100 text-gray-800',
    EDITOR: 'bg-blue-100 text-blue-800',
    ADMIN: 'bg-red-100 text-red-800',
  };

  const sectionCard = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
          <h2 id="user-detail-title" className="text-lg font-bold text-[var(--color-text)]">جزئیات کاربر</h2>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="w-8 h-8 rounded-full hover:bg-[var(--color-bg)] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : user ? (
            <div className="space-y-5">
              {/* Header: Avatar + Name + Status + Last activity */}
              <div className="flex items-start gap-4 pb-5 border-b border-[var(--color-border)]">
                <UserAvatar
                  src={user.image}
                  name={user.name}
                  email={user.email}
                  size={64}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-[var(--color-text)]">
                    {user.name || 'بدون نام'}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] truncate">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    آخرین فعالیت:{' '}
                    {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true, locale: faIR })}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    وضعیت:{' '}
                    <span className={user.isActive ? 'text-emerald-600' : 'text-red-600'}>
                      {user.isActive ? 'فعال اخیر' : 'غیرفعال'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Activity + Quality */}
                <div className="space-y-5">
                  {/* Section 1: Activity */}
                  <div className={sectionCard}>
                    <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text)]">فعالیت و تعامل</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <Row label="لیست‌ها" value={user._count.lists} />
                      <Row label="ذخیره‌ها" value={user._count.bookmarks} />
                      <Row label="کامنت‌ها" value={user._count.comments} />
                      <Row label="لایک‌ها" value={user._count.list_likes} />
                      <p className="text-xs text-[var(--color-text-muted)] pt-1">
                        عضویت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                      </p>
                      <div className="pt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${getInsightBadge(user).className}`}>
                          {getInsightBadge(user).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Quality Summary */}
                  <div className={sectionCard}>
                    <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text)]">خلاصه کیفیت</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <Row
                        label="میانگین ذخیره هر لیست"
                        value={user._count.lists > 0 ? (user._count.bookmarks / user._count.lists).toFixed(1) : '۰'}
                      />
                      <Row
                        label="نسبت ذخیره به لیست"
                        value={
                          user._count.lists > 0
                            ? (user._count.bookmarks / user._count.lists).toFixed(1)
                            : '—'
                        }
                      />
                      <div className="pt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${getEngagementBadge(user).className}`}>
                          {getEngagementBadge(user).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Moderation + Actions */}
                <div className="space-y-5">
                  {/* Section 3: Moderation */}
                  <div className={sectionCard}>
                    <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text)]">مودریشن و ریسک</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <Row label="ریپورت کامنت" value={user._count.comment_reports} />
                      <Row label="تخلفات" value={user._count.user_violations} />
                      <div className="pt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${getRiskBadge(user).className}`}>
                          {getRiskBadge(user).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Actions */}
                  <div className={sectionCard}>
                    <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                      <h4 className="text-sm font-semibold text-[var(--color-text)]">اکشن‌ها</h4>
                    </div>
                    <div className="p-4 space-y-2">
                      {user.username && (
                        <a
                          href={`/u/${encodeURIComponent(user.username)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          مشاهده پروفایل
                        </a>
                      )}
                      <button
                        type="button"
                        disabled
                        title="به‌زودی"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                      >
                        <Star className="w-4 h-4" />
                        ارتقا به کیوریتور (به‌زودی)
                      </button>
                      <button
                        type="button"
                        disabled
                        title="به‌زودی"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                      >
                        <EyeOff className="w-4 h-4" />
                        Shadow Ban (به‌زودی)
                      </button>
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
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                      >
                        <PowerOff className="w-4 h-4" />
                        {user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg)]"
                >
                  بستن
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              خطا در بارگذاری اطلاعات کاربر
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium tabular-nums text-[var(--color-text)]">
        {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
      </span>
    </div>
  );
}
