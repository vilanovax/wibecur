'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lists, categories } from '@prisma/client';
import ImageUpload, { type ImageUploadDisplayMode } from '@/components/admin/shared/ImageUpload';
import DynamicMetadataFields from '@/components/admin/items/DynamicMetadataFields';
import MovieSearchModal from '@/components/admin/items/MovieSearchModal';
import { Upload, Link as LinkIcon, Search, ChevronDown, ChevronUp } from 'lucide-react';

type ListWithCategory = lists & {
  categories: categories | null;
};

interface NewItemFormProps {
  lists: ListWithCategory[];
  initialListId?: string;
}

const MEDIA_TABS: { id: ImageUploadDisplayMode; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: 'آپلود', icon: Upload },
  { id: 'url', label: 'لینک', icon: LinkIcon },
  { id: 'search', label: 'جستجو', icon: Search },
];

export default function NewItemForm({
  lists,
  initialListId,
}: NewItemFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [fetchingFromImdb, setFetchingFromImdb] = useState(false);
  const [error, setError] = useState('');
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [imageSearchModalOpen, setImageSearchModalOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<ImageUploadDisplayMode>('upload');
  const [metadataOpen, setMetadataOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    externalUrl: '',
    listId: initialListId || lists[0]?.id || '',
    order: 0,
    metadata: {},
    commentsEnabled: true,
    maxComments: null as number | null,
  });
  const [moviePlot, setMoviePlot] = useState<string>('');

  const selectedList = lists.find((l) => l.id === formData.listId);
  const isFilmCategory =
    selectedList?.categories?.slug === 'movie' ||
    selectedList?.categories?.slug === 'film' ||
    selectedList?.categories?.slug === 'movies';

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handleSubmit = (e: SubmitEvent) => {
      const modal = document.querySelector('[data-image-search-modal]');
      if (modal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };
    form.addEventListener('submit', handleSubmit as any, true);
    return () => form.removeEventListener('submit', handleSubmit as any, true);
  }, [imageSearchModalOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order' ? Number(value) : value,
    }));
  };

  const handleFetchFromImdb = async () => {
    if (!formData.title.trim()) {
      setError('لطفاً ابتدا عنوان فیلم را وارد کنید');
      return;
    }
    setFetchingFromImdb(true);
    setError('');
    try {
      const res = await fetch('/api/admin/items/fetch-movie-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title }),
      });
      if (!res.ok) {
        let errorMessage = 'خطا در دریافت اطلاعات';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `خطای سرور: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setMovieResults(data.results || []);
      setShowMovieModal(true);
    } catch (err: any) {
      setError(err.message || 'خطای ناشناخته در دریافت اطلاعات');
    } finally {
      setFetchingFromImdb(false);
    }
  };

  const handleSelectMovie = async (movie: any) => {
    let finalPosterUrl = movie.posterUrl;
    if (movie.posterUrl) {
      try {
        const uploadRes = await fetch('/api/admin/items/upload-movie-poster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posterUrl: movie.posterUrl }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.uploadedUrl) finalPosterUrl = uploadData.uploadedUrl;
        }
      } catch {
        // keep original
      }
    }
    if (movie.plot) setMoviePlot(movie.plot);
    setFormData((prev) => ({
      ...prev,
      title: movie.title,
      description: movie.plot || prev.description,
      imageUrl: finalPosterUrl || prev.imageUrl,
      metadata: {
        ...(prev.metadata as any),
        year: movie.year || (prev.metadata as any)?.year,
        genre: movie.genre || (prev.metadata as any)?.genre,
        director: movie.director || (prev.metadata as any)?.director,
        imdbRating: movie.rating ? String(movie.rating) : (prev.metadata as any)?.imdbRating,
      },
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      setError('لطفاً ابتدا عنوان را وارد کنید');
      return;
    }
    setGeneratingDesc(true);
    setError('');
    try {
      const res = await fetch('/api/admin/items/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          categorySlug: selectedList?.categories?.slug,
          metadata: formData.metadata,
          plot: moviePlot || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تولید توضیحات');
      setFormData((prev) => ({
        ...prev,
        description: data.description,
        metadata: data.metadata ? { ...prev.metadata, ...data.metadata } : prev.metadata,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const modal = document.querySelector('[data-image-search-modal]');
    if (modal) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create item');
      router.push(`/admin/items?listId=${formData.listId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <MovieSearchModal
        isOpen={showMovieModal}
        onClose={() => setShowMovieModal(false)}
        searchResults={movieResults}
        onSelectMovie={handleSelectMovie}
        isLoading={fetchingFromImdb}
      />

      <div className="flex items-center justify-between mb-8" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary dark:text-white">افزودن آیتم جدید</h1>
          <p className="text-sm text-admin-text-tertiary dark:text-gray-400 mt-1">
            {selectedList && (
              <>به لیست: {selectedList.categories?.icon || '📋'} {selectedList.title}</>
            )}
          </p>
        </div>
        <Link
          href={`/admin/items${initialListId ? `?listId=${initialListId}` : ''}`}
          className="text-admin-text-secondary dark:text-gray-400 hover:text-admin-text-primary dark:hover:text-white"
        >
          ← بازگشت
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-8" dir="rtl">
          {error}
        </div>
      )}

      <form
        id="new-item-form"
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-8 pb-24"
        dir="rtl"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const modal = document.querySelector('[data-image-search-modal]');
            if (modal) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }}
      >
        {/* 1. Core Info (Hero Block) */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2 mb-2">
            اطلاعات اصلی
          </h2>

          <div>
            <label htmlFor="listId" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
              لیست <span className="text-red-500 text-xs">*</span>
            </label>
            <select
              id="listId"
              name="listId"
              required
              value={formData.listId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.categories?.icon || '📋'} {list.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label htmlFor="title" className="block text-sm font-medium text-admin-text-primary dark:text-white">
                عنوان <span className="text-red-500 text-xs">*</span>
              </label>
              {isFilmCategory && (
                <button
                  type="button"
                  onClick={handleFetchFromImdb}
                  disabled={fetchingFromImdb || !formData.title.trim()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetchingFromImdb ? (
                    <span className="animate-pulse">در حال دریافت...</span>
                  ) : (
                    '⭐ دریافت از TMDb/IMDb'
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white placeholder:text-admin-text-tertiary"
              placeholder="عنوان آیتم را وارد کنید..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label htmlFor="description" className="block text-sm font-medium text-admin-text-primary dark:text-white">
                توضیحات
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generatingDesc || !formData.title.trim()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingDesc ? <span className="animate-pulse">در حال تولید...</span> : '✨ تولید با هوش مصنوعی'}
              </button>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white placeholder:text-admin-text-tertiary"
              placeholder="توضیحات آیتم (اختیاری)..."
            />
          </div>
        </section>

        {/* 2. Media (Tabbed) */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6">
          <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2 mb-4">
            تصویر آیتم
          </h2>
          <div className="flex gap-2 mb-4">
            {MEDIA_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMediaTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mediaTab === tab.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-admin-muted dark:bg-gray-700 text-admin-text-secondary dark:text-gray-400 hover:bg-admin-hover dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <ImageUpload
            value={formData.imageUrl}
            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
            label=""
            title={formData.title}
            categoryName={selectedList?.categories?.name}
            onModalOpenChange={setImageSearchModalOpen}
            displayMode={mediaTab}
          />
        </section>

        {/* 3. Extended Metadata (Collapsible) */}
        {selectedList?.categories?.slug && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setMetadataOpen(!metadataOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-right hover:bg-admin-muted/50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <span className="text-sm font-semibold text-admin-text-primary dark:text-white">
                اطلاعات تکمیلی {selectedList.categories.slug === 'movie' || selectedList.categories.slug === 'film' || selectedList.categories.slug === 'movies' ? 'فیلم/سریال' : 'آیتم'}
              </span>
              {metadataOpen ? <ChevronUp className="w-5 h-5 text-admin-text-tertiary" /> : <ChevronDown className="w-5 h-5 text-admin-text-tertiary" />}
            </button>
            <div
              className={`transition-all duration-200 overflow-hidden ${metadataOpen ? 'max-h-[800px]' : 'max-h-0'}`}
            >
              <div className="px-6 pb-6 pt-2 border-t border-admin-border dark:border-gray-600">
                <DynamicMetadataFields
                  categorySlug={selectedList.categories.slug}
                  metadata={formData.metadata}
                  onChange={(metadata) => setFormData((prev) => ({ ...prev, metadata }))}
                />
              </div>
            </div>
          </section>
        )}

        {/* 4. Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2 mb-4">
            تنظیمات و لینک
          </h2>

          <div>
            <label htmlFor="externalUrl" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
              لینک خارجی
            </label>
            <input
              type="url"
              id="externalUrl"
              name="externalUrl"
              value={formData.externalUrl}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white placeholder:text-admin-text-tertiary"
              placeholder="https://example.com"
            />
            <p className="text-xs text-admin-text-tertiary dark:text-gray-500 mt-1">برای اطلاعات بیشتر، خرید، دانلود و...</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="commentsEnabled"
              checked={formData.commentsEnabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, commentsEnabled: e.target.checked }))}
              className="h-4 w-4 text-violet-600 border-admin-border rounded focus:ring-violet-500"
            />
            <label htmlFor="commentsEnabled" className="text-sm font-medium text-admin-text-primary dark:text-white">
              فعال بودن کامنت‌ها برای این آیتم
            </label>
          </div>

          <div>
            <label htmlFor="maxComments" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
              حداکثر تعداد کامنت
            </label>
            <input
              type="number"
              id="maxComments"
              name="maxComments"
              min={1}
              value={formData.maxComments ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxComments: e.target.value ? parseInt(e.target.value, 10) : null,
                }))
              }
              className="w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white"
              placeholder="بدون محدودیت (خالی)"
            />
          </div>
        </section>
      </form>

      {/* Sticky Submit Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-admin-border dark:border-gray-600 shadow-lg px-6 py-4 flex items-center justify-between gap-4"
        dir="rtl"
      >
        <div className="flex-1 max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/admin/items${initialListId ? `?listId=${initialListId}` : ''}`}
            className="px-6 py-2.5 border border-admin-border dark:border-gray-600 text-admin-text-primary dark:text-white rounded-xl hover:bg-admin-muted dark:hover:bg-gray-700 transition-colors font-medium"
          >
            انصراف
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => formRef.current?.requestSubmit()}
            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد آیتم'}
          </button>
        </div>
      </div>
    </>
  );
}
