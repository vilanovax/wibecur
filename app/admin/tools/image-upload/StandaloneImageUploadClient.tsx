'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Upload } from 'lucide-react';
import { MAX_RAW_UPLOAD_SIZE } from '@/lib/image-config';
import { getDisplayImageUrl } from '@/lib/display-image';

const maxMb = Math.max(1, Math.round(MAX_RAW_UPLOAD_SIZE / (1024 * 1024)));

export default function StandaloneImageUploadClient() {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    setCopied(false);

    const mime = (file.type || '').toLowerCase();
    if (mime && !mime.startsWith('image/') && mime !== 'application/octet-stream') {
      setError('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }
    if (file.size > MAX_RAW_UPLOAD_SIZE) {
      setError(`حجم تصویر نباید بیشتر از ${maxMb} مگابایت باشد`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'item');

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (res.status === 413) {
        throw new Error(
          `حجم فایل برای سرور زیاد است (حداکثر حدود ${maxMb}MB). تصویر را کوچک‌تر یا به‌صورت WebP/JPG ذخیره کنید.`
        );
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' && data.error ? data.error : 'خطا در آپلود تصویر'
        );
      }
      if (typeof data.url !== 'string' || !data.url) {
        throw new Error('پاسخ آپلود لینک معتبری نداشت');
      }
      setUrl(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در آپلود');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('کپی در کلیپ‌بورد ممکن نشد؛ لینک را دستی انتخاب کن');
    }
  };

  const preview = url ? getDisplayImageUrl(url) || url : '';

  return (
    <div className="space-y-4 rounded-2xl border border-(--color-border-muted) bg-(--color-surface) p-5 shadow-(--shadow-card)">
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-(--color-border) bg-(--color-bg)/40 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = '';
            void handleFile(file);
          }}
        />
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        ) : (
          <Upload className="size-8 text-wibe-secondary" aria-hidden />
        )}
        <span className="text-sm font-semibold text-(--color-text)">
          {uploading ? 'در حال آپلود…' : 'انتخاب تصویر'}
        </span>
        <span className="text-xs text-wibe-secondary">حداکثر {maxMb} مگابایت</span>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {url ? (
        <div className="space-y-3">
          {preview ? (
            <div className="overflow-hidden rounded-xl border border-(--color-border-muted) bg-(--color-bg)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="mx-auto max-h-64 w-auto object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={url}
              className="min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-xs text-(--color-text)"
              onFocus={(e) => e.target.select()}
              aria-label="لینک تصویر"
            />
            <button
              type="button"
              onClick={() => void copyUrl()}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              {copied ? (
                <>
                  <Check className="size-4" aria-hidden />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden />
                  کپی لینک
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
