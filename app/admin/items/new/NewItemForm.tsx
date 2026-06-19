'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload, { type ImageUploadDisplayMode } from '@/components/admin/shared/ImageUpload';
import DynamicMetadataFields from '@/components/admin/items/DynamicMetadataFields';
import ItemTipField from '@/components/admin/items/ItemTipField';
import MovieSearchModal from '@/components/admin/items/MovieSearchModal';
import {
  Upload,
  Link as LinkIcon,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import CatalogItemPicker from '@/components/admin/items/CatalogItemPicker';
import EntryKindSelector from '@/components/admin/items/EntryKindSelector';
import {
  isLightweightEntryKind,
  isMixedListCategory,
  type EntryKind,
} from '@/lib/list-entry';

export type NewItemFormList = {
  id: string;
  title: string;
  categories: { id: string; name: string; slug: string; icon: string | null } | null;
};

interface NewItemFormProps {
  lists: NewItemFormList[];
  initialListId?: string;
  /** داخل content hub — هدر ساده‌تر */
  embedded?: boolean;
  /** فقط فرم ساخت موجودیت (بدون تب کاتالوگ) */
  formOnly?: boolean;
}

const MEDIA_TABS: { id: ImageUploadDisplayMode; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: 'آپلود', icon: Upload },
  { id: 'url', label: 'لینک', icon: LinkIcon },
  { id: 'search', label: 'جستجو', icon: Search },
];

export default function NewItemForm({
  lists,
  initialListId,
  embedded = false,
  formOnly = false,
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
  const [mode, setMode] = useState<'catalog' | 'new'>(formOnly ? 'new' : 'catalog');
  const [entryKind, setEntryKind] = useState<EntryKind>('tip');

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
  const isMixedList = isMixedListCategory(selectedList?.categories?.slug);
  const isLightweightMode = isMixedList && isLightweightEntryKind(entryKind);

  useEffect(() => {
    if (!isMixedList) return;
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...(prev.metadata as Record<string, unknown>),
        entryKind,
      },
    }));
  }, [entryKind, isMixedList]);

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
        const uploadRes = await fetch('/api/admin/items/import-image-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: movie.posterUrl,
            folder: 'items',
            metadata: { imdbId: movie.imdbID, imdbID: movie.imdbID },
          }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) finalPosterUrl = uploadData.url;
        } else {
          const errData = await uploadRes.json().catch(() => ({}));
          setError(errData.error || 'خطا در آپلود تصویر به استوریج');
        }
      } catch {
        setError('خطا در آپلود تصویر به استوریج');
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
      let title = formData.title.trim();
      const description = formData.description.trim();
      if (isLightweightMode && !title && description) {
        title = description.slice(0, 80).trim();
      }
      if (!title) {
        setError('عنوان الزامی است');
        setLoading(false);
        return;
      }
      if (isLightweightMode && entryKind === 'link' && !formData.externalUrl.trim()) {
        setError('برای ورودی لینک، آدرس URL الزامی است');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        title,
        description,
        metadata: {
          ...(formData.metadata as Record<string, unknown>),
          ...(isMixedList ? { entryKind } : {}),
        },
      };
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create item');
      router.push(`/admin/lists/${formData.listId}`);
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

      {!embedded && (
        <div className="mb-6" dir="rtl">
          <Link
            href={
              initialListId
                ? `/admin/lists/${initialListId}`
                : '/admin/lists?view=catalog&mode=place'
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-violet-700 mb-3"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">افزودن آیتم</h1>
          {selectedList && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-200">
                {selectedList.categories?.icon || '📋'} {selectedList.title}
              </span>
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-8" dir="rtl">
          {error}
        </div>
      )}

      {!formOnly && (
      <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-6" dir="rtl">
        <button
          type="button"
          onClick={() => setMode('catalog')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'catalog'
              ? 'bg-white dark:bg-gray-700 text-violet-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          از کاتالوگ
          <span className="hidden sm:inline text-xs font-normal text-gray-500">پیشنهادی</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'new'
              ? 'bg-white dark:bg-gray-700 text-violet-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          آیتم جدید
        </button>
      </div>
      )}

      {!formOnly && mode === 'catalog' && (
        <div className="max-w-2xl">
          <CatalogItemPicker
            listId={formData.listId}
            categorySlug={selectedList?.categories?.slug}
            showListSelector
            lists={lists.map((l) => ({
              id: l.id,
              title: l.title,
              icon: l.categories?.icon,
            }))}
            onListChange={(id) => setFormData((p) => ({ ...p, listId: id }))}
            onAdded={() => router.push(`/admin/lists/${formData.listId}`)}
          />
          <p className="text-center text-sm text-gray-500 mt-5">
            موجودیت تازه؟{' '}
            <button
              type="button"
              className="text-violet-600 font-bold hover:underline"
              onClick={() => setMode('new')}
            >
              ساخت آیتم جدید در کاتالوگ
            </button>
          </p>
        </div>
      )}

      {mode === 'new' && (
      <>
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
        {isMixedList && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6">
            <EntryKindSelector
              value={entryKind}
              onChange={setEntryKind}
              lightweightOnly
              includeCatalogEntity
            />
            <p className="mt-3 text-xs text-admin-text-tertiary dark:text-gray-500">
              {isLightweightMode
                ? 'نکته/فکت/لینک بدون ساخت موجودیت کاتالوگ — فقط در همین لیست ذخیره می‌شود.'
                : 'ساخت موجودیت جدید در کاتالوگ و افزودن به لیست.'}
            </p>
          </section>
        )}

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
              placeholder={
                isLightweightMode && entryKind === 'link'
                  ? 'عنوان لینک (مثلاً: مقالهٔ ...'
                  : isLightweightMode
                    ? 'عنوان کوتاه (اختیاری برای نکته — می‌توانید فقط توضیحات بنویسید)'
                    : 'عنوان آیتم را وارد کنید...'
              }
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
              placeholder={
                isLightweightMode
                  ? entryKind === 'fact'
                    ? 'متن فکت علمی...'
                    : entryKind === 'link'
                      ? 'توضیح کوتاه دربارهٔ لینک (اختیاری)'
                      : 'متن نکته یا داده — محتوای اصلی اینجا'
                  : 'توضیحات آیتم (اختیاری)...'
              }
            />
          </div>
        </section>

        {/* 2. Media (Tabbed) — فقط برای موجودیت کاتالوگ */}
        {!isLightweightMode && (
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
              previewVariant="poster"
              enableMoviePosterSources={isFilmCategory}
              metadata={(formData.metadata as Record<string, unknown>) ?? null}
              categorySlug={selectedList?.categories?.slug}
              onSwitchToUrlTab={() => setMediaTab('url')}
            />
        </section>
        )}

        {/* 3. Extended Metadata (Collapsible) */}
        {selectedList?.categories?.slug && !isLightweightMode && (
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
              <div className="px-6 pb-6 pt-2 border-t border-admin-border dark:border-gray-600 space-y-4">
                <DynamicMetadataFields
                  categorySlug={selectedList.categories.slug}
                  metadata={formData.metadata}
                  onChange={(metadata) => setFormData((prev) => ({ ...prev, metadata }))}
                />
                <ItemTipField
                  value={String((formData.metadata as Record<string, unknown>)?.tip ?? '')}
                  onChange={(tip) =>
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...(prev.metadata as Record<string, unknown>),
                        tip: tip.trim() || undefined,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </section>
        )}

        {isLightweightMode && entryKind === 'fact' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6 space-y-3">
            <label htmlFor="factType" className="block text-sm font-medium text-admin-text-primary dark:text-white">
              دستهٔ فکت
            </label>
            <select
              id="factType"
              value={String((formData.metadata as Record<string, unknown>)?.factType ?? 'general')}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: {
                    ...(prev.metadata as Record<string, unknown>),
                    entryKind,
                    factType: e.target.value,
                  },
                }))
              }
              className="w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white"
            >
              <option value="science">علمی</option>
              <option value="health">سلامت</option>
              <option value="productivity">بهره‌وری</option>
              <option value="family">خانواده</option>
              <option value="general">عمومی</option>
            </select>
          </section>
        )}

        {/* 4. Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2 mb-4">
            تنظیمات و لینک
          </h2>

          <div>
            <label htmlFor="externalUrl" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
              لینک خارجی {isLightweightMode && entryKind === 'link' && <span className="text-red-500 text-xs">*</span>}
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

      {/* Sticky Submit Bar — فقط حالت «آیتم جدید» */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-600 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        dir="rtl"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => formRef.current?.requestSubmit()}
            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-bold text-sm disabled:opacity-50 shadow-sm"
          >
            {loading ? 'در حال ایجاد…' : 'ایجاد آیتم'}
          </button>
          <Link
            href={
              initialListId
                ? `/admin/lists/${initialListId}`
                : '/admin/lists?view=catalog&mode=place'
            }
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            انصراف
          </Link>
        </div>
      </div>
      </>
      )}
    </>
  );
}
