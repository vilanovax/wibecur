'use client';

import { useState } from 'react';
import { getDisplayImageUrl } from '@/lib/display-image';
import type { ImageFolder } from '@/lib/object-storage';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  /** نسبت placeholder وقتی تصویر خطا داد: cover (۱۶:۸) یا square (۱:۱) */
  placeholderSize?: 'cover' | 'square';
  /** برای تصاویر بالای صفحه (Hero و Featured): اولویت لود بالا */
  priority?: boolean;
  /** پوشهٔ Liara برای resolve کردن URLهای خارجی (پیش‌فرض: covers برای لیست/هدر، items برای آیتم) */
  imageFolder?: ImageFolder;
  /** حرف/آیکون نمایشی روی placeholder (پیش‌فرض: حرف اول alt) */
  fallbackLabel?: string;
  /** seed برای انتخاب رنگ گرادیان (مثلاً categoryId) */
  fallbackColorSeed?: string;
}

/** مسیرهای تصویر خالی/placeholder که باید با تصویر داخلی جایگزین شوند */
const PLACEHOLDER_PATHS = ['/images/placeholder-cover.svg', '/images/placeholder-item.svg'];

function isEmptyOrPlaceholderPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const t = url.trim();
  return !t || PLACEHOLDER_PATHS.some((p) => t === p);
}

/** آیا URL از Liara Object Storage خودمان است؟ (برای امتحان پراکسی بعد از خطا) */
function isLiaraStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('storage.') && host.includes('liara');
  } catch {
    return false;
  }
}

/** پالت گرادیان — بر اساس seed رنگ ثابتی انتخاب می‌شود */
const GRADIENT_PALETTE = [
  { from: '#6366F1', to: '#8B5CF6', angle: 135 },  // indigo → violet
  { from: '#EC4899', to: '#F43F5E', angle: 150 },  // pink → rose
  { from: '#F59E0B', to: '#EF4444', angle: 120 },  // amber → red
  { from: '#10B981', to: '#3B82F6', angle: 135 },  // emerald → blue
  { from: '#8B5CF6', to: '#EC4899', angle: 160 },  // violet → pink
  { from: '#14B8A6', to: '#6366F1', angle: 145 },  // teal → indigo
  { from: '#F97316', to: '#F59E0B', angle: 130 },  // orange → amber
  { from: '#06B6D4', to: '#8B5CF6', angle: 140 },  // cyan → violet
  { from: '#D946EF', to: '#6366F1', angle: 155 },  // fuchsia → indigo
  { from: '#84CC16', to: '#10B981', angle: 125 },  // lime → emerald
  { from: '#0EA5E9', to: '#6366F1', angle: 135 },  // sky → indigo
  { from: '#F43F5E', to: '#FB923C', angle: 150 },  // rose → orange
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getFirstChar(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '?';
  // Skip emojis and special chars, prefer Persian/Arabic/Latin letters
  for (const ch of trimmed) {
    if (/[\p{L}\p{N}]/u.test(ch)) return ch;
  }
  return trimmed[0];
}

/** Placeholder رنگی با حرف اول — بدون API call */
function GradientPlaceholder({
  label,
  colorSeed,
  className = '',
}: {
  label: string;
  colorSeed: string;
  className?: string;
}) {
  const idx = hashString(colorSeed) % GRADIENT_PALETTE.length;
  const { from, to, angle } = GRADIENT_PALETTE[idx];

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        background: `linear-gradient(${angle}deg, ${from}, ${to})`,
      }}
    >
      <span
        className="text-white/30 font-bold select-none"
        style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)' }}
      >
        {label}
      </span>
    </div>
  );
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  placeholderSize = 'cover',
  priority = false,
  imageFolder = 'covers',
  fallbackLabel,
  fallbackColorSeed,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const label = fallbackLabel ?? getFirstChar(alt);
  const colorSeed = fallbackColorSeed ?? alt;

  // وقتی آدرس خالی/placeholder — مستقیماً گرادیان CSS رندر کن (بدون API call)
  if (isEmptyOrPlaceholderPath(src)) {
    return (
      <GradientPlaceholder label={label} colorSeed={colorSeed} className={className} />
    );
  }

  // تبدیل آدرس واقعی به displaySrc
  const isDevEnv = process.env.NODE_ENV === 'development';
  const displaySrc = src.startsWith('/')
    ? src
    : isLiaraStorageUrl(src)
      ? isDevEnv
        ? null // لوکال: Liara در دسترس نیست
        : `/api/image-proxy?url=${encodeURIComponent(src)}`
      : getDisplayImageUrl(src, imageFolder);

  // وقتی تصویر لود نشد → گرادیان placeholder
  if (hasError || !displaySrc) {
    return (
      <GradientPlaceholder label={label} colorSeed={colorSeed} className={className} />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
    />
  );
}
