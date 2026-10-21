'use client';

import { useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOff } from 'lucide-react';
import { fa, faNumber } from '@/lib/utils';
import { MEDIA_KIND_LABELS, type MediaKind, type MediaSlot } from '@/lib/admin/media-targets';

const UPLOAD_PURPOSE: Record<Exclude<MediaKind, 'banner'>, string> = {
  category: 'category-hero',
  list: 'list-cover',
  'list-banner': 'list-horizontal',
  catalog: 'item',
  item: 'item',
  person: 'people',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${faNumber(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNumber(Math.round(bytes / 1024))} کیلوبایت`;
  return `${fa((bytes / (1024 * 1024)).toFixed(1).replace('.', '٫'))} مگابایت`;
}

export default function MediaSlotRow({
  slot,
  layout = 'list',
}: {
  slot: MediaSlot;
  layout?: 'list' | 'grid';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [width, setWidth] = useState(slot.width);
  const [height, setHeight] = useState(slot.height);
  const [bytes, setBytes] = useState(slot.bytes);

  async function replaceFile(file: File) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (slot.kind === 'banner') {
        const form = new FormData();
        form.set('id', slot.id);
        form.set('file', file);
        const response = await fetch('/api/admin/media', { method: 'POST', body: form });
        const data = (await response.json()) as { error?: string; bytes?: number; width?: number; height?: number };
        if (!response.ok) throw new Error(data.error || 'جایگزینی بنر انجام نشد.');
        if (data.bytes) setBytes(data.bytes);
        if (data.width) setWidth(data.width);
        if (data.height) setHeight(data.height);
      } else {
        const form = new FormData();
        form.set('file', file);
        form.set('purpose', UPLOAD_PURPOSE[slot.kind]);
        const uploaded = await fetch('/api/admin/upload', { method: 'POST', body: form });
        const fileData = (await uploaded.json()) as {
          error?: string;
          url?: string;
          optimized?: { bytes?: number; width?: number; height?: number };
        };
        if (!uploaded.ok || !fileData.url) throw new Error(fileData.error || 'آپلود انجام نشد.');
        const saved = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'assign',
            kind: slot.kind,
            id: slot.id,
            detail: slot.detail,
            url: fileData.url,
          }),
        });
        const savedData = (await saved.json()) as { error?: string };
        if (!saved.ok) throw new Error(savedData.error || 'ذخیرهٔ تصویر انجام نشد.');
        if (fileData.optimized?.bytes) setBytes(fileData.optimized.bytes);
        if (fileData.optimized?.width) setWidth(fileData.optimized.width);
        if (fileData.optimized?.height) setHeight(fileData.optimized.height);
      }
      setMessage('تصویر جایگزین شد.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'جایگزینی انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function clearSlot() {
    const confirmed = window.confirm(`تصویر «${slot.title}» از این بخش برداشته شود؟`);
    if (!confirmed) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'clear', kind: slot.kind, id: slot.id, detail: slot.detail }),
      });
      const data = (await response.json()) as { error?: string; sharedRemaining?: number };
      if (!response.ok) throw new Error(data.error || 'حذف انجام نشد.');
      const shared = data.sharedRemaining ?? 0;
      setMessage(
        shared > 0
          ? `از این بخش برداشته شد. همین فایل هنوز در ${faNumber(shared)} جای دیگر هست.`
          : 'از این بخش برداشته شد.'
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  const sizeLabel = !slot.imageUrl
    ? 'بدون تصویر'
    : width && height
      ? `${faNumber(width)}×${faNumber(height)}`
      : 'اندازه بعد از نمایش';
  const bytesLabel = !slot.imageUrl ? '' : bytes != null ? formatBytes(bytes) : 'حجم نامشخص';
  const inputId = `media-file-${slot.kind}-${slot.id}`;
  const grid = layout === 'grid';

  function onImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    if (image.naturalWidth > 0) setWidth(image.naturalWidth);
    if (image.naturalHeight > 0) setHeight(image.naturalHeight);
  }

  const preview = slot.previewUrl ? (
    <img
      src={slot.previewUrl}
      alt=""
      width={grid ? width || 640 : 64}
      height={grid ? height || 640 : 64}
      className={grid ? 'size-full object-cover' : 'size-16 object-cover'}
      onLoad={onImageLoad}
    />
  ) : (
    <div
      className={`flex items-center justify-center text-[var(--color-text-muted)] ${grid ? 'size-full' : 'size-16'}`}
    >
      <ImageOff className="size-5" strokeWidth={1.5} aria-hidden />
    </div>
  );

  const meta = (
    <>
      <p className="truncate text-sm font-semibold text-[var(--color-text)]">{slot.title}</p>
      <p className="truncate text-xs text-[var(--color-text-muted)]">
        {MEDIA_KIND_LABELS[slot.kind]}
        {slot.detail ? (
          <>
            {' · '}
            <span dir="ltr">{slot.detail}</span>
          </>
        ) : null}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        {bytesLabel ? `${sizeLabel} · ${bytesLabel}` : sizeLabel}
      </p>
      {message ? <p className="text-xs text-[var(--color-text)]">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </>
  );

  const actions = (
    <div className={grid ? 'mt-auto flex flex-col gap-2 pt-2' : 'mt-2 flex flex-wrap items-center gap-2'}>
      <label
        htmlFor={inputId}
        className={`inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-[var(--primary)] px-3 text-sm font-semibold text-white ${
          grid ? 'justify-center' : ''
        }`}
      >
        {busy ? 'در حال ذخیره' : 'جایگزینی'}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void replaceFile(file);
          }}
        />
      </label>
      {slot.canClear || slot.editHref ? (
        <div className={grid ? 'flex flex-col gap-2' : 'contents'}>
          {slot.canClear ? (
            <button
              type="button"
              onClick={() => void clearSlot()}
              disabled={busy || !slot.imageUrl}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--color-text-muted)] disabled:opacity-40 ${
                grid ? 'justify-center border border-[var(--color-border)]' : ''
              }`}
            >
              حذف از اینجا
            </button>
          ) : null}
          {slot.editHref ? (
            <Link
              href={slot.editHref}
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--color-text)] ${
                grid ? 'justify-center border border-[var(--color-border)]' : ''
              }`}
            >
              ویرایش رکورد
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (grid) {
    return (
      <article className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="aspect-square bg-[var(--color-bg)]">{preview}</div>
        <div className="flex min-h-0 flex-1 flex-col gap-1 p-3">
          {meta}
          {actions}
        </div>
      </article>
    );
  }

  return (
    <article className="flex gap-3 bg-[var(--color-surface)] p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-bg)]">{preview}</div>
      <div className="min-w-0 flex-1">
        {meta}
        {actions}
      </div>
    </article>
  );
}
