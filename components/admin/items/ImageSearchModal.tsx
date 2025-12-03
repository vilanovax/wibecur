'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Search } from 'lucide-react';

interface GoogleImageResult {
  title: string;
  link: string;
  thumbnail: string;
  width: number;
  height: number;
  contextLink?: string;
}

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialQuery?: string;
}

export default function ImageSearchModal({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = '',
}: ImageSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<GoogleImageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<GoogleImageResult | null>(null);
  const [mounted, setMounted] = useState(false);

  // Update search query when modal opens with new initialQuery
  useEffect(() => {
    if (isOpen && initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('لطفاً عبارت جستجو را وارد کنید');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      // Try public API first, fallback to admin API
      const apiEndpoint = '/api/images/search';
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'خطا در جستجوی تصاویر');
      }

      const data = await res.json();
      
      // Handle both formats: { success, results } or { results }
      const results = data.success ? data.results : (data.results || []);
      setSearchResults(results);

      if (results.length === 0) {
        setError('هیچ تصویری یافت نشد');
      }
    } catch (err: any) {
      console.error('Error searching images:', err);
      setError(err.message || 'خطا در جستجوی تصاویر');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectImage = (image: GoogleImageResult) => {
    setSelectedImage(image);
  };

  const handleConfirmSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedImage) {
      onSelectImage(selectedImage.link);
      handleClose();
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSearchQuery('');
    setSearchResults([]);
    setSelectedImage(null);
    setError('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on backdrop, not on modal content
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  const handleImageClick = (image: GoogleImageResult, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectImage(image);
  };

  const modalContent = (
    <div 
      data-image-search-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">جستجوی تصویر در Google</h2>
          <button
            type="button"
            onClick={(e) => handleClose(e)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Form */}
        <form 
          onSubmit={handleSearch} 
          className="p-6 border-b border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثال: کتاب ارباب حلقه‌ها، رستوران سنتی، نقاشی مونالیزا"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  در حال جستجو...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  جستجو
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {searchResults.length} تصویر یافت شد - روی تصویر کلیک کنید
              </p>
              <div className="grid grid-cols-3 gap-4">
                {searchResults.map((image, index) => (
                  <div
                    key={index}
                    onClick={(e) => handleImageClick(image, e)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                      selectedImage === image
                        ? 'border-primary shadow-lg scale-[1.02]'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="relative w-full h-48 bg-gray-100">
                      <Image
                        src={image.thumbnail}
                        alt={image.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {image.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {image.width} × {image.height}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            !isSearching &&
            !error && (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">عبارت مورد نظر را جستجو کنید</p>
                <p className="text-sm mt-2">
                  مثال: &quot;کاور کتاب&quot;، &quot;لوگوی رستوران&quot;، &quot;تصویر محصول&quot;
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        {selectedImage && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary">
                  <Image
                    src={selectedImage.thumbnail}
                    alt="Selected"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    تصویر انتخاب شده
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {selectedImage.title}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => handleClose(e)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  تأیید و استفاده
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
