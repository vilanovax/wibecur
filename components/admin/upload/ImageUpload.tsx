'use client';

import { useState, useRef } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** cover → پوشه covers در آپلود */
  uploadPurpose?: 'cover' | 'avatar';
  /** نمای فشرده برای فرم ویرایش */
  compact?: boolean;
}

function CoverPreview({
  src,
  onRemove,
  compact,
}: {
  src: string;
  onRemove: () => void;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-[var(--color-border-muted)] bg-[var(--color-bg)] ${
        compact ? 'aspect-[16/10] max-h-40' : 'h-64'
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
  uploadPurpose = 'cover',
  compact = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (uploadPurpose === 'cover') formData.append('purpose', 'cover');

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('خطا در آپلود تصویر');
      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.');
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
    fileInputRef.current && (fileInputRef.current.value = '');
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      active
        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
    }`;

  const dropHeight = compact ? 'h-36' : 'h-64';

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
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />

          {!value ? (
            <label
              htmlFor="file-upload"
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
                  <p className="text-xs text-[var(--color-text-muted)]">در حال آپلود...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-[var(--color-text-muted)] mb-2 opacity-60" />
                  <p className="text-xs text-[var(--color-text)]">
                    <span className="font-semibold">کلیک</span> یا کشیدن تصویر
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">PNG, JPG تا 5MB</p>
                </>
              )}
            </label>
          ) : (
            <CoverPreview src={value} onRemove={handleRemove} compact={compact} />
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
          {value && <CoverPreview src={value} onRemove={handleRemove} compact={compact} />}
        </div>
      )}
    </div>
  );
}
