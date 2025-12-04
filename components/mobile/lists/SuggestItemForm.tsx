'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Loader2, Image as ImageIcon, Sparkles, Film, Search } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import DynamicMetadataFields from '@/components/admin/items/DynamicMetadataFields';
import MovieSearchModal from '@/components/admin/items/MovieSearchModal';
import ImageSearchModal from '@/components/admin/items/ImageSearchModal';

interface SuggestItemFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface List {
  id: string;
  title: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
}

interface MovieResult {
  id: string;
  source: 'tmdb' | 'omdb';
  title: string;
  originalTitle?: string;
  year: number | null;
  genre: string | null;
  director?: string | null;
  rating: string | number | null;
  plot: string | null;
  posterUrl: string | null;
  backdropUrl?: string | null;
  imdbID?: string;
}

export default function SuggestItemForm({ isOpen, onClose }: SuggestItemFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    externalUrl: '',
    listId: '',
    metadata: {} as any,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [fetchingFromImdb, setFetchingFromImdb] = useState(false);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieResults, setMovieResults] = useState<MovieResult[]>([]);
  const [moviePlot, setMoviePlot] = useState<string>('');
  const [imageSearchModalOpen, setImageSearchModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const selectedList = useMemo(
    () => lists.find((l) => l.id === formData.listId),
    [lists, formData.listId]
  );

  const filteredLists = useMemo(
    () => lists.filter((l) => l.categories.id === selectedCategoryId),
    [lists, selectedCategoryId]
  );

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchLists();
    } else {
      setLists([]);
      setFormData((prev) => ({ ...prev, listId: '', metadata: {} }));
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (filteredLists.length > 0 && !formData.listId) {
      setFormData((prev) => ({ ...prev, listId: filteredLists[0].id }));
    } else if (filteredLists.length > 0 && formData.listId) {
      // Check if current listId is still valid
      const currentList = filteredLists.find((l) => l.id === formData.listId);
      if (!currentList) {
        setFormData((prev) => ({ ...prev, listId: filteredLists[0].id }));
      }
    } else if (filteredLists.length === 0) {
      setFormData((prev) => ({ ...prev, listId: '', metadata: {} }));
    }
  }, [filteredLists, formData.listId]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { fetchWithCache } = await import('@/lib/utils/cache-client');
      const data = await fetchWithCache<{ success: boolean; data: Category[] }>(
        '/api/categories',
        {},
        60 * 60 * 1000 // 1 hour cache for categories (they change rarely)
      );
      if (data.success) {
        setCategories(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedCategoryId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchLists = async () => {
    if (!selectedCategoryId) return;
    
    setIsLoadingLists(true);
    try {
      const { fetchWithCache } = await import('@/lib/utils/cache-client');
      const data = await fetchWithCache<{ success: boolean; data: List[] }>(
        '/api/lists/public',
        {},
        30 * 60 * 1000, // 30 minutes cache for lists
        { categoryId: selectedCategoryId }
      );
      if (data.success) {
        setLists(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'categoryId') {
      setSelectedCategoryId(value);
      setFormData((prev) => ({ ...prev, listId: '', metadata: {} }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, listId: e.target.value, metadata: {} }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم فایل باید کمتر از 5 مگابایت باشد');
      return;
    }

    setError('');
    setIsUploadingImage(true);

    try {
      // Upload file to server
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToUpload,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'خطا در آپلود تصویر');
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود تصویر');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFetchFromImdb = async () => {
    if (!formData.title.trim()) {
      setError('لطفاً ابتدا عنوان فیلم را وارد کنید');
      return;
    }

    setFetchingFromImdb(true);
    setError('');

    try {
      const res = await fetch('/api/items/fetch-movie-data', {
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

  const handleSelectMovie = async (movie: MovieResult) => {
    // Update form data with movie information
    setFormData((prev) => ({
      ...prev,
      title: movie.title,
      description: prev.description || '',
      imageUrl: movie.posterUrl || prev.imageUrl,
      metadata: {
        ...prev.metadata,
        year: movie.year || prev.metadata?.year,
        genre: movie.genre || prev.metadata?.genre,
        director: movie.director || prev.metadata?.director,
        imdbRating: movie.rating ? String(movie.rating) : prev.metadata?.imdbRating,
      },
    }));

    // Store plot for AI description generation
    if (movie.plot) {
      setMoviePlot(movie.plot);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      setError('لطفاً ابتدا عنوان را وارد کنید');
      return;
    }

    if (!selectedList?.categories.slug) {
      setError('لطفاً ابتدا دسته و لیست را انتخاب کنید');
      return;
    }

    setGeneratingDesc(true);
    setError('');

    try {
      const res = await fetch('/api/items/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          categorySlug: selectedList.categories.slug,
          metadata: formData.metadata,
          plot: moviePlot || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
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
    setError('');

    if (!formData.title.trim()) {
      setError('عنوان الزامی است');
      return;
    }

    if (!formData.listId) {
      setError('لطفاً یک لیست انتخاب کنید');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/suggestions/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          externalUrl: formData.externalUrl,
          listId: formData.listId,
          metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت پیشنهاد');
      }

      setToastMessage(data.message || 'پیشنهاد شما با موفقیت ثبت شد');
      setShowToast(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        externalUrl: '',
        listId: '',
        metadata: {},
      });
      setSelectedCategoryId(categories.length > 0 ? categories[0].id : '');
      setMoviePlot('');

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setShowToast(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت پیشنهاد');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isMovieCategory = selectedCategory?.slug === 'movie' || 
                          selectedCategory?.slug === 'film' || 
                          selectedCategory?.slug === 'movies';

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

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={imageSearchModalOpen}
        onClose={() => setImageSearchModalOpen(false)}
        onSelectImage={(imageUrl) => {
          setFormData((prev) => ({ ...prev, imageUrl }));
          setImageSearchModalOpen(false);
        }}
        initialQuery={formData.title.trim() || ''}
      />

      <BottomSheet isOpen={isOpen} onClose={onClose} title="پیشنهاد آیتم">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دسته‌بندی <span className="text-red-500">*</span>
              </label>
              {isLoadingCategories ? (
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                  در حال بارگذاری دسته‌بندی‌ها...
                </div>
              ) : (
                <select
                  name="categoryId"
                  value={selectedCategoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value="">یک دسته انتخاب کنید</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* List Selection */}
            {selectedCategoryId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  انتخاب لیست <span className="text-red-500">*</span>
                </label>
                {isLoadingLists ? (
                  <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                    در حال بارگذاری لیست‌ها...
                  </div>
                ) : filteredLists.length === 0 ? (
                  <div className="px-4 py-3 border border-gray-300 rounded-lg bg-yellow-50 text-center text-yellow-700">
                    هیچ لیستی برای این دسته‌بندی یافت نشد
                  </div>
                ) : (
                  <select
                    name="listId"
                    value={formData.listId}
                    onChange={handleListChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                  >
                    <option value="">یک لیست انتخاب کنید</option>
                    {filteredLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.categories.icon} {list.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  عنوان <span className="text-red-500">*</span>
                </label>
                {isMovieCategory && (
                  <button
                    type="button"
                    onClick={handleFetchFromImdb}
                    disabled={fetchingFromImdb || !formData.title.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="جستجو از TMDb/IMDb"
                  >
                    {fetchingFromImdb ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Film className="w-3 h-3" />
                    )}
                    جستجو
                  </button>
                )}
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="عنوان آیتم را وارد کنید"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  توضیحات
                </label>
                {selectedList && (
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDesc || !formData.title.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingDesc ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    تولید با AI
                  </button>
                )}
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                placeholder="توضیحات آیتم (اختیاری)"
              />
            </div>

            {/* Dynamic Metadata Fields */}
            {selectedList && selectedList.categories.slug && (
              <div className="border-t border-gray-200 pt-4">
                <DynamicMetadataFields
                  categorySlug={selectedList.categories.slug}
                  metadata={formData.metadata}
                  onChange={(metadata) =>
                    setFormData((prev) => ({ ...prev, metadata }))
                  }
                />
              </div>
            )}

            {/* Image Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  تصویر آیتم
                </label>
                <button
                  type="button"
                  onClick={() => setImageSearchModalOpen(true)}
                  disabled={!formData.title.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!formData.title.trim() ? 'ابتدا عنوان آیتم را وارد کنید' : 'جستجوی تصویر از Google'}
                >
                  <Search className="w-3 h-3" />
                  جستجو از Google
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!formData.imageUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                      <span className="text-sm text-gray-700">در حال آپلود...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">انتخاب تصویر از گالری</span>
                      <span className="text-xs text-gray-500">فرمت‌های مجاز: JPG, PNG, GIF (حداکثر 5 مگابایت)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      aria-label="حذف تصویر"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                        <span className="text-sm text-gray-700">در حال آپلود...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">تغییر تصویر</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* External URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لینک خارجی
              </label>
              <input
                type="url"
                name="externalUrl"
                value={formData.externalUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="https://example.com (اختیاری)"
              />
            </div>
          </div>

          {/* Footer with Submit Button */}
          <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    ثبت پیشنهاد
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </BottomSheet>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={5000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
