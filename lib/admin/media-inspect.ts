import fs from 'fs';
import path from 'path';
import { getSharp } from '@/lib/get-sharp';
import { getObjectByPublicUrl, headObjectByPublicUrl } from '@/lib/object-storage';
import { isPublicHttpUrl } from '@/lib/ssrf-guard';
import type { MediaSlot } from '@/lib/admin/media-targets';
import {
  formatFromContentType,
  formatFromSharp,
  formatFromUrl,
  mediaIssues,
  mediaSource,
  type MediaFormat,
  type MediaSource,
} from '@/lib/admin/media-standards';

export type MediaInspection = {
  bytes: number | null;
  width: number | null;
  height: number | null;
  format: MediaFormat | null;
  source: MediaSource;
  broken: boolean;
};

const CACHE_MS = 10 * 60 * 1000;
const DOWNLOAD_CAP = 8 * 1024 * 1024;
const cache = new Map<string, { at: number; value: MediaInspection }>();

function remember(url: string, value: MediaInspection): MediaInspection {
  cache.set(url, { at: Date.now(), value });
  return value;
}

function localPath(url: string): string | null {
  if (!url.startsWith('/images/')) return null;
  const relative = url.replace(/^\/+/, '');
  if (relative.includes('..')) return null;
  const root = path.join(process.cwd(), 'public');
  const full = path.resolve(root, relative);
  if (!full.startsWith(root + path.sep)) return null;
  return fs.existsSync(full) ? full : null;
}

async function measureBuffer(buffer: Buffer, bytes: number, format: MediaFormat | null, source: MediaSource) {
  try {
    const sharp = await getSharp();
    const meta = await sharp(buffer).metadata();
    return {
      bytes,
      width: meta.width ?? null,
      height: meta.height ?? null,
      format: formatFromSharp(meta.format) ?? format,
      source,
      broken: false,
    };
  } catch {
    return { bytes, width: null, height: null, format, source, broken: false };
  }
}

async function withTimeout<T>(work: Promise<T | null>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function readImageBuffer(url: string): Promise<Buffer | null> {
  const source = mediaSource(url);
  if (source === 'local') {
    const file = localPath(url);
    if (!file) return null;
    return fs.readFileSync(file);
  }
  if (source === 'parspack') {
    const object = await withTimeout(getObjectByPublicUrl(url), 8000);
    return object?.buffer ?? null;
  }
  if (!isPublicHttpUrl(url)) return null;
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length) && length > DOWNLOAD_CAP) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length > DOWNLOAD_CAP ? null : buffer;
  } catch {
    return null;
  }
}

export async function inspectImageUrl(url: string): Promise<MediaInspection> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  const source = mediaSource(url);
  const hinted = formatFromUrl(url);

  if (source === 'local') {
    const file = localPath(url);
    if (!file) {
      return remember(url, { bytes: null, width: null, height: null, format: hinted, source, broken: true });
    }
    const bytes = fs.statSync(file).size;
    try {
      const sharp = await getSharp();
      const meta = await sharp(file).metadata();
      return remember(url, {
        bytes,
        width: meta.width ?? null,
        height: meta.height ?? null,
        format: formatFromSharp(meta.format) ?? hinted ?? 'webp',
        source,
        broken: false,
      });
    } catch {
      return remember(url, { bytes, width: null, height: null, format: hinted, source, broken: false });
    }
  }

  if (source === 'parspack') {
    const head = await withTimeout(headObjectByPublicUrl(url), 4000);
    if (!head) {
      return remember(url, { bytes: null, width: null, height: null, format: hinted, source, broken: true });
    }
    const format = formatFromContentType(head.contentType) ?? hinted;
    if (head.bytes > DOWNLOAD_CAP) {
      return remember(url, { bytes: head.bytes, width: null, height: null, format, source, broken: false });
    }
    const object = await withTimeout(getObjectByPublicUrl(url), 4000);
    if (!object) {
      return remember(url, { bytes: head.bytes, width: null, height: null, format, source, broken: false });
    }
    return remember(url, await measureBuffer(object.buffer, head.bytes, format, source));
  }

  if (!isPublicHttpUrl(url)) {
    return remember(url, { bytes: null, width: null, height: null, format: hinted, source, broken: true });
  }

  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(4000) });
    if (!response.ok) {
      return remember(url, { bytes: null, width: null, height: null, format: hinted, source, broken: true });
    }
    const format = formatFromContentType(response.headers.get('content-type')) ?? hinted;
    const length = Number(response.headers.get('content-length'));
    const bytes = Number.isFinite(length) && length > 0 ? length : null;
    if (bytes != null && bytes > DOWNLOAD_CAP) {
      return remember(url, { bytes, width: null, height: null, format, source, broken: false });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return remember(url, await measureBuffer(buffer, buffer.length, format, source));
  } catch {
    return remember(url, { bytes: null, width: null, height: null, format: hinted, source, broken: true });
  }
}

export function applyInspection(slot: MediaSlot, info: MediaInspection) {
  slot.bytes = info.bytes;
  slot.width = info.width;
  slot.height = info.height;
  slot.format = info.format ?? formatFromUrl(slot.imageUrl ?? '') ;
  slot.source = info.source;
  slot.issues = mediaIssues({
    kind: slot.kind,
    url: slot.imageUrl,
    bytes: slot.bytes,
    width: slot.width,
    height: slot.height,
    format: slot.format,
    broken: info.broken,
  });
}

export function applyCheapFacts(slot: MediaSlot) {
  if (!slot.imageUrl) {
    slot.format = null;
    slot.source = null;
    slot.issues = [];
    return;
  }
  slot.source = slot.source ?? mediaSource(slot.imageUrl);
  slot.format = slot.format ?? formatFromUrl(slot.imageUrl);
  slot.issues = mediaIssues({
    kind: slot.kind,
    url: slot.imageUrl,
    bytes: slot.bytes,
    width: slot.width,
    height: slot.height,
    format: slot.format,
    broken: false,
  });
}

async function inspectHead(url: string): Promise<MediaInspection> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  const source = mediaSource(url);
  const hinted = formatFromUrl(url);
  if (source === 'local') return inspectImageUrl(url);

  if (source === 'parspack') {
    const head = await withTimeout(headObjectByPublicUrl(url), 4000);
    if (!head) {
      return { bytes: null, width: null, height: null, format: hinted, source, broken: true };
    }
    return {
      bytes: head.bytes,
      width: null,
      height: null,
      format: formatFromContentType(head.contentType) ?? hinted,
      source,
      broken: false,
    };
  }

  if (!isPublicHttpUrl(url)) {
    return { bytes: null, width: null, height: null, format: hinted, source, broken: true };
  }

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(4000) });
    if (!response.ok) {
      return { bytes: null, width: null, height: null, format: hinted, source, broken: true };
    }
    const length = Number(response.headers.get('content-length'));
    return {
      bytes: Number.isFinite(length) && length > 0 ? length : null,
      width: null,
      height: null,
      format: formatFromContentType(response.headers.get('content-type')) ?? hinted,
      source,
      broken: false,
    };
  } catch {
    return { bytes: null, width: null, height: null, format: hinted, source, broken: true };
  }
}

async function mapPool<T>(items: T[], workers: number, deadline: number, run: (item: T) => Promise<void>) {
  let index = 0;
  async function worker() {
    while (index < items.length && Date.now() < deadline) {
      const item = items[index];
      index += 1;
      if (item !== undefined) await run(item);
    }
  }
  await Promise.all(Array.from({ length: workers }, () => worker()));
}

/** اول حجم از سرور، بعد ابعاد تا جایی که زمان صفحه اجازه بدهد. */
export async function inspectMediaSlots(slots: MediaSlot[], budgetMs = 20000): Promise<void> {
  for (const slot of slots) applyCheapFacts(slot);
  const pending = slots.filter((slot) => slot.imageUrl);
  const deadline = Date.now() + budgetMs;

  await mapPool(pending, 8, deadline, async (slot) => {
    if (!slot.imageUrl) return;
    applyInspection(slot, await inspectHead(slot.imageUrl));
  });

  const needSize = pending.filter(
    (slot) => slot.imageUrl && slot.bytes != null && slot.bytes <= DOWNLOAD_CAP && (slot.width == null || slot.height == null),
  );
  await mapPool(needSize, 4, deadline, async (slot) => {
    if (!slot.imageUrl) return;
    applyInspection(slot, await inspectImageUrl(slot.imageUrl));
  });
}
