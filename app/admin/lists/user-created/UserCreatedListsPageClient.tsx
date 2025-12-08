'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
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
  } | null;
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
      categoryId: list.categories?.id || '',
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
            onClick={() => handleFilterChange('private')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'private'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            خصوصی
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

      {/* Lists Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {localLists.map((list) => (
            <div
              key={list.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Cover Image */}
              {list.coverImage ? (
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100">
                  <Image
                    src={list.coverImage}
                    alt={list.title}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">
                    {list.categories?.icon || '📋'}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Title */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">
                    {list.hasBadWord && (
                      <AlertTriangle className="w-4 h-4 text-red-500 inline ml-1" />
                    )}
                    {highlightBadWords(list.title)}
                  </h3>
                </div>

                {/* Category & Creator */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <span className="text-lg">
                    {list.categories?.icon || '📋'}
                  </span>
                  <span className="text-xs">
                    {list.categories?.name || 'بدون دسته‌بندی'}
                  </span>
                  <span className="text-gray-300 mx-1">•</span>
                  <span className="text-xs">
                    {list.users.name || list.users.email.split('@')[0]}
                  </span>
                </div>

                {/* Description */}
                {list.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {list.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>📋 {list.itemCount ?? list._count.items} آیتم</span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      list.isPublic
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {list.isPublic ? 'عمومی' : 'خصوصی'}
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

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  {editingId === list.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(list.id)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        ذخیره
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        لغو
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setViewingListId(list.id);
                          setViewingListTitle(list.title);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
                        title="مشاهده آیتم‌ها"
                      >
                        <Eye className="w-4 h-4" />
                        مشاهده
                      </button>
                      <button
                        onClick={() => handleEdit(list)}
                        className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        disabled={deletingId === list.id}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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
              basePath="/admin/lists/user-created"
              searchParams={{ filter, search }}
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

