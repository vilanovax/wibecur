'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Search, BookOpen, Star, Loader2 } from 'lucide-react';
import {
  BOOK_COVER_SOURCE_LABELS,
  type BookCoverSearchSource,
} from '@/lib/book-cover-search';

type CoverResult = {
  id: string;
  source: BookCoverSearchSource;
  title: string;
  coverUrl: string;
  bookUrl: string;
  author?: string | null;
  rating?: number | null;
};

interface BookCoverSearchModalProps {
  isOpen: boolean;
  source: BookCoverSearchSource;
  onClose: () => void;
  onSelectCover: (
    coverUrl: string,
    context?: { source?: BookCoverSearchSource; sourceId?: string; bookUrl?: string }
  ) => void;
  initialQuery?: string;
}

export default function BookCoverSearchModal({
  isOpen,
  source,
  onClose,
  onSelectCover,
  initialQuery = '',
}: BookCoverSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<CoverResult[]>([]);
  const [selected, setSelected] = useState<CoverResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery || '');
      setResults([]);
      setSelected(null);
      setError('');
    }
  }, [isOpen, initialQuery, source]);

  if (!isOpen || !mounted) return null;

  const label = BOOK_COVER_SOURCE_LABELS[source];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!searchQuery.trim()) {
      setError('عبارت جستجو را وارد کنید');
      return;
    }

    setIsSearching(true);
    setError('');
    setResults([]);
    setSelected(null);

    try {
      const res = await fetch('/api/admin/items/search-book-covers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: searchQuery.trim(),
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در جستجو');

      const list = (data.results || []) as CoverResult[];
      setResults(list);
      if (list.length === 0) {
        setError(data.message || 'کاور یافت نشد');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'خطا در جستجو');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selected?.coverUrl) {
      const idMatch = selected.id.match(/^(?:fidibo|ketabrah|taaghche)-(.+)$/i);
      onSelectCover(selected.coverUrl, {
        source: selected.source,
        sourceId: idMatch?.[1],
        bookUrl: selected.bookUrl,
      });
      onClose();
    }
  };

  const modalContent = (
    <div
      data-image-search-modal="true"
      data-book-cover-search-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-[var(--color-text)] dark:text-white">
            جستجوی کاور در {label}
          </h2>
          <button type="button" onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثال: تفکر، سریع و کند"
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-800"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              جستجو
            </button>
          </div>
        </form>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {isSearching ? (
            <div className="flex flex-col items-center py-12 text-[var(--color-text-muted)]">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              در حال جستجو در {label}...
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`text-right rounded-xl overflow-hidden border-2 transition-all ${
                    selected?.id === item.id
                      ? 'border-violet-600 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                >
                  <div className="relative aspect-[2/3] bg-gray-100">
                    <Image
                      src={item.coverUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <p className="text-xs font-semibold line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--color-text-muted)]">
                      {item.author && <span className="line-clamp-1">{item.author}</span>}
                      {item.rating != null && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            !error && (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>عنوان کتاب را جستجو کنید</p>
              </div>
            )
          )}
        </div>

        {selected?.coverUrl && (
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0">
                <Image src={selected.coverUrl} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{selected.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">منبع: {label}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
              >
                استفاده از کاور
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
