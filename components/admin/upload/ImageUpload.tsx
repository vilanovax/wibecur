'use client';

import { useState, useRef } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { IMAGE_UPLOAD_HINTS, MAX_RAW_UPLOAD_SIZE } from '@/lib/image-config';

export type ListImageUploadPurpose = 'list-cover' | 'list-horizontal' | 'category-hero' | 'avatar';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** نوع آپلود — تعیین پروفایل بهینه‌سازی در سرور */
  uploadPurpose?: ListImageUploadPurpose;
  /** نسبت پیش‌نمایش */
  previewVariant?: 'cover' | 'horizontal' | 'default';
  /** نمای فشرده برای فرم ویرایش */
  compact?: boolean;
}

const PURPOSE_HINT: Record<ListImageUploadPurpose, string> = {
  'list-cover': IMAGE_UPLOAD_HINTS.listCover,
  'list-horizontal': IMAGE_UPLOAD_HINTS.listHorizontal,
  'category-hero': IMAGE_UPLOAD_HINTS.categoryHero,
  avatar: IMAGE_UPLOAD_HINTS.avatar,
};

const PREVIEW_CLASS: Record<'cover' | 'horizontal' | 'default', string> = {
  cover: 'aspect-[4/3] max-h-44',
  horizontal: 'aspect-[21/9] max-h-36',
  default: 'h-64',
};

function CoverPreview({
  src,
  onRemove,
  compact,
  previewVariant = 'default',
}: {
  src: string;
  onRemove: () => void;
  compact?: boolean;
  previewVariant?: 'cover' | 'horizontal' | 'default';
}) {
  const [broken, setBroken] = useState(false);
  const aspectClass = compact
    ? PREVIEW_CLASS[previewVariant]
    : PREVIEW_CLASS[previewVariant === 'default' ? 'default' : previewVariant];

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-[var(--color-border-muted)] bg-[var(--color-bg)] ${
        compact ? aspectClass : aspectClass
      }`}
    >
      {!broken ? (
        <Image
          src={src}
          alt="کاور"
          fill
          className="object-cover"
          unoptimized
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] p-4 text-center">
          <ImageIcon className="w-8 h-8 opacity-40" />
          <p className="text-xs">تصویر بارگذاری نشد</p>
          <p className="text-[10px] font-mono truncate max-w-full opacity-60" dir="ltr">
            {src}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        aria-label="حذف تصویر"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ImageUpload({
  value,
  onChange,
  label = 'تصویر کاور',
  uploadPurpose = 'list-cover',
  previewVariant,
  compact = false,
}: ImageUploadProps) {
  const resolvedPreview =
    previewVariant ??
    (uploadPurpose === 'list-horizontal' || uploadPurpose === 'category-hero'
      ? 'horizontal'
      : uploadPurpose === 'list-cover'
        ? 'cover'
        : 'default');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadHint = PURPOSE_HINT[uploadPurpose];
  const maxMb = Math.round(MAX_RAW_UPLOAD_SIZE / (1024 * 1024));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) await uploadFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await uploadFile(e.target.files[0]);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }
    if (file.size > MAX_RAW_UPLOAD_SIZE) {
      alert(`حجم تصویر نباید بیشتر از ${maxMb} مگابایت باشد`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', uploadPurpose);

      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'خطا در آپلود تصویر');
      }
      onChange(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) onChange(urlInput.trim());
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      active
        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
    }`;

  const dropHeight =
    compact && resolvedPreview === 'horizontal'
      ? 'h-32'
      : compact
        ? 'h-36'
        : resolvedPreview === 'horizontal'
          ? 'h-40'
          : 'h-64';

  return (
    <div className="space-y-3" dir="rtl">
      {label ? (
        <label className="block text-sm font-medium text-[var(--color-text)]">{label}</label>
      ) : null}

      <div className="inline-flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-muted)]">
        <button type="button" onClick={() => setUploadMethod('upload')} className={tabClass(uploadMethod === 'upload')}>
          <Upload className="w-3 h-3 inline ml-1" />
          آپلود
        </button>
        <button type="button" onClick={() => setUploadMethod('url')} className={tabClass(uploadMethod === 'url')}>
          <LinkIcon className="w-3 h-3 inline ml-1" />
          لینک
        </button>
      </div>

      {uploadMethod === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileInput}
            className="hidden"
            id={`file-upload-${uploadPurpose}`}
          />

          {!value ? (
            <label
              htmlFor={`file-upload-${uploadPurpose}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full ${dropHeight} border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)]'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs text-[var(--color-text-muted)]">در حال بهینه‌سازی و آپلود...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-[var(--color-text-muted)] mb-2 opacity-60" />
                  <p className="text-xs text-[var(--color-text)]">
                    <span className="font-semibold">کلیک</span> یا کشیدن تصویر
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 px-4 text-center leading-relaxed">
                    {uploadHint}
                  </p>
                </>
              )}
            </label>
          ) : (
            <CoverPreview
              src={value}
              onRemove={handleRemove}
              compact={compact}
              previewVariant={resolvedPreview}
            />
          )}
        </div>
      )}

      {uploadMethod === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleUrlSubmit}
              placeholder="https://..."
              dir="ltr"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]/30"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-sm hover:opacity-90"
            >
              تایید
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            {uploadPurpose === 'category-hero'
              ? 'با ذخیره دسته، تصویر از URL دانلود، بهینه و در ParsPack ذخیره می‌شود.'
              : 'با ذخیره لیست، تصویر از URL دانلود، بهینه و در ParsPack ذخیره می‌شود.'}
          </p>
          {value && (
            <CoverPreview
              src={value}
              onRemove={handleRemove}
              compact={compact}
              previewVariant={resolvedPreview}
            />
          )}
        </div>
      )}
    </div>
  );
}
