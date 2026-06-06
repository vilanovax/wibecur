'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Search, Film, Star, Loader2 } from 'lucide-react';
import type { MoviePosterSearchSource } from '@/lib/movie-poster-search';

type PosterResult = {
  id: string;
  source: MoviePosterSearchSource;
  title: string;
  year: number | null;
  posterUrl: string | null;
  rating?: string | number | null;
  genre?: string | null;
};

interface MoviePosterSearchModalProps {
  isOpen: boolean;
  source: MoviePosterSearchSource;
  onClose: () => void;
  onSelectPoster: (posterUrl: string) => void;
  initialQuery?: string;
  metadata?: Record<string, unknown> | null;
  year?: number | string | null;
}

const SOURCE_LABELS: Record<MoviePosterSearchSource, string> = {
  imdb: 'IMDb',
  tmdb: 'TMDb',
};

export default function MoviePosterSearchModal({
  isOpen,
  source,
  onClose,
  onSelectPoster,
  initialQuery = '',
  metadata = null,
  year = null,
}: MoviePosterSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<PosterResult[]>([]);
  const [selected, setSelected] = useState<PosterResult | null>(null);
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

  const label = SOURCE_LABELS[source];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('عبارت جستجو را وارد کنید');
      return;
    }

    setIsSearching(true);
    setError('');
    setResults([]);
    setSelected(null);

    try {
      const res = await fetch('/api/admin/items/search-movie-posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: searchQuery.trim(),
          source,
          metadata,
          year,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در جستجو');

      const list = (data.results || []) as PosterResult[];
      setResults(list);
      if (list.length === 0) {
        setError(data.message || 'poster یافت نشد');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'خطا در جستجو');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selected?.posterUrl) {
      onSelectPoster(selected.posterUrl);
      onClose();
    }
  };

  const modalContent = (
    <div
      data-image-search-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            جستجوی poster در {label}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثال: Coherence (فقط نام انگلیسی فیلم)"
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
            <div className="flex flex-col items-center py-12 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              در حال جستجو در {label}...
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.posterUrl}
                  onClick={() => item.posterUrl && setSelected(item)}
                  className={`text-right rounded-xl overflow-hidden border-2 transition-all ${
                    selected?.id === item.id
                      ? 'border-violet-600 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-violet-300'
                  } ${!item.posterUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="relative aspect-[2/3] bg-gray-100">
                    {item.posterUrl ? (
                      <Image
                        src={item.posterUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <p className="text-xs font-semibold line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      {item.year && <span>{item.year}</span>}
                      {item.rating != null && (
                        <span className="flex items-center gap-0.5">
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
              <div className="text-center py-12 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>عنوان فیلم را جستجو کنید</p>
              </div>
            )
          )}
        </div>

        {selected?.posterUrl && (
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0">
                <Image src={selected.posterUrl} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{selected.title}</p>
                <p className="text-xs text-gray-500">منبع: {label}</p>
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
                استفاده از poster
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
