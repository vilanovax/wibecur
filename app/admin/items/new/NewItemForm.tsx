'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lists, categories } from '@prisma/client';
import ImageUpload from '@/components/admin/shared/ImageUpload';
import DynamicMetadataFields from '@/components/admin/items/DynamicMetadataFields';
import MovieSearchModal from '@/components/admin/items/MovieSearchModal';

type ListWithCategory = lists & {
  categories: categories | null;
};

interface NewItemFormProps {
  lists: ListWithCategory[];
  initialListId?: string;
}

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
  const [moviePlot, setMoviePlot] = useState<string>(''); // Store plot for AI

  const selectedList = lists.find((l) => l.id === formData.listId);

  // Prevent form submission when modal is open
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleSubmit = (e: SubmitEvent) => {
      // Check if image search modal is open (check DOM for modal existence)
      const modal = document.querySelector('[data-image-search-modal]');
      if (modal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    form.addEventListener('submit', handleSubmit as any, true);

    return () => {
      form.removeEventListener('submit', handleSubmit as any, true);
    };
  }, [imageSearchModalOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
        // Try to parse error response
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

      // Show modal with multiple results
      setMovieResults(data.results || []);
      setShowMovieModal(true);
    } catch (err: any) {
      console.error('Error fetching movie data:', err);
      setError(err.message || 'خطای ناشناخته در دریافت اطلاعات');
    } finally {
      setFetchingFromImdb(false);
    }
  };

  const handleSelectMovie = async (movie: any) => {
    // Upload poster to Liara if needed
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
            console.log('✅ تصویر با موفقیت در سرور ایرانی آپلود شد');
          }
        }
      } catch (error) {
        console.warn('Failed to upload to Liara, using original URL');
      }
    }

    // Store plot for AI generation
    if (movie.plot) {
      setMoviePlot(movie.plot);
    }

    // Fill form with selected movie data
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
          plot: moviePlot || undefined, // Send plot if available
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در تولید توضیحات');
      }

      // Update description and metadata if AI provided them
      setFormData((prev) => ({
        ...prev,
        description: data.description,
        metadata: data.metadata
          ? {
              ...prev.metadata,
              ...data.metadata,
            }
          : prev.metadata,
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
    
    // Double check - prevent submission if modal is open
    const modal = document.querySelector('[data-image-search-modal]');
    if (modal) {
      console.warn('Form submission prevented: Image search modal is open');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create item');
      }

      router.push(`/admin/items?listId=${formData.listId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Movie Search Modal */}
      <MovieSearchModal
        isOpen={showMovieModal}
        onClose={() => setShowMovieModal(false)}
        searchResults={movieResults}
        onSelectMovie={handleSelectMovie}
        isLoading={fetchingFromImdb}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">افزودن آیتم جدید</h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedList && (
              <>
                به لیست: {selectedList.categories?.icon || '📋'} {selectedList.title}
              </>
            )}
          </p>
        </div>
        <Link
          href={`/admin/items${initialListId ? `?listId=${initialListId}` : ''}`}
          className="text-gray-600 hover:text-gray-900"
        >
          ← بازگشت
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="bg-white rounded-xl shadow-sm p-6 space-y-6"
        onKeyDown={(e) => {
          // Prevent Enter key from submitting when modal might be open
          if (e.key === 'Enter') {
            const modal = document.querySelector('[data-image-search-modal]');
            if (modal) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }}
      >
        {/* List Selection */}
        <div>
          <label htmlFor="listId" className="block text-sm font-medium text-gray-700 mb-2">
            لیست <span className="text-red-500">*</span>
          </label>
          <select
            id="listId"
            name="listId"
            required
            value={formData.listId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                 {list.categories?.icon || '📋'} {list.title}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              عنوان <span className="text-red-500">*</span>
            </label>
             {(selectedList?.categories?.slug === 'movie' || selectedList?.categories?.slug === 'film' || selectedList?.categories?.slug === 'movies') && (
              <button
                type="button"
                onClick={handleFetchFromImdb}
                disabled={fetchingFromImdb || !formData.title.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title={!formData.title.trim() ? 'ابتدا عنوان فیلم را وارد کنید' : 'دریافت اطلاعات از TMDb/IMDb و آپلود تصویر'}
              >
                {fetchingFromImdb ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال دریافت...
                  </>
                ) : (
                  <>
                    ⭐ دریافت اطلاعات فیلم
                  </>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="عنوان آیتم..."
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              توضیحات (اختیاری)
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDesc || !formData.title.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title={!formData.title.trim() ? 'ابتدا عنوان را وارد کنید' : 'تولید توضیحات با هوش مصنوعی'}
            >
              {generatingDesc ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال تولید...
                </>
              ) : (
                <>
                  ✨ تولید با هوش مصنوعی
                </>
              )}
            </button>
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="توضیحات آیتم... (یا از دکمه تولید خودکار استفاده کنید)"
          />
        </div>

        {/* Image Upload */}
        <ImageUpload
          value={formData.imageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          label="تصویر آیتم (اختیاری)"
          title={formData.title}
           categoryName={selectedList?.categories?.name}
          onModalOpenChange={setImageSearchModalOpen}
        />

        {/* External URL */}
        <div>
          <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700 mb-2">
            لینک خارجی (اختیاری)
            <span className="text-gray-500 text-xs mr-2">
              برای اطلاعات بیشتر، خرید، دانلود و...
            </span>
          </label>
          <input
            type="url"
            id="externalUrl"
            name="externalUrl"
            value={formData.externalUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        {/* Dynamic Metadata Fields */}
        {selectedList && selectedList.categories?.slug && (
          <div className="border-t border-gray-200 pt-6">
            <DynamicMetadataFields
              categorySlug={selectedList.categories.slug}
              metadata={formData.metadata}
              onChange={(metadata) =>
                setFormData((prev) => ({ ...prev, metadata }))
              }
            />
          </div>
        )}

        {/* Comment Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات کامنت</h3>
          
          {/* Comments Enabled */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="commentsEnabled"
              checked={formData.commentsEnabled}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, commentsEnabled: e.target.checked }))
              }
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="commentsEnabled" className="mr-2 text-sm font-medium text-gray-700">
              فعال بودن کامنت‌ها برای این آیتم
            </label>
          </div>
          <p className="text-xs text-gray-500 mb-4 mr-6">
            اگر غیرفعال باشد، کامنت‌ها برای این آیتم غیرفعال می‌شود (اولویت بالاتر از تنظیمات دسته‌بندی)
          </p>

          {/* Max Comments */}
          <div>
            <label htmlFor="maxComments" className="block text-sm font-medium text-gray-700 mb-2">
              حداکثر تعداد کامنت
            </label>
            <input
              type="number"
              id="maxComments"
              name="maxComments"
              min="1"
              value={formData.maxComments ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxComments: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="بدون محدودیت (خالی بگذارید)"
            />
            <p className="text-xs text-gray-500 mt-1">
              حداکثر تعداد کامنتی که می‌توان برای این آیتم ثبت کرد. اگر خالی بگذارید، از تنظیمات پیش‌فرض استفاده می‌شود.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد آیتم'}
          </button>
          <Link
            href={`/admin/items${initialListId ? `?listId=${initialListId}` : ''}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            انصراف
          </Link>
        </div>
      </form>
    </>
  );
}
