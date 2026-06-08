'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
  Lock,
  Info,
  ExternalLink,
} from 'lucide-react';
import { normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';
import { resolveAdminItemThumbnail } from '@/lib/resolve-admin-item-image';
import EntryKindSelector from '@/components/admin/items/EntryKindSelector';
import {
  entryKindBadgeLabel,
  isLightweightEntryKind,
  isMixedListCategory,
  resolveEntryKind,
  type EntryKind,
} from '@/lib/list-entry';

interface EditItemFormProps {
  item: any;
  lists: any[];
}

const MEDIA_TABS: { id: ImageUploadDisplayMode; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: 'آپلود', icon: Upload },
  { id: 'url', label: 'لینک', icon: LinkIcon },
  { id: 'search', label: 'جستجو', icon: Search },
];

function isFilmCategory(slug?: string | null) {
  return slug === 'movie' || slug === 'film' || slug === 'movies';
}

export default function EditItemForm({ item, lists }: EditItemFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [fetchingFromImdb, setFetchingFromImdb] = useState(false);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [moviePlot, setMoviePlot] = useState<string>('');
  const [imageSearchModalOpen, setImageSearchModalOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<ImageUploadDisplayMode>('upload');
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [entryKind, setEntryKind] = useState<EntryKind>(() =>
    resolveEntryKind({
      catalogItemId: item.catalogItemId,
      metadata: item.metadata,
      externalUrl: item.externalUrl,
      imageUrl: item.imageUrl,
    })
  );

  const [formData, setFormData] = useState({
    title: item.title || '',
    description: item.description || '',
    imageUrl:
      resolveAdminItemThumbnail({
        imageUrl: item.imageUrl,
        catalogImageUrl: item.catalog_items?.imageUrl ?? null,
        metadata: item.metadata as Record<string, unknown> | null,
      }) ||
      normalizeImageUrlForStorage(item.imageUrl || item.catalog_items?.imageUrl || '') ||
      '',
    externalUrl: item.externalUrl || '',
    listId: item.listId || '',
    order: item.order || 0,
    listNote: item.listNote || '',
    metadata: item.metadata || {},
    commentsEnabled: item.commentsEnabled !== undefined ? item.commentsEnabled : true,
    maxComments: item.maxComments ?? null,
  });

  const selectedList = useMemo(
    () => lists.find((l) => l.id === formData.listId),
    [lists, formData.listId]
  );

  const categorySlug = selectedList?.categories?.slug;
  const isFilm = isFilmCategory(categorySlug);
  const isMixedList = isMixedListCategory(categorySlug);
  const hasCatalog = Boolean(item.catalogItemId);
  const isLightweightMode =
    isMixedList && !hasCatalog && isLightweightEntryKind(entryKind);
  const backHref = `/admin/lists/${formData.listId}`;
  const catalogUsageCount = item.catalog_items?._count?.items ?? 0;

  useEffect(() => {
    if (!isMixedList || hasCatalog) return;
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...(prev.metadata as Record<string, unknown>),
        entryKind,
      },
    }));
  }, [entryKind, isMixedList, hasCatalog]);

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

      if (data.results && data.results.length > 0) {
        setMovieResults(data.results);
        setShowMovieModal(true);
      } else {
        setError('هیچ فیلمی با این نام یافت نشد');
      }
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
          if (uploadData.uploadedUrl) {
            finalPosterUrl = uploadData.uploadedUrl;
          }
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
        ...prev.metadata,
        year: movie.year || prev.metadata.year,
        genre: movie.genre || prev.metadata.genre,
        director: movie.director || prev.metadata.director,
        imdbRating: movie.rating ? String(movie.rating) : prev.metadata.imdbRating,
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
          categorySlug,
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

      const res = await fetch(`/api/admin/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title,
          description,
          metadata: {
            ...(formData.metadata as Record<string, unknown>),
            ...(isMixedList && !hasCatalog ? { entryKind } : {}),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update item');

      router.push(backHref);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-admin-border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-admin-text-primary dark:text-white placeholder:text-admin-text-tertiary';

  return (
    <>
      <MovieSearchModal
        isOpen={showMovieModal}
        onClose={() => setShowMovieModal(false)}
        searchResults={movieResults}
        onSelectMovie={handleSelectMovie}
        isLoading={fetchingFromImdb}
      />

      {/* Header */}
      <div className="mb-6" dir="rtl">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-violet-700 mb-3"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به آیتم‌ها
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ویرایش آیتم</h1>
            {selectedList && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-200">
                  {selectedList.categories?.icon || '📋'} {selectedList.title}
                </span>
                <span className="text-xs text-gray-400">#{formData.order}</span>
              </p>
            )}
          </div>
          <Link
            href={`/items/${item.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800 shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            پیش‌نمایش عمومی
          </Link>
        </div>
      </div>

      {item.catalogItemId && item.catalog_items && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-violet-200/80 bg-violet-50/80 dark:bg-violet-950/30 dark:border-violet-800 px-4 py-3 text-sm text-violet-900 dark:text-violet-200"
          dir="rtl"
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-violet-600" />
          <div>
            <p className="font-semibold">کاتالوگ مشترک · {entryKindBadgeLabel('catalog_ref')}</p>
            <p className="text-xs mt-0.5 text-violet-800/90 dark:text-violet-300/90">
              تغییر عنوان و تصویر در{' '}
              <strong>{catalogUsageCount || 1}</strong> لیست اعمال می‌شود.
            </p>
          </div>
        </div>
      )}

      {isLightweightMode && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/80 dark:bg-sky-950/30 dark:border-sky-800 px-4 py-3 text-sm text-sky-900 dark:text-sky-200"
          dir="rtl"
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
          <div>
            <p className="font-semibold">ورودی سبک — فقط در همین لیست</p>
            <p className="text-xs mt-0.5 opacity-90">
              بدون موجودیت کاتالوگ؛ تغییرات فقط روی جایگاه این لیست است.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6"
          dir="rtl"
        >
          {error}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-6 pb-24"
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
        {/* لیست — فقط نمایش */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-admin-text-tertiary dark:text-gray-400 mb-3">
            <Lock className="w-3.5 h-3.5" />
            محل قرارگیری
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">{selectedList?.categories?.icon || '📋'}</span>
              <div className="min-w-0">
                <p className="font-semibold text-admin-text-primary dark:text-white truncate">
                  {selectedList?.title || '—'}
                </p>
                <p className="text-xs text-admin-text-tertiary dark:text-gray-500 mt-0.5">
                  {selectedList?.categories?.name || 'بدون دسته'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 shrink-0">
              برای جابه‌جایی به لیست دیگر،{' '}
              <Link
                href={`/admin/lists?view=catalog&mode=create&listId=${formData.listId}`}
                className="text-violet-600 font-medium hover:underline"
              >
                آیتم جدید
              </Link>{' '}
              بسازید
            </p>
          </div>
        </section>

        {isLightweightMode && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6">
            <EntryKindSelector value={entryKind} onChange={setEntryKind} />
          </section>
        )}

        <div className={`grid grid-cols-1 gap-6 items-start ${isLightweightMode ? '' : 'xl:grid-cols-[1fr_320px]'}`}>
          {/* ستون اصلی */}
          <div className="space-y-6 min-w-0">
            {/* اطلاعات اصلی */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2">
                اطلاعات اصلی
              </h2>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label htmlFor="title" className="text-sm font-medium text-admin-text-primary dark:text-white">
                    عنوان <span className="text-red-500 text-xs">*</span>
                  </label>
                  {isFilm && (
                    <button
                      type="button"
                      onClick={handleFetchFromImdb}
                      disabled={fetchingFromImdb || !formData.title.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                  className={inputClass}
                  placeholder={
                    isLightweightMode && entryKind === 'link'
                      ? 'عنوان لینک'
                      : isLightweightMode
                        ? 'عنوان کوتاه'
                        : 'عنوان آیتم...'
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label htmlFor="description" className="text-sm font-medium text-admin-text-primary dark:text-white">
                    توضیحات
                  </label>
                  {categorySlug && (
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generatingDesc || !formData.title.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {generatingDesc ? (
                        <span className="animate-pulse">در حال تولید...</span>
                      ) : (
                        '✨ تولید با AI'
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={
                    isLightweightMode
                      ? entryKind === 'fact'
                        ? 'متن فکت علمی...'
                        : entryKind === 'link'
                          ? 'توضیح کوتاه (اختیاری)'
                          : 'متن نکته یا داده'
                      : 'توضیحات آیتم (اختیاری)...'
                  }
                />
              </div>

              {isLightweightMode && (
                <div>
                  <label htmlFor="listNote" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
                    یادداشت لیست (اختیاری)
                  </label>
                  <textarea
                    id="listNote"
                    name="listNote"
                    rows={2}
                    value={formData.listNote}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="نکتهٔ ویژه فقط برای این لیست"
                  />
                </div>
              )}
            </section>

            {/* اطلاعات تکمیلی — تاشو */}
            {categorySlug && !isLightweightMode && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMetadataOpen(!metadataOpen)}
                  className="w-full flex items-center justify-between px-6 py-4 text-right hover:bg-admin-muted/50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <span className="text-sm font-semibold text-admin-text-primary dark:text-white">
                    اطلاعات تکمیلی{' '}
                    {isFilm ? 'فیلم/سریال' : selectedList?.categories?.name || 'آیتم'}
                  </span>
                  {metadataOpen ? (
                    <ChevronUp className="w-5 h-5 text-admin-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-admin-text-tertiary" />
                  )}
                </button>
                <div
                  className={`transition-all duration-200 overflow-hidden ${
                    metadataOpen ? 'max-h-[1200px]' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6 pt-2 border-t border-admin-border dark:border-gray-600 space-y-4">
                    <DynamicMetadataFields
                      categorySlug={categorySlug}
                      metadata={formData.metadata}
                      onChange={(metadata) => setFormData((prev) => ({ ...prev, metadata }))}
                      hideTitle
                      layout="grid"
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
                  className={inputClass}
                >
                  <option value="science">علمی</option>
                  <option value="health">سلامت</option>
                  <option value="productivity">بهره‌وری</option>
                  <option value="family">خانواده</option>
                  <option value="general">عمومی</option>
                </select>
              </section>
            )}

            {/* تنظیمات */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2 mb-2">
                تنظیمات و لینک
              </h2>

              <div>
                <label htmlFor="externalUrl" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
                  لینک خارجی
                  {isLightweightMode && entryKind === 'link' && (
                    <span className="text-red-500 text-xs"> *</span>
                  )}
                </label>
                <input
                  type="url"
                  id="externalUrl"
                  name="externalUrl"
                  value={formData.externalUrl}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://example.com"
                />
                <p className="text-xs text-admin-text-tertiary dark:text-gray-500 mt-1">
                  برای اطلاعات بیشتر، خرید، دانلود و...
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 p-4 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">کامنت‌ها</p>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="commentsEnabled"
                    checked={formData.commentsEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, commentsEnabled: e.target.checked }))
                    }
                    className="h-4 w-4 mt-0.5 text-violet-600 border-admin-border rounded focus:ring-violet-500"
                  />
                  <div>
                    <label htmlFor="commentsEnabled" className="text-sm font-medium text-admin-text-primary dark:text-white">
                      فعال بودن کامنت‌ها برای این آیتم
                    </label>
                    <p className="text-xs text-admin-text-tertiary dark:text-gray-500 mt-1">
                      اولویت بالاتر از تنظیمات دسته‌بندی
                    </p>
                  </div>
                </div>

                <div className="sm:max-w-xs">
                  <label htmlFor="maxComments" className="block text-sm font-medium text-admin-text-primary dark:text-white mb-2">
                    حداکثر تعداد کامنت
                  </label>
                  <input
                    type="number"
                    id="maxComments"
                    min={1}
                    value={formData.maxComments ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxComments: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    className={inputClass}
                    placeholder="بدون محدودیت"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ستون تصویر — sticky در دسکتاپ */}
          {!isLightweightMode && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-admin-border dark:border-gray-600 p-5 xl:sticky xl:top-4">
            <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider border-b border-admin-border dark:border-gray-600 pb-2 mb-4">
              تصویر آیتم
            </h2>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {MEDIA_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMediaTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mediaTab === tab.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-admin-muted dark:bg-gray-700 text-admin-text-secondary dark:text-gray-400 hover:bg-admin-hover dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
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
              enableMoviePosterSources={isFilm}
              metadata={(formData.metadata as Record<string, unknown>) ?? null}
              categorySlug={selectedList?.categories?.slug}
            />
          </section>
          )}
        </div>
      </form>

      {/* نوار ذخیره ثابت */}
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
            {loading ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
          </button>
          <Link href={backHref} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            انصراف
          </Link>
        </div>
      </div>
    </>
  );
}
