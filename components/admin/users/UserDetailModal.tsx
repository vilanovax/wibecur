'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Power, PowerOff } from 'lucide-react';
import Image from 'next/image';

interface UserDetailModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleActive: (newStatus: boolean) => void;
}

interface UserDetails {
  id: string;
  name: string | null;
  email: string;
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

export default function UserDetailModal({
  userId,
  isOpen,
  onClose,
  onToggleActive,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      setUser(data.data);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      alert(error.message || 'خطا در دریافت جزئیات کاربر');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;

    if (!confirm(`آیا می‌خواهید کاربر را ${user.isActive ? 'غیرفعال' : 'فعال'} کنید؟`)) {
      return;
    }

    setIsToggling(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle user status');
      }

      const newStatus = !user.isActive;
      setUser({ ...user, isActive: newStatus });
      onToggleActive(newStatus);
    } catch (error: any) {
      console.error('Error toggling user active status:', error);
      alert(error.message || 'خطا در تغییر وضعیت کاربر');
    } finally {
      setIsToggling(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">جزئیات کاربر</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                {user.image ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden">
                    <Image
                      src={user.image}
                      alt={user.name || user.email}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-3xl">
                      {(user.name || user.email)[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {user.name || 'بدون نام'}
                  </h3>
                  <p className="text-gray-600 mb-3">{user.email}</p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? '✓ فعال' : '✗ غیرفعال'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-2xl font-bold text-gray-900">{user._count.lists}</div>
                  <div className="text-xs text-gray-500">لیست</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">❤️</div>
                  <div className="text-2xl font-bold text-gray-900">{user._count.list_likes}</div>
                  <div className="text-xs text-gray-500">لایک</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-2xl font-bold text-gray-900">{user._count.bookmarks}</div>
                  <div className="text-xs text-gray-500">ذخیره</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-2xl font-bold text-gray-900">{user._count.comments}</div>
                  <div className="text-xs text-gray-500">کامنت</div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">پیشنهادات لیست</div>
                  <div className="text-xl font-bold text-gray-900">{user._count.suggested_lists}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">پیشنهادات آیتم</div>
                  <div className="text-xl font-bold text-gray-900">{user._count.suggested_items}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">ریپورت‌های کامنت</div>
                  <div className="text-xl font-bold text-gray-900">{user._count.comment_reports}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">تخلفات</div>
                  <div className="text-xl font-bold text-gray-900">{user._count.user_violations}</div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-sm text-gray-500 mb-1">تاریخ عضویت</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                  </div>
                </div>
                {user.emailVerified && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">ایمیل تایید شده</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(user.emailVerified).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleToggleActive}
                  disabled={isToggling}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    user.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {isToggling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال تغییر...
                    </>
                  ) : user.isActive ? (
                    <>
                      <PowerOff className="w-5 h-5" />
                      غیرفعال کردن
                    </>
                  ) : (
                    <>
                      <Power className="w-5 h-5" />
                      فعال کردن
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  بستن
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">خطا در بارگذاری اطلاعات کاربر</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

