import type { MediaKind } from '@/lib/admin/media-targets';
import { isOurStorageUrl } from '@/lib/object-storage-config';

export type MediaFormat = 'webp' | 'jpeg' | 'png' | 'other';

export type MediaSource = 'local' | 'parspack' | 'external';

export const MEDIA_ISSUES = ['small', 'ratio', 'heavy', 'format', 'broken'] as const;

export type MediaIssue = (typeof MEDIA_ISSUES)[number];

export const MEDIA_ISSUE_LABELS: Record<MediaIssue, string> = {
  small: 'ابعاد کم',
  ratio: 'نسبت اشتباه',
  heavy: 'حجم سنگین',
  format: 'غیر WebP',
  broken: 'لینک خراب',
};

export const MEDIA_FORMAT_LABELS: Record<MediaFormat, string> = {
  webp: 'WebP',
  jpeg: 'JPG',
  png: 'PNG',
  other: 'فرمت دیگر',
};

export const MEDIA_SOURCE_LABELS: Record<MediaSource, string> = {
  local: 'فایل سایت',
  parspack: 'پارس‌پک',
  external: 'لینک بیرونی',
};

/** معیار نمایش. ابعاد کمتر از این، یا نسبت متفاوت، یا حجم بیشتر، مشکل است. */
export const MEDIA_STANDARDS: Partial<
  Record<MediaKind, { width: number; height: number; maxBytes: number }>
> = {
  item: { width: 600, height: 900, maxBytes: 300 * 1024 },
  catalog: { width: 600, height: 900, maxBytes: 300 * 1024 },
  list: { width: 960, height: 720, maxBytes: 180 * 1024 },
  'list-banner': { width: 1600, height: 686, maxBytes: 150 * 1024 },
};

const RATIO_TOLERANCE = 0.08;

export function parseMediaIssue(value: string | null | undefined): MediaIssue | null {
  if (value && (MEDIA_ISSUES as readonly string[]).includes(value)) return value as MediaIssue;
  return null;
}

export function mediaSource(url: string): MediaSource {
  if (url.startsWith('/images/')) return 'local';
  if (isOurStorageUrl(url)) return 'parspack';
  return 'external';
}

export function formatFromUrl(url: string): MediaFormat | null {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.webp')) return 'webp';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'jpeg';
  if (path.endsWith('.png')) return 'png';
  return null;
}

export function formatFromContentType(contentType: string | null | undefined): MediaFormat | null {
  const value = contentType?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (value === 'image/webp') return 'webp';
  if (value === 'image/jpeg' || value === 'image/jpg') return 'jpeg';
  if (value === 'image/png') return 'png';
  if (value.startsWith('image/')) return 'other';
  return null;
}

export function formatFromSharp(format: string | undefined): MediaFormat | null {
  if (!format) return null;
  if (format === 'webp') return 'webp';
  if (format === 'jpeg' || format === 'jpg') return 'jpeg';
  if (format === 'png') return 'png';
  return 'other';
}

export function mediaIssues(input: {
  kind: MediaKind;
  url: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  format: MediaFormat | null;
  broken: boolean;
}): MediaIssue[] {
  if (!input.url) return [];
  const issues: MediaIssue[] = [];
  if (input.broken) issues.push('broken');
  const format = input.format ?? formatFromUrl(input.url);
  if (format && format !== 'webp') issues.push('format');

  const standard = MEDIA_STANDARDS[input.kind];
  if (!standard) return issues;

  if (input.bytes != null && input.bytes > standard.maxBytes) issues.push('heavy');
  if (input.width && input.height) {
    if (input.width < standard.width * 0.9 || input.height < standard.height * 0.9) {
      issues.push('small');
    }
    const actual = input.width / input.height;
    const target = standard.width / standard.height;
    if (Math.abs(actual - target) / target > RATIO_TOLERANCE) issues.push('ratio');
  }
  return issues;
}
