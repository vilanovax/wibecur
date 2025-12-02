'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, CheckCircle, XCircle, Flag, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  isApproved: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  items: {
    id: string;
    title: string;
  };
  _count: {
    comment_reports: number;
  };
}

interface CommentsPageClientProps {
  comments: Comment[];
  currentFilter: string;
  currentSearch: string;
}

export default function CommentsPageClient({
  comments = [],
  currentFilter,
  currentSearch,
}: CommentsPageClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState(currentFilter || 'all');
  const [search, setSearch] = useState(currentSearch || '');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    const params = new URLSearchParams();
    if (newFilter !== 'all') params.set('filter', newFilter);
    if (search) params.set('search', search);
    router.push(`/admin/comments?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (search) params.set('search', search);
    router.push(`/admin/comments?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این کامنت اطمینان دارید؟')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      router.refresh();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('خطا در حذف کامنت');
    } finally {
      setDeletingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to approve');

      router.refresh();
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('خطا در تایید کامنت');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مدیریت کامنت‌ها</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در کامنت‌ها..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </form>

          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'همه', icon: Filter },
              { id: 'approved', label: 'تایید شده', icon: CheckCircle },
              { id: 'reported', label: 'گزارش شده', icon: Flag },
              { id: 'filtered', label: 'فیلتر شده', icon: XCircle },
            ].map((filterOption) => {
              const Icon = filterOption.icon;
              return (
                <button
                  key={filterOption.id}
                  onClick={() => handleFilterChange(filterOption.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filterOption.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">کامنتی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    کامنت
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    کاربر
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    آیتم
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    تاریخ
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    وضعیت
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p
                        className={`text-sm ${
                          comment.isFiltered ? 'text-gray-500 italic' : 'text-gray-900'
                        }`}
                      >
                        {comment.content.substring(0, 100)}
                        {comment.content.length > 100 && '...'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>❤️ {comment.likeCount}</span>
                        {comment._count.comment_reports > 0 && (
                          <span className="text-red-600">
                            🚩 {comment._count.comment_reports} ریپورت
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {comment.users.image ? (
                          <img
                            src={comment.users.image}
                            alt={comment.users.name || 'User'}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary text-xs font-medium">
                              {(comment.users.name || comment.users.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {comment.users.name || 'بدون نام'}
                          </p>
                          <p className="text-xs text-gray-500">{comment.users.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {comment.items.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {comment.isFiltered && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            فیلتر شده
                          </span>
                        )}
                        {comment.isApproved ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            تایید شده
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            در انتظار تایید
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!comment.isApproved && (
                          <button
                            onClick={() => handleApprove(comment.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="تایید"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

