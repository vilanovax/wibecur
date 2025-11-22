'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Link as LinkIcon, Search } from 'lucide-react';
import ImageSearchModal from '@/components/admin/items/ImageSearchModal';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  title?: string; // Title to pre-fill in Google Image Search
  categoryName?: string; // Category name to pre-fill in Google Image Search
  onModalOpenChange?: (isOpen: boolean) => void; // Callback when modal opens/closes
}

export default function ImageUpload({
  value,
  onChange,
  label = 'تصویر',
  title = '',
  categoryName = '',
  onModalOpenChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showImageSearch, setShowImageSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Close modal first, then update value to prevent any form submission
    setShowImageSearch(false);
    onModalOpenChange?.(false);
    // Use setTimeout to ensure modal closes before updating state
    setTimeout(() => {
      onChange(imageUrl);
    }, 100);
  };

  // Combine category name and title for search query
  const searchQuery = categoryName && title
    ? `${categoryName} ${title}`
    : title;

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
        initialQuery={searchQuery}
      />
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        // Show uploaded image
        <div className="relative">
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-contain"
              unoptimized={true}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="حذف تصویر"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Show upload options
        <div className="space-y-3">
          {/* Upload from file */}
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
                  <svg
                    className="animate-spin h-5 w-5 text-primary"
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

          {/* Or divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">یا</span>
            </div>
          </div>

          {/* URL input */}
          {showUrlInput ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                تأیید
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LinkIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">استفاده از لینک تصویر</span>
              </button>

              {/* Google Image Search */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImageSearch(true);
                  onModalOpenChange?.(true);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">جستجوی تصویر در Google 🔍</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
