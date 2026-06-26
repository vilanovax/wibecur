'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload, { type ImageUploadDisplayMode } from '@/components/admin/shared/ImageUpload';
import DynamicMetadataFields from '@/components/admin/items/DynamicMetadataFields';
import ItemTipField from '@/components/admin/items/ItemTipField';
import MovieSearchModal from '@/components/admin/items/MovieSearchModal';
import CatalogSearchProfilePanel from '@/components/admin/catalog/CatalogSearchProfilePanel';
import CatalogVisibilityControl from '@/components/admin/catalog/CatalogVisibilityControl';
import { catalogCategoryLabel } from '@/lib/catalog-display';
import { ArrowRight, ChevronDown, ChevronUp, Link as LinkIcon, Search, Upload } from 'lucide-react';

type CategoryOption = { id: string; name: string; slug: string; icon: string };

type CatalogEditData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  categorySlug: string | null;
  metadata: unknown;
  listCount: number;
  isDisabled?: boolean;
};

function isFilmCategory(slug?: string | null) {
  return slug === 'movie' || slug === 'film' || slug === 'movies';
}

const MEDIA_TABS: { id: ImageUploadDisplayMode; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: 'آپلود', icon: Upload },
  { id: 'url', label: 'لینک', icon: LinkIcon },
  { id: 'search', label: 'جستجو', icon: Search },
];

export default function CatalogEditForm({
  catalog,
  categories,
}: {
  catalog: CatalogEditData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [fetchingFromImdb, setFetchingFromImdb] = useState(false);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [imageSearchModalOpen, setImageSearchModalOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<ImageUploadDisplayMode>('upload');
  const [isDisabled, setIsDisabled] = useState(Boolean(catalog.isDisabled));
  const [form, setForm] = useState({
    title: catalog.title,
    description: catalog.description ?? '',
    imageUrl: catalog.imageUrl ?? '',
    externalUrl: catalog.externalUrl ?? '',
    categorySlug: catalog.categorySlug ?? '',
    metadata: (catalog.metadata as Record<string, unknown>) || {},
  });

  const categoryOptions = useMemo(() => {
    const opts = categories.map((c) => ({
      slug: c.slug,
      label: `${c.icon} ${c.name}`,
    }));
    const current = catalog.categorySlug;
    if (current && !categories.some((c) => c.slug === current)) {
      opts.unshift({
        slug: current,
        label: `${catalogCategoryLabel(current)} (فعلی)`,
      });
    }
    return opts;
  }, [categories, catalog.categorySlug]);

  const categoryChanged = form.categorySlug !== (catalog.categorySlug ?? '');
  const isFilm = isFilmCategory(form.categorySlug);
  const categoryLabel =
    categories.find((c) => c.slug === form.categorySlug)?.name ||
    catalogCategoryLabel(form.categorySlug || null);

  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl) return;

    const blockNestedSubmit = (e: SubmitEvent) => {
      const imageModal = document.querySelector('[data-image-search-modal]');
      const posterModal = document.querySelector('[data-movie-poster-search-modal]');
      if (imageModal || posterModal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    formEl.addEventListener('submit', blockNestedSubmit, true);
    return () => formEl.removeEventListener('submit', blockNestedSubmit, true);
  }, [imageSearchModalOpen]);

  const handleFetchFromImdb = async () => {
    if (!form.title.trim()) {
      setError('لطفاً ابتدا عنوان فیلم را وارد کنید');
      return;
    }
    setFetchingFromImdb(true);
    setError('');
    try {
      const res = await fetch('/api/admin/items/fetch-movie-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در دریافت اطلاعات');
      }
      const data = await res.json();
      if (data.results?.length > 0) {
        setMovieResults(data.results);
        setShowMovieModal(true);
      } else {
        setError('هیچ فیلمی با این نام یافت نشد');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
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

    setForm((prev) => ({
      ...prev,
      title: movie.title || prev.title,
      description: movie.plot || prev.description,
      imageUrl: finalPosterUrl || prev.imageUrl,
      externalUrl: movie.imdbID
        ? `https://www.imdb.com/title/${movie.imdbID}/`
        : prev.externalUrl,
      metadata: {
        ...prev.metadata,
        year: movie.year || prev.metadata.year,
        genre: movie.genre || prev.metadata.genre,
        director: movie.director || prev.metadata.director,
        imdbId: movie.imdbID || prev.metadata.imdbId,
        imdbRating: movie.rating ? String(movie.rating) : prev.metadata.imdbRating,
      },
    }));
    setShowMovieModal(false);
  };

  const handleGenerateDescription = async () => {
    if (!form.title.trim()) {
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
          title: form.title,
          categorySlug: form.categorySlug,
          metadata: form.metadata,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تولید توضیحات');
      if (data.description) {
        setForm((prev) => ({ ...prev, description: data.description }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در تولید توضیحات');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryChanged) {
      const from = catalogCategoryLabel(catalog.categorySlug);
      const to = catalogCategoryLabel(form.categorySlug || null);
      if (
        !confirm(
          `دستهٔ اصلی از «${from}» به «${to}» تغییر می‌کند.\nاین روی همهٔ جایگاه‌های این آیتم اعمال می‌شود. ادامه می‌دهید؟`
        )
      ) {
        return;
      }
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/catalog-items/${catalog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          imageUrl: form.imageUrl,
          externalUrl: form.externalUrl,
          categorySlug: form.categorySlug || null,
          metadata: form.metadata,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      router.push('/admin/lists?view=catalog');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl pb-20" dir="rtl">
      <Link
        href="/admin/lists?view=catalog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-700 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به کاتالوگ
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">ویرایش آیتم</h1>
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
        تغییرات روی{' '}
        <strong>{catalog.listCount.toLocaleString('fa-IR')} جایگاه</strong> در لیست‌های مختلف
        اعمال می‌شود.
      </p>

      <CatalogVisibilityControl
        catalogId={catalog.id}
        isDisabled={isDisabled}
        placementCount={catalog.listCount}
        onChanged={setIsDisabled}
        onError={setError}
        className="mb-6"
      />

      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2 mb-4">{error}</p>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const imageModal = document.querySelector('[data-image-search-modal]');
            const posterModal = document.querySelector('[data-movie-poster-search-modal]');
            if (imageModal || posterModal) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }}
      >
        <div>
          <label htmlFor="categorySlug" className="block text-sm font-semibold mb-1.5">
            دستهٔ اصلی <span className="text-red-500">*</span>
          </label>
          <select
            id="categorySlug"
            required
            value={form.categorySlug}
            onChange={(e) => setForm((p) => ({ ...p, categorySlug: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-violet-500/25"
          >
            <option value="" disabled>
              انتخاب دسته…
            </option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1.5">
            نوع محتوا در کل سیستم (فیلم، کتاب، کافه و …) — مستقل از لیستی که آیتم در آن قرار دارد.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <label htmlFor="title" className="block text-sm font-semibold">
              عنوان <span className="text-red-500">*</span>
            </label>
            {isFilm && (
              <button
                type="button"
                onClick={() => void handleFetchFromImdb()}
                disabled={fetchingFromImdb || !form.title.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50"
              >
                {fetchingFromImdb ? 'در حال دریافت…' : '⭐ دریافت از TMDb/IMDb'}
              </button>
            )}
          </div>
          <input
            id="title"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <label htmlFor="description" className="block text-sm font-semibold">
              توضیحات
            </label>
            {form.categorySlug && (
              <button
                type="button"
                onClick={() => void handleGenerateDescription()}
                disabled={generatingDesc || !form.title.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50"
              >
                {generatingDesc ? 'در حال تولید…' : '✨ تولید با AI'}
              </button>
            )}
          </div>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">تصویر</label>
          <div className="flex gap-1.5 mb-3 flex-wrap">
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
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
            label=""
            title={form.title}
            categoryName={categoryLabel}
            categorySlug={form.categorySlug}
            onModalOpenChange={setImageSearchModalOpen}
            displayMode={mediaTab}
            previewVariant="poster"
            enableMoviePosterSources={isFilm}
            metadata={form.metadata}
            onSwitchToUrlTab={() => setMediaTab('url')}
          />
        </div>

        <div>
          <label htmlFor="externalUrl" className="block text-sm font-semibold mb-1.5">
            لینک خارجی
          </label>
          <input
            id="externalUrl"
            type="url"
            value={form.externalUrl}
            onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            dir="ltr"
          />
        </div>

        {form.categorySlug && (
          <CatalogSearchProfilePanel
            catalogId={catalog.id}
            metadata={form.metadata}
            title={form.title}
            categorySlug={form.categorySlug}
            description={form.description}
            onProfileUpdated={(metadata) => setForm((p) => ({ ...p, metadata }))}
            onError={(msg) => setError(msg)}
          />
        )}

        {form.categorySlug && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMetadataOpen((open) => !open)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <span>
                اطلاعات تکمیلی {isFilm ? 'فیلم/سریال' : categoryLabel}
              </span>
              {metadataOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {metadataOpen && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                <DynamicMetadataFields
                  categorySlug={form.categorySlug}
                  metadata={form.metadata}
                  onChange={(metadata) => setForm((p) => ({ ...p, metadata }))}
                  hideTitle
                  layout="grid"
                />
                <ItemTipField
                  value={String(form.metadata.tip ?? '')}
                  onChange={(tip) =>
                    setForm((p) => ({
                      ...p,
                      metadata: {
                        ...p.metadata,
                        tip: tip.trim() || undefined,
                      },
                    }))
                  }
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.categorySlug}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50"
        >
          {loading ? 'در حال ذخیره…' : 'ذخیره و همگام‌سازی همهٔ لیست‌ها'}
        </button>
      </form>

      {showMovieModal && (
        <MovieSearchModal
          isOpen={showMovieModal}
          onClose={() => setShowMovieModal(false)}
          searchResults={movieResults}
          onSelectMovie={(movie) => void handleSelectMovie(movie)}
          isLoading={fetchingFromImdb}
        />
      )}
    </div>
  );
}
