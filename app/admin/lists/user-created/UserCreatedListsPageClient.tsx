'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import Pagination from '@/components/admin/shared/Pagination';
import ListItemsModal from '@/components/admin/lists/ListItemsModal';

interface List {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  isActive: boolean;
  commentsEnabled: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  hasBadWord: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    items: number;
    list_likes: number;
    bookmarks: number;
  };
}

interface UserCreatedListsPageClientProps {
  lists: List[];
  currentFilter: string;
  currentSearch: string;
  badWords?: string[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function UserCreatedListsPageClient({
  lists = [],
  currentFilter,
  currentSearch,
  badWords = [],
  totalCount,
  currentPage,
  totalPages,
}: UserCreatedListsPageClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState(currentFilter || 'all');
  const [search, setSearch] = useState(currentSearch || '');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localLists, setLocalLists] = useState<List[]>(lists);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    categoryId: '',
    isPublic: false,
    isActive: false,
    commentsEnabled: true,
  });
  const [viewingListId, setViewingListId] = useState<string | null>(null);
  const [viewingListTitle, setViewingListTitle] = useState<string>('');

  useEffect(() => {
    setLocalLists(lists);
  }, [lists]);

  // Helper function to highlight bad words
  const highlightBadWords = (text: string): React.ReactNode => {
    if (!badWords || badWords.length === 0) return <span>{text}</span>;

    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    let processedText = text;

    const badWordMatches: Array<{ word: string; index: number; length: number }> = [];
    badWords.forEach((badWord) => {
      const escapedWord = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      let match;
      while ((match = regex.exec(processedText)) !== null) {
        badWordMatches.push({
          word: match[0],
          index: match.index,
          length: match[0].length,
        });
      }
    });

    badWordMatches.sort((a, b) => a.index - b.index);

    const nonOverlappingMatches: Array<{ word: string; index: number; length: number }> = [];
    badWordMatches.forEach((match) => {
      const overlaps = nonOverlappingMatches.some(
        (existing) =>
          (match.index >= existing.index &&
            match.index < existing.index + existing.length) ||
          (existing.index >= match.index &&
            existing.index < match.index + match.length)
      );
      if (!overlaps) {
        nonOverlappingMatches.push(match);
      }
    });

    nonOverlappingMatches.forEach((match) => {
      if (match.index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {processedText.substring(lastIndex, match.index)}
          </span>
        );
      }

      result.push(
        <span key={`bad-${match.index}`} className="font-bold text-red-600">
          {match.word}
        </span>
      );

      lastIndex = match.index + match.length;
    });

    if (lastIndex < processedText.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {processedText.substring(lastIndex)}
        </span>
      );
    }

    return result.length > 0 ? <>{result}</> : <span>{text}</span>;
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    const params = new URLSearchParams();
    if (newFilter !== 'all') params.set('filter', newFilter);
    if (search) params.set('search', search);
    router.push(`/admin/lists/user-created?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (search) params.set('search', search);
    router.push(`/admin/lists/user-created?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این لیست اطمینان دارید؟')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/lists/user-created/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      setLocalLists((prev) => prev.filter((list) => list.id !== id));
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting list:', error);
      alert(error.message || 'خطا در حذف لیست');
      setDeletingId(null);
    }
  };

  const handleEdit = (list: List) => {
    setEditingId(list.id);
    setEditForm({
      title: list.title,
      description: list.description || '',
      coverImage: list.coverImage || '',
      categoryId: list.categories.id,
      isPublic: list.isPublic,
      isActive: list.isActive,
      commentsEnabled: list.commentsEnabled ?? true,
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/lists/user-created/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update');
      }

      setEditingId(null);
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating list:', error);
      alert(error.message || 'خطا در به‌روزرسانی لیست');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">لیست‌های کاربران</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => handleFilterChange('bad_words')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'bad_words'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            کلمات بد
          </button>
          <button
            onClick={() => handleFilterChange('public')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'public'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            عمومی
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            غیرفعال
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            جستجو
          </button>
        </form>
      </div>

      {/* Lists Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  خالق
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  دسته‌بندی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  آیتم‌ها
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localLists.map((list) => (
                <tr key={list.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === list.id ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {list.hasBadWord && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          {highlightBadWords(list.title)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {list.users.name || list.users.email.split('@')[0]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{list.categories.icon}</span>
                    <span className="text-sm text-gray-700 mr-1">
                      {list.categories.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {list.itemCount ?? list._count.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          list.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {list.isPublic ? 'عمومی' : 'شخصی'}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          list.isActive
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {list.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {editingId === list.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(list.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setViewingListId(list.id);
                              setViewingListTitle(list.title);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="مشاهده آیتم‌ها"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(list)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(list.id)}
                            disabled={deletingId === list.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {localLists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">لیستی یافت نشد</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/admin/lists/user-created"
              queryParams={{ filter, search }}
            />
          </div>
        )}
      </div>

      {/* List Items Modal */}
      {viewingListId && (
        <ListItemsModal
          isOpen={!!viewingListId}
          onClose={() => {
            setViewingListId(null);
            setViewingListTitle('');
          }}
          listId={viewingListId}
          listTitle={viewingListTitle}
        />
      )}
    </div>
  );
}

