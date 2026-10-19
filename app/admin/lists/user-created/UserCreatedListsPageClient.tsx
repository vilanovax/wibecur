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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">لیست‌های کاربران</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {totalCount.toLocaleString('fa-IR')} لیست · مدیریت و بررسی محتوای کاربران
          </p>
        </div>
        <Link
          href="/admin/lists"
          className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
        >
          هوش لیست‌ها
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-[var(--color-text)] hover:bg-gray-200'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => handleFilterChange('bad_words')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'bad_words'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-[var(--color-text)] hover:bg-gray-200'
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
                : 'bg-gray-100 text-[var(--color-text)] hover:bg-gray-200'
            }`}
          >
            عمومی
          </button>
          <button
            onClick={() => handleFilterChange('private')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'private'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-[var(--color-text)] hover:bg-gray-200'
            }`}
          >
            خصوصی
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-[var(--color-text)] hover:bg-gray-200'
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
      <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
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
                  <h3 className="font-bold text-lg text-[var(--color-text)] line-clamp-2 flex-1">
                    {list.hasBadWord && (
                      <AlertTriangle className="w-4 h-4 text-red-500 inline ml-1" />
                    )}
                    {highlightBadWords(list.title)}
                  </h3>
                </div>

                {/* Category & Creator */}
                <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-text-muted)]">
                  <span className="text-lg">
                    {list.categories?.icon || '📋'}
                  </span>
                  <span className="text-xs">
                    {list.categories?.name || 'بدون دسته‌بندی'}
                  </span>
                  <span className="text-[var(--color-text-subtle)] mx-1">•</span>
                  <span className="text-xs">
                    {list.users.name || list.users.email.split('@')[0]}
                  </span>
                </div>

                {/* Description */}
                {list.description && (
                  <p className="text-[var(--color-text-muted)] text-sm mb-3 line-clamp-2">
                    {list.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-3">
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
                <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border-muted)]">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingListId(list.id);
                      setViewingListTitle(list.title);
                    }}
                    className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-muted)] transition-colors text-sm flex items-center justify-center gap-1"
                    title="مشاهده آیتم‌ها"
                  >
                    <Eye className="w-4 h-4" />
                    آیتم‌ها
                  </button>
                  <Link
                    href={`/admin/lists/${list.id}/edit`}
                    className="px-3 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-colors text-sm flex items-center gap-1"
                    title="ویرایش کامل"
                  >
                    <Edit className="w-4 h-4" />
                    ویرایش
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(list.id)}
                    disabled={deletingId === list.id}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {localLists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-muted)]">لیستی یافت نشد</p>
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

