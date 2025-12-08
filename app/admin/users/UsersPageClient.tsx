'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { LayoutGrid, List as ListIcon, Search, X } from 'lucide-react';
import Pagination from '@/components/admin/shared/Pagination';
import UserDetailModal from '@/components/admin/users/UserDetailModal';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  _count: {
    lists: number;
    list_likes: number;
    bookmarks: number;
  };
}

interface UsersPageClientProps {
  users: User[];
  currentSearch: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const roleLabels: Record<UserRole, string> = {
  USER: 'کاربر',
  EDITOR: 'ویرایشگر',
  ADMIN: 'مدیر',
};

const roleColors: Record<UserRole, string> = {
  USER: 'bg-gray-100 text-gray-800',
  EDITOR: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-red-100 text-red-800',
};

export default function UsersPageClient({
  users: initialUsers,
  currentSearch,
  totalCount,
  currentPage,
  totalPages,
}: UsersPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`آیا می‌خواهید کاربر را ${currentStatus ? 'غیرفعال' : 'فعال'} کنید؟`)) {
      return;
    }

    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle user status');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, isActive: !currentStatus }
            : user
        )
      );

      // Update selected user if modal is open
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, isActive: !currentStatus });
      }
    } catch (error: any) {
      console.error('Error toggling user active status:', error);
      alert(error.message || 'خطا در تغییر وضعیت کاربر');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">مدیریت کاربران</h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجو..."
                  className="pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      router.push('/admin/users');
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                جستجو
              </button>
            </form>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="نمایش گریدی"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="نمایش لیستی"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Users Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 border border-gray-100"
              >
                {/* Avatar */}
                <div className="p-6 flex flex-col items-center">
                  {user.image ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4">
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <span className="text-primary font-bold text-2xl">
                        {(user.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 text-center">
                    {user.name || 'بدون نام'}
                  </h3>

                  {/* Role */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium mb-4 ${roleColors[user.role]}`}
                  >
                    {roleLabels[user.role]}
                  </span>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 w-full justify-center border-t border-gray-100 pt-4">
                    <span className="flex flex-col items-center">
                      <span className="text-lg">📋</span>
                      <span>{user._count.lists || 0}</span>
                    </span>
                    <span className="flex flex-col items-center">
                      <span className="text-lg">❤️</span>
                      <span>{user._count.list_likes || 0}</span>
                    </span>
                    <span className="flex flex-col items-center">
                      <span className="text-lg">⭐</span>
                      <span>{user._count.bookmarks || 0}</span>
                    </span>
                  </div>

                  {/* Active Status */}
                  <div className="mt-4 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(user.id, user.isActive);
                      }}
                      disabled={togglingId === user.id}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } disabled:opacity-50`}
                    >
                      {togglingId === user.id
                        ? '...'
                        : user.isActive
                        ? '✓ فعال'
                        : '✗ غیرفعال'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    کاربر
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    نقش
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    آمار
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={user.image}
                              alt={user.name || 'User'}
                              fill
                              className="object-cover"
                              unoptimized={true}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {(user.name || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name || 'بدون نام'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex gap-4">
                        <span>📋 {user._count.lists || 0}</span>
                        <span>❤️ {user._count.list_likes || 0}</span>
                        <span>⭐ {user._count.bookmarks || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(user.id, user.isActive);
                        }}
                        disabled={togglingId === user.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } disabled:opacity-50`}
                      >
                        {togglingId === user.id
                          ? '...'
                          : user.isActive
                          ? '✓ فعال'
                          : '✗ غیرفعال'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">
              {search ? 'کاربری با این جستجو یافت نشد' : 'هنوز کاربری وجود ندارد'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/admin/users"
              searchParams={search ? { search } : {}}
            />
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedUser(null);
          }}
          onToggleActive={(newStatus) => {
            setUsers((prev) =>
              prev.map((user) =>
                user.id === selectedUser.id ? { ...user, isActive: newStatus } : user
              )
            );
            setSelectedUser({ ...selectedUser, isActive: newStatus });
          }}
        />
      )}
    </>
  );
}

