'use client';

import { useState, useRef } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

interface AvatarUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onUpdate: () => void;
}

export default function AvatarUploadForm({
  isOpen,
  onClose,
  currentAvatar,
  onUpdate,
}: AvatarUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('لطفاً یک فایل تصویری انتخاب کنید');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم فایل باید کمتر از 5 مگابایت باشد');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
      let imageUrlToSend = '';

      if (uploadMethod === 'file' && selectedFile) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        imageUrlToSend = base64;
      } else if (uploadMethod === 'url' && imageUrl.trim()) {
        imageUrlToSend = imageUrl.trim();
      } else {
        setError('لطفاً یک تصویر انتخاب کنید یا آدرس تصویر را وارد کنید');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: imageUrlToSend }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در آپلود آواتار');
      }

      onUpdate();
      onClose();
      setImageUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود آواتار');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    setUploadMethod('file');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="تغییر آواتار" maxHeight="85vh">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {currentAvatar && !previewUrl && (
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 ring-4 ring-gray-100">
                <img
                  src={currentAvatar}
                  alt="آواتار فعلی"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Method Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadMethod('file');
                setImageUrl('');
                setSelectedFile(null);
                setPreviewUrl(null);
                setError('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'file'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ImageIcon className="w-4 h-4 inline ml-2" />
              از گالری
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMethod('url');
                setSelectedFile(null);
                setPreviewUrl(null);
                setError('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'url'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline ml-2" />
              از آدرس
            </button>
          </div>

          {uploadMethod === 'file' ? (
            <div>
              <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-2">
                انتخاب تصویر از گالری
              </label>
              <input
                ref={fileInputRef}
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-gray-600 font-medium"
              >
                <ImageIcon className="w-5 h-5 inline ml-2" />
                {selectedFile ? selectedFile.name : 'انتخاب فایل'}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                فرمت‌های مجاز: JPG, PNG, GIF (حداکثر 5 مگابایت)
              </p>
              {previewUrl && (
                <div className="mt-4 flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 ring-4 ring-gray-100">
                    <img
                      src={previewUrl}
                      alt="پیش‌نمایش"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                آدرس تصویر
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-2 text-xs text-gray-500">
                آدرس کامل تصویر آواتار خود را وارد کنید
              </p>
              {imageUrl && (
                <div className="mt-4 flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 ring-4 ring-gray-100">
                    <img
                      src={imageUrl}
                      alt="پیش‌نمایش"
                      className="w-full h-full object-cover"
                      onError={() => setError('آدرس تصویر نامعتبر است')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Buttons at Bottom - OUTSIDE scrollable area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isLoading}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading || (uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !imageUrl.trim())}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  ذخیره آواتار
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}
