'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Link as LinkIcon, Search } from 'lucide-react';
import ImageSearchModal from '@/components/admin/items/ImageSearchModal';
import MoviePosterSearchModal from '@/components/admin/items/MoviePosterSearchModal';
import type { MoviePosterSearchSource } from '@/lib/movie-poster-search';
import {
  buildGoogleImageSearchQuery,
  buildMoviePosterSearchQuery,
} from '@/lib/item-image-search-query';

export type ImageUploadDisplayMode = 'upload' | 'url' | 'search' | 'all';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  title?: string; // Title to pre-fill in Google Image Search
  categoryName?: string; // Category name to pre-fill in Google Image Search
  onModalOpenChange?: (isOpen: boolean) => void; // Callback when modal opens/closes
  /** When set, only one method is shown (for tabbed UI). Default 'all' shows all options. */
  displayMode?: ImageUploadDisplayMode;
  /** poster = نسبت عمودی مناسب کاور فیلم */
  previewVariant?: 'default' | 'poster';
  /** دکمه‌های جستجو در IMDb و TMDb (برای آیتم فیلم) */
  enableMoviePosterSources?: boolean;
  metadata?: Record<string, unknown> | null;
  /** slug دسته — برای ساخت عبارت Google */
  categorySlug?: string | null;
}

export default function ImageUpload({
  value,
  onChange,
  label = 'تصویر',
  title = '',
  categoryName = '',
  onModalOpenChange,
  displayMode = 'all',
  previewVariant = 'default',
  enableMoviePosterSources = false,
  metadata = null,
  categorySlug = null,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(displayMode === 'url');
  const [urlInput, setUrlInput] = useState('');
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [moviePosterSource, setMoviePosterSource] = useState<MoviePosterSearchSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showUpload = displayMode === 'all' || displayMode === 'upload';
  const showUrl = displayMode === 'all' || displayMode === 'url';
  const showSearch = displayMode === 'all' || displayMode === 'search';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('خطا در آپلود تصویر');
      }

      const data = await res.json();
      onChange(data.url);
    } catch (error: any) {
      alert(error.message || 'خطا در آپلود تصویر');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const handleImageSelected = (imageUrl: string) => {
    setShowImageSearch(false);
    onModalOpenChange?.(false);
    setTimeout(() => {
      onChange(imageUrl);
    }, 100);
  };

  const handlePosterFromMovieSource = async (posterUrl: string) => {
    setMoviePosterSource(null);
    onModalOpenChange?.(false);

    let finalUrl = posterUrl;
    try {
      const uploadRes = await fetch('/api/admin/items/upload-movie-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posterUrl }),
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.uploadedUrl) finalUrl = uploadData.uploadedUrl;
      }
    } catch {
      // keep original poster URL
    }

    setTimeout(() => onChange(finalUrl), 100);
  };

  const openMoviePosterSearch = (source: MoviePosterSearchSource) => {
    setMoviePosterSource(source);
    onModalOpenChange?.(true);
  };

  const googleSearchQuery = buildGoogleImageSearchQuery({
    title,
    categoryName,
    categorySlug,
  });
  const moviePosterSearchQuery = buildMoviePosterSearchQuery(title, metadata);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearch}
        onClose={() => {
          setShowImageSearch(false);
          onModalOpenChange?.(false);
        }}
        onSelectImage={handleImageSelected}
        initialQuery={googleSearchQuery}
      />
      {moviePosterSource && (
        <MoviePosterSearchModal
          isOpen={Boolean(moviePosterSource)}
          source={moviePosterSource}
          onClose={() => {
            setMoviePosterSource(null);
            onModalOpenChange?.(false);
          }}
          onSelectPoster={handlePosterFromMovieSource}
          initialQuery={moviePosterSearchQuery}
          metadata={metadata}
          year={metadata?.year as number | string | null | undefined}
        />
      )}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative">
          <div
            className={`relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900 ${
              previewVariant === 'poster' ? 'aspect-[2/3] max-h-[420px] mx-auto' : 'h-64'
            }`}
          >
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className={previewVariant === 'poster' ? 'object-cover' : 'object-contain'}
              unoptimized={true}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg backdrop-blur-sm"
            title="حذف تصویر"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-center text-gray-500 mt-2">
            برای تغییر، تصویر را حذف کنید یا تب دیگری انتخاب کنید
          </p>
        </div>
      ) : (
        // Show upload options (filtered by displayMode)
        <div className="space-y-3">
          {showUpload && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-gray-600">در حال آپلود...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-600">آپلود از کامپیوتر</span>
                  </>
                )}
              </label>
            </div>
          )}

          {showUpload && (showUrl || showSearch) && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">یا</span></div>
            </div>
          )}

          {showUrl && (
            showUrlInput || displayMode === 'url' ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
                />
                <button type="button" onClick={handleUrlSubmit} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">تأیید</button>
                {displayMode === 'all' && (
                  <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput(''); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">انصراف</button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowUrlInput(true); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LinkIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">استفاده از لینک تصویر</span>
              </button>
            )
          )}

          {showSearch && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImageSearch(true);
                  onModalOpenChange?.(true);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600 dark:text-gray-300">جستجو در Google</span>
              </button>
              {enableMoviePosterSources && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openMoviePosterSearch('imdb');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors text-sm font-medium text-amber-900 dark:text-amber-200"
                  >
                    <span className="font-bold text-xs bg-amber-400 text-black px-1.5 py-0.5 rounded">IMDb</span>
                    جستجوی poster
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openMoviePosterSearch('tmdb');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-colors text-sm font-medium text-sky-900 dark:text-sky-200"
                  >
                    <span className="font-bold text-xs bg-sky-500 text-white px-1.5 py-0.5 rounded">TMDb</span>
                    جستجوی poster
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
