'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Settings, Trash2, X } from 'lucide-react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import ListCommentSection from '@/components/mobile/lists/ListCommentSection';
import PersonalListSettingsModal from '@/components/mobile/profile/PersonalListSettingsModal';
import Toast from '@/components/shared/Toast';

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
}

interface List {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  saveCount: number;
  itemCount: number;
  commentsEnabled: boolean;
  userId: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  items: Item[];
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface UserListDetailClientProps {
  list: List;
  currentUserId: string | null;
}

export default function UserListDetailClient({
  list,
  currentUserId,
}: UserListDetailClientProps) {
  const [items, setItems] = useState(list.items);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const isOwner = currentUserId === list.userId;

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(true);
    setShowDeleteConfirm(null);

    try {
      const res = await fetch(`/api/user/lists/${list.id}/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف آیتم');
      }

      // Remove item from local state
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      setToastMessage('آیتم با موفقیت حذف شد');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || 'خطا در حذف آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettingsUpdate = () => {
    // Refresh page or update list data
    window.location.reload();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header with Settings Button */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/profile" className="text-gray-700">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold text-gray-900">{list.title}</h1>
            {isOwner && (
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="تنظیمات لیست"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </button>
            )}
            {!isOwner && <div className="w-10" />}
          </div>
        </div>

        <main className="space-y-6">
          {/* Cover Image */}
          {list.coverImage && (
            <div className="relative h-64 bg-gradient-to-br from-purple-100 to-blue-100">
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
                imageFolder="covers"
              />
            </div>
          )}

          {/* Info Section */}
          <div className="px-4 space-y-4">
            {/* Category */}
            {list.categories && (
              <Link
                href={`/categories/${list.categories.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 hover:border-primary transition-colors"
              >
                <span className="text-lg">{list.categories.icon}</span>
                <span>{list.categories.name}</span>
              </Link>
            )}

            {/* Title & Description */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {list.title}
              </h1>
              {list.description && (
                <p className="text-gray-600 leading-relaxed">
                  {list.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span>📋</span>
                <span>{items.length} آیتم</span>
              </span>
              <span className="flex items-center gap-1">
                <span>❤️</span>
                <span>{list.likeCount ?? 0}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>⭐</span>
                <span>{list.saveCount ?? 0}</span>
              </span>
              {list.isPublic && (
                <span className="flex items-center gap-1">
                  <span>👁</span>
                  <span>{list.viewCount ?? 0}</span>
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {list.isPublic && (
              <div className="flex gap-3">
                <BookmarkButton
                  listId={list.id}
                  initialBookmarkCount={list.saveCount ?? 0}
                  variant="button"
                  size="md"
                />
                <button className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium hover:border-primary transition-colors">
                  📤
                </button>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                آیتم‌های لیست ({items.length})
              </h2>
              {isOwner && (
                <Link
                  href={`/user-lists/${list.id}/add-item`}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  ➕ افزودن آیتم
                </Link>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-gray-600">هنوز آیتمی اضافه نشده است</p>
                {isOwner && (
                  <Link
                    href={`/user-lists/${list.id}/add-item`}
                    className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    ➕ افزودن اولین آیتم
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    {isOwner && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟'
                            )
                          ) {
                            handleDeleteItem(item.id);
                          }
                        }}
                        disabled={isDeleting}
                        className="absolute top-2 left-2 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
                        aria-label="حذف آیتم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={`/items/${item.id}`}
                      className="block"
                    >
                      <div className="flex gap-4">
                        {/* Number */}
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>

                        {/* Image */}
                        {item.imageUrl && (
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                            <ImageWithFallback
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              imageFolder="items"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.externalUrl && (
                            <div className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                              <span>🔗</span>
                              <span>اطلاعات بیشتر</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Creator Info */}
          {list.isPublic && (
            <div className="px-4 py-6 bg-white mx-4 rounded-2xl">
              <div className="flex items-center gap-3">
                {list.users.image ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <ImageWithFallback
                      src={list.users.image}
                      alt={list.users.name || list.users.email}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(list.users.name || list.users.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">ایجاد شده توسط</p>
                  <p className="font-medium text-gray-900">
                    {list.users.name || list.users.email.split('@')[0]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          {list.isPublic && list.commentsEnabled && (
            <div className="px-4">
              <ListCommentSection listId={list.id} />
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {isOwner && (
        <PersonalListSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          list={{
            id: list.id,
            title: list.title,
            description: list.description,
            coverImage: list.coverImage,
            isPublic: list.isPublic,
            itemCount: items.length,
            commentsEnabled: list.commentsEnabled,
          }}
          onUpdate={handleSettingsUpdate}
          onDelete={() => {
            window.location.href = '/profile';
          }}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={5000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

