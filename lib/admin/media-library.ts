import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { buildCatalogExternalKey } from '@/lib/catalog-items';
import { getSharp } from '@/lib/get-sharp';
import { inspectMediaSlots, readImageBuffer } from '@/lib/admin/media-inspect';
import { optimizeImageDetailed } from '@/lib/image-optimizer';
import { MEDIA_STANDARDS, type MediaIssue } from '@/lib/admin/media-standards';
import { validateImage } from '@/lib/image-validator';
import { getDisplayImageUrl } from '@/lib/display-image';
import { isValidHttpImageUrl, normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';
import { listStorageObjectSizes, storageObjectBytes, uploadImageFromUrlDetailed, uploadWebpBuffer } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import type { ImageProfile } from '@/lib/image-config';
import {
  revalidateAdminCategoriesCache,
  revalidateAdminListsCache,
  revalidateAdminPeopleCache,
} from '@/lib/admin/admin-cache';
import {
  revalidateCategoryCache,
  revalidateHomeCache,
  revalidateItemDetailCache,
  revalidateListDetailCache,
} from '@/lib/public-cache';
import {
  HEAVIEST_IMAGE_LIMIT,
  MEDIA_KINDS,
  isMediaKind,
  missingMediaTarget,
  parseMediaTarget,
  rankHeaviestImages,
  safeBannerFileName,
  type MediaFilter,
  type MediaKind,
  type MediaSlot,
  type MediaState,
  type MediaTarget,
} from '@/lib/admin/media-targets';

export type { MediaSlot };

export type MediaLibraryData = {
  slots: MediaSlot[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<MediaFilter, number>;
};

const PAGE_SIZE = 20;
const BANNERS_DIR = path.join(process.cwd(), 'public/images/banners');

const slotsFrom = Prisma.sql`
  SELECT 'category'::text AS kind, id, name AS title, slug AS detail, "heroImage" AS url, "isActive" AS active
  FROM categories
  WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT 'list'::text, id, title, slug, "coverImage", "isActive"
  FROM lists
  WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT 'list-banner'::text, id, title, slug, "horizontalImage", "isActive"
  FROM lists
  WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT 'catalog'::text, id, title, COALESCE("categorySlug", ''), "imageUrl", true
  FROM catalog_items
  UNION ALL
  SELECT 'item'::text, i.id, i.title, COALESCE(l.title, ''), i."imageUrl",
    (l.id IS NOT NULL AND l."deletedAt" IS NULL AND l."isActive" = true)
  FROM items i
  LEFT JOIN lists l ON l.id = i."listId"
  WHERE i."deletedAt" IS NULL
  UNION ALL
  SELECT 'person'::text, p.id, p."displayName", p.role || '/' || p.slug, p."imageUrl",
    (COALESCE(p.status, '') = 'published')
  FROM person_profiles p
`;

function stateWhere(state: MediaState) {
  return Prisma.sql`(
    ${state} = 'all'
    OR (${state} = 'active' AND active IS TRUE)
    OR (${state} = 'inactive' AND active IS FALSE)
  )`;
}

function isActiveFlag(value: unknown): boolean {
  return value === true || value === 't' || value === 'true';
}

function emptyCounts(): Record<MediaFilter, number> {
  return {
    all: 0,
    banner: 0,
    category: 0,
    list: 0,
    'list-banner': 0,
    catalog: 0,
    item: 0,
    person: 0,
  };
}

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, '\\$&')}%`;
}

function publicFileFromUrl(url: string): string | null {
  if (!url.startsWith('/images/')) return null;
  const relative = url.replace(/^\/+/, '');
  if (relative.includes('..')) return null;
  const root = path.join(process.cwd(), 'public');
  const full = path.resolve(root, relative);
  if (!full.startsWith(root + path.sep)) return null;
  return fs.existsSync(full) ? full : null;
}

/** فقط حجم فایل — ابعاد از onLoad مرورگر می‌آید تا Sharp روی هر ردیف DB اجرا نشود */
function fileBytesOnly(filePath: string): number | null {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return null;
  }
}

async function localImageMeta(
  filePath: string
): Promise<{ bytes: number; width: number | null; height: number | null }> {
  const bytes = fs.statSync(filePath).size;
  try {
    const sharp = await getSharp();
    const meta = await sharp(filePath).metadata();
    return { bytes, width: meta.width ?? null, height: meta.height ?? null };
  } catch {
    return { bytes, width: null, height: null };
  }
}

function bannerNames(): string[] {
  if (!fs.existsSync(BANNERS_DIR)) return [];
  return fs
    .readdirSync(BANNERS_DIR)
    .filter((name) => safeBannerFileName(name))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

/** بنرها تعداد کم‌اند؛ ابعاد را با Sharp می‌خوانیم تا در SSR دیده شود */
async function bannerSlots(q: string): Promise<MediaSlot[]> {
  const names = bannerNames().filter((name) => !q || name.toLowerCase().includes(q.toLowerCase()));
  return Promise.all(
    names.map(async (name) => {
      const imageUrl = `/images/banners/${name}`;
      const meta = await localImageMeta(path.join(BANNERS_DIR, name));
      return {
        key: `banner:${name}`,
        kind: 'banner' as const,
        id: name,
        title: name,
        detail: 'فایل ثابت سایت',
        imageUrl,
        previewUrl: imageUrl,
        bytes: meta.bytes,
        width: meta.width,
        height: meta.height,
        format: 'webp',
        source: 'local',
        issues: [],
        active: true,
        canClear: false,
        editHref: null,
      };
    })
  );
}

function editHref(kind: MediaKind, id: string, detail: string): string | null {
  if (kind === 'category') return `/admin/categories/${id}/edit`;
  if (kind === 'list' || kind === 'list-banner') return `/admin/lists/${id}/edit`;
  if (kind === 'catalog') return `/admin/catalog/${id}/edit`;
  if (kind === 'item') return `/admin/items/${id}/edit`;
  if (kind === 'person') {
    const [role, slug] = detail.split('/');
    if (!role || !slug) return null;
    return `/people/${role}/${slug}`;
  }
  return null;
}

function decorate(
  row: {
    kind: string;
    id: string;
    title: string;
    detail: string | null;
    url: string | null;
    active: unknown;
  },
  knownBytes?: number | null
): MediaSlot {
  const kind = row.kind as MediaKind;
  const imageUrl = row.url?.trim() || null;
  let bytes: number | null = knownBytes ?? null;
  if (bytes == null && imageUrl?.startsWith('/images/')) {
    const file = publicFileFromUrl(imageUrl);
    if (file) bytes = fileBytesOnly(file);
  }
  return {
    key: `${kind}:${row.id}`,
    kind,
    id: row.id,
    title: row.title,
    detail: row.detail?.trim() || '',
    imageUrl,
    previewUrl: imageUrl ? getDisplayImageUrl(imageUrl) : '',
    bytes,
    width: null,
    height: null,
    format: null,
    source: null,
    issues: [],
    active: isActiveFlag(row.active),
    canClear: kind !== 'banner',
    editHref: editHref(kind, row.id, row.detail?.trim() || ''),
  };
}

async function computeMediaCounts(state: MediaState): Promise<Record<MediaFilter, number>> {
  const counts = emptyCounts();
  const grouped = await prisma.$queryRaw<{ kind: string; n: number }[]>(Prisma.sql`
    SELECT kind, COUNT(*)::int AS n
    FROM (${slotsFrom}) slots
    WHERE ${stateWhere(state)}
    GROUP BY kind
  `);
  for (const row of grouped) {
    if (row.kind in counts) counts[row.kind as MediaKind] = Number(row.n);
  }
  counts.banner = state === 'inactive' ? 0 : bannerNames().length;
  counts.all = MEDIA_KINDS.reduce((sum, kind) => sum + (kind === 'banner' ? 0 : counts[kind]), 0);
  return counts;
}

const getCachedMediaCounts = unstable_cache(
  async (state: MediaState) => computeMediaCounts(state),
  ['admin-media-counts-v1'],
  { revalidate: 60, tags: ['admin-media'] }
);

export async function loadMediaCounts(state: MediaState): Promise<Record<MediaFilter, number>> {
  return getCachedMediaCounts(state);
}

export async function loadMediaLibrary(input: {
  filter: MediaFilter;
  q: string;
  missing: boolean;
  state: MediaState;
  page: number;
  /** وقتی فقط شمارنده‌ها لازم است (مثلاً کنار بزرگ‌ترین حجم) */
  countsOnly?: boolean;
}): Promise<MediaLibraryData> {
  const q = input.q.trim().slice(0, 80);
  const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
  const pattern = likePattern(q);
  const counts = await loadMediaCounts(input.state);

  if (input.countsOnly) {
    return { slots: [], total: 0, page: 1, pageSize: PAGE_SIZE, counts };
  }

  if (input.filter === 'banner') {
    const all = input.missing || input.state === 'inactive' ? [] : await bannerSlots(q);
    const start = (page - 1) * PAGE_SIZE;
    const slots = all.slice(start, start + PAGE_SIZE);
    await inspectMediaSlots(slots);
    return {
      slots,
      total: all.length,
      page,
      pageSize: PAGE_SIZE,
      counts,
    };
  }

  const where = Prisma.sql`
    WHERE (${input.filter} = 'all' OR kind = ${input.filter})
      AND (${q} = '' OR title ILIKE ${pattern} ESCAPE '\\' OR detail ILIKE ${pattern} ESCAPE '\\')
      AND (${input.missing} = false OR url IS NULL OR btrim(COALESCE(url, '')) = '')
      AND ${stateWhere(input.state)}
  `;

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ n: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS n FROM (${slotsFrom}) slots ${where}
    `),
    prisma.$queryRaw<
      { kind: string; id: string; title: string; detail: string | null; url: string | null; active: unknown }[]
    >(
      Prisma.sql`
        SELECT kind, id, title, detail, url, active
        FROM (${slotsFrom}) slots
        ${where}
        ORDER BY kind, title, id
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
      `
    ),
  ]);

  const slots = rows.map((row) => decorate(row));
  await inspectMediaSlots(slots);
  return {
    slots,
    total: Number(countRows[0]?.n ?? 0),
    page,
    pageSize: PAGE_SIZE,
    counts,
  };
}

const ISSUE_BATCH = 20;
const ISSUE_SCAN_CAP = 80;

export async function loadIssueMedia(input: {
  filter: MediaFilter;
  q: string;
  state: MediaState;
  issue: MediaIssue;
  scan: number;
}): Promise<{ slots: MediaSlot[]; scanned: number; nextScan: number | null }> {
  const q = input.q.trim().slice(0, 80);
  const pattern = likePattern(q);
  const formatOnly = input.issue === 'format';
  let offset = Number.isFinite(input.scan) && input.scan > 0 ? Math.floor(input.scan) : 0;
  let scanned = 0;
  const matches: MediaSlot[] = [];
  const deadline = Date.now() + 8000;
  let exhausted = false;

  if (offset === 0 && (input.filter === 'all' || input.filter === 'banner') && input.state !== 'inactive') {
    const banners = await bannerSlots(q);
    await inspectMediaSlots(banners, 2000);
    scanned += banners.length;
    for (const slot of banners) {
      if (slot.issues.includes(input.issue) && matches.length < PAGE_SIZE) matches.push(slot);
    }
    if (input.filter === 'banner') return { slots: matches, scanned, nextScan: null };
  }

  while (matches.length < PAGE_SIZE && scanned < ISSUE_SCAN_CAP && Date.now() < deadline) {
    const rows = await prisma.$queryRaw<
      { kind: string; id: string; title: string; detail: string | null; url: string | null; active: unknown }[]
    >(Prisma.sql`
      SELECT kind, id, title, detail, url, active
      FROM (${slotsFrom}) slots
      WHERE (${input.filter} = 'all' OR kind = ${input.filter})
        AND (${q} = '' OR title ILIKE ${pattern} ESCAPE '\\' OR detail ILIKE ${pattern} ESCAPE '\\')
        AND url IS NOT NULL
        AND btrim(url) <> ''
        AND (${formatOnly} = false OR url !~* '\\.webp($|\\?)')
        AND ${stateWhere(input.state)}
      ORDER BY kind, title, id
      LIMIT ${ISSUE_BATCH} OFFSET ${offset}
    `);
    if (rows.length === 0) {
      exhausted = true;
      break;
    }
    const batch = rows.map((row) => decorate(row));
    await inspectMediaSlots(batch, Math.max(1500, deadline - Date.now()));
    for (const slot of batch) {
      if (slot.issues.includes(input.issue) && matches.length < PAGE_SIZE) matches.push(slot);
    }
    offset += rows.length;
    scanned += rows.length;
    if (rows.length < ISSUE_BATCH) {
      exhausted = true;
      break;
    }
  }

  return { slots: matches, scanned, nextScan: exhausted ? null : offset };
}

type SizedSlotRow = {
  kind: string;
  id: string;
  title: string;
  detail: string | null;
  url: string;
  active: unknown;
  bytes: number;
  width?: number | null;
  height?: number | null;
};

function localFileBytes(url: string): number | null {
  const file = publicFileFromUrl(url);
  if (!file) return null;
  try {
    return fs.statSync(file).size;
  } catch {
    return null;
  }
}

/**
 * بزرگ‌ترین‌ها را از فهرست حجم استوریج می‌گیرد و فقط همان کلیدها را در DB جور می‌کند —
 * نه اسکن همهٔ ۵٬۰۰۰+ ردیف.
 */
export async function loadHeaviestMedia(input: {
  filter: MediaFilter;
  q: string;
  state: MediaState;
}): Promise<{ slots: MediaSlot[]; complete: boolean }> {
  const q = input.q.trim().slice(0, 80);
  const pattern = likePattern(q);
  const candidates: SizedSlotRow[] = [];

  if ((input.filter === 'all' || input.filter === 'banner') && input.state !== 'inactive') {
    for (const slot of await bannerSlots(q)) {
      if (!slot.imageUrl || !slot.bytes) continue;
      candidates.push({
        kind: slot.kind,
        id: slot.id,
        title: slot.title,
        detail: slot.detail,
        url: slot.imageUrl,
        active: true,
        bytes: slot.bytes,
        width: slot.width,
        height: slot.height,
      });
    }
  }

  let complete = input.filter === 'banner';
  if (input.filter !== 'banner') {
    let sizes = new Map<string, number>();
    try {
      const listed = await listStorageObjectSizes();
      sizes = listed.sizes;
      complete = listed.complete;
    } catch (error) {
      complete = false;
      console.error('[media] listing storage sizes failed:', error);
    }

    const rankedKeys = [...sizes.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, Math.max(HEAVIEST_IMAGE_LIMIT * 6, 80));

    if (rankedKeys.length > 0) {
      const likeClauses = rankedKeys.map(([key]) => {
        const pattern = `%${key.replace(/[\\%_]/g, '\\$&')}`;
        return Prisma.sql`url LIKE ${pattern} ESCAPE '\\'`;
      });
      const keyMatch = Prisma.sql`(${Prisma.join(likeClauses, ' OR ')})`;
      const rows = await prisma.$queryRaw<
        { kind: string; id: string; title: string; detail: string | null; url: string | null; active: unknown }[]
      >(Prisma.sql`
        SELECT kind, id, title, detail, url, active
        FROM (${slotsFrom}) slots
        WHERE (${input.filter} = 'all' OR kind = ${input.filter})
          AND (${q} = '' OR title ILIKE ${pattern} ESCAPE '\\' OR detail ILIKE ${pattern} ESCAPE '\\')
          AND url IS NOT NULL
          AND btrim(url) <> ''
          AND ${keyMatch}
          AND ${stateWhere(input.state)}
      `);
      for (const row of rows) {
        const url = row.url?.trim() ?? '';
        if (!url) continue;
        const bytes = storageObjectBytes(url, sizes);
        if (!bytes) continue;
        candidates.push({
          kind: row.kind,
          id: row.id,
          title: row.title,
          detail: row.detail,
          url,
          active: row.active,
          bytes,
        });
      }
    }

    // فایل‌های محلی غیر از بنر (تعداد کم؛ محدود می‌شود)
    if (input.filter === 'all' || input.filter === 'category' || input.filter === 'list') {
      const localRows = await prisma.$queryRaw<
        { kind: string; id: string; title: string; detail: string | null; url: string | null; active: unknown }[]
      >(Prisma.sql`
        SELECT kind, id, title, detail, url, active
        FROM (${slotsFrom}) slots
        WHERE (${input.filter} = 'all' OR kind = ${input.filter})
          AND (${q} = '' OR title ILIKE ${pattern} ESCAPE '\\' OR detail ILIKE ${pattern} ESCAPE '\\')
          AND url LIKE '/images/%'
          AND url NOT LIKE '/images/banners/%'
          AND ${stateWhere(input.state)}
        LIMIT 200
      `);
      for (const row of localRows) {
        const url = row.url?.trim() ?? '';
        if (!url || url.startsWith('/images/banners/')) continue;
        const bytes = localFileBytes(url);
        if (!bytes) continue;
        candidates.push({
          kind: row.kind,
          id: row.id,
          title: row.title,
          detail: row.detail,
          url,
          active: row.active,
          bytes,
        });
      }
    }
  }

  const top = rankHeaviestImages(candidates, HEAVIEST_IMAGE_LIMIT);
  const slots = top.map((row) => {
    const slot = decorate(row, row.bytes);
    if (slot.bytes == null) slot.bytes = row.bytes;
    if (row.width != null) slot.width = row.width;
    if (row.height != null) slot.height = row.height;
    return slot;
  });
  await inspectMediaSlots(slots);
  return { slots, complete };
}

export async function exportHeaviestMedia(input: {
  filter: MediaFilter;
  q: string;
  state: MediaState;
}): Promise<{
  images: {
    target: string;
    title: string;
    url: string;
    bytes: number | null;
    width: number | null;
    height: number | null;
    format: string | null;
    source: string | null;
    issues: string[];
  }[];
}> {
  const { slots } = await loadHeaviestMedia(input);
  return {
    images: slots.flatMap((slot) => {
      if (!slot.imageUrl || slot.bytes == null) return [];
      const target =
        slot.kind === 'banner' ? `banner:${slot.id}` : missingMediaTarget(slot.kind, slot.id, slot.detail);
      if (!target) return [];
      return [
        {
          target,
          title: slot.title,
          url: slot.imageUrl,
          bytes: slot.bytes,
          width: slot.width,
          height: slot.height,
          format: slot.format,
          source: slot.source,
          issues: slot.issues,
        },
      ];
    }),
  };
}

function imageRecord(slot: MediaSlot) {
  const target =
    slot.kind === 'banner' ? `banner:${slot.id}` : missingMediaTarget(slot.kind, slot.id, slot.detail);
  if (!target) return null;
  return {
    target,
    title: slot.title,
    url: slot.imageUrl ?? '',
    bytes: slot.bytes,
    width: slot.width,
    height: slot.height,
    format: slot.format,
    source: slot.source,
    issues: slot.issues,
  };
}

export async function exportMediaInventory(input: {
  filter: MediaFilter;
  q: string;
  state: MediaState;
}): Promise<{ images: NonNullable<ReturnType<typeof imageRecord>>[]; truncated: boolean }> {
  const q = input.q.trim().slice(0, 80);
  const pattern = likePattern(q);
  const limit = 1000;
  if (input.filter === 'banner') {
    const slots = input.state === 'inactive' ? [] : await bannerSlots(q);
    await inspectMediaSlots(slots);
    return { images: slots.flatMap((slot) => imageRecord(slot) ?? []), truncated: false };
  }
  const rows = await prisma.$queryRaw<
    { kind: string; id: string; title: string; detail: string | null; url: string | null; active: unknown }[]
  >(Prisma.sql`
    SELECT kind, id, title, detail, url, active
    FROM (${slotsFrom}) slots
    WHERE (${input.filter} = 'all' OR kind = ${input.filter})
      AND (${q} = '' OR title ILIKE ${pattern} ESCAPE '\\' OR detail ILIKE ${pattern} ESCAPE '\\')
      AND url IS NOT NULL
      AND btrim(url) <> ''
      AND ${stateWhere(input.state)}
    ORDER BY kind, title, id
    LIMIT ${limit + 1}
  `);
  const truncated = rows.length > limit;
  const slots = rows.slice(0, limit).map((row) => decorate(row));
  await inspectMediaSlots(slots, 30000);
  return { images: slots.flatMap((slot) => imageRecord(slot) ?? []), truncated };
}

const NORMALIZE_LIMIT = 12;

async function encodeToStandard(buffer: Buffer, width: number, height: number, maxBytes: number) {
  const sharp = await getSharp();
  let quality = 78;
  let output = await sharp(buffer)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality })
    .toBuffer();
  while (output.length > maxBytes && quality > 46) {
    quality -= 8;
    output = await sharp(buffer)
      .rotate()
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality })
      .toBuffer();
  }
  return output;
}

export async function normalizeMediaImages(
  items: { kind: MediaKind; id: string; detail?: string }[]
): Promise<{ updated: number; errors: { target: string; error: string }[] }> {
  const errors: { target: string; error: string }[] = [];
  let updated = 0;
  for (const item of items.slice(0, NORMALIZE_LIMIT)) {
    const label = item.detail || item.id;
    try {
      if (item.kind === 'banner') {
        const safe = safeBannerFileName(item.id);
        if (!safe) {
          errors.push({ target: label, error: 'نام بنر نامعتبر است.' });
          continue;
        }
        const result = await replaceSiteBanner(safe, fs.readFileSync(path.join(BANNERS_DIR, safe)));
        if (!result.ok) errors.push({ target: label, error: result.error });
        else updated += 1;
        continue;
      }
      const current = await currentUrl(item.kind, item.id);
      if (!current) {
        errors.push({ target: label, error: 'تصویری برای تبدیل نیست.' });
        continue;
      }
      const buffer = await readImageBuffer(current);
      if (!buffer) {
        errors.push({ target: label, error: 'خواندن فایل انجام نشد.' });
        continue;
      }
      const standard = MEDIA_STANDARDS[item.kind];
      const target = STORE_TARGET[item.kind];
      const output = standard
        ? await encodeToStandard(buffer, standard.width, standard.height, standard.maxBytes)
        : (await optimizeImageDetailed(buffer, { profile: target.profile })).buffer;
      const url = await uploadWebpBuffer(output, target.folder);
      if (!url) {
        errors.push({ target: label, error: 'آپلود روی پارس‌پک انجام نشد.' });
        continue;
      }
      const saved = await assignMediaImage({ kind: item.kind, id: item.id, detail: item.detail, url });
      if (!saved.ok) errors.push({ target: label, error: saved.error });
      else updated += 1;
    } catch (error) {
      errors.push({ target: label, error: error instanceof Error ? error.message : 'تبدیل انجام نشد.' });
    }
  }
  return { updated, errors };
}

const STORE_TARGET: Record<Exclude<MediaKind, 'banner'>, { folder: string; profile: ImageProfile }> = {
  category: { folder: 'hubs', profile: 'hubCover' },
  list: { folder: 'lists', profile: 'coverList' },
  'list-banner': { folder: 'lists', profile: 'coverListHorizontal' },
  catalog: { folder: 'items', profile: 'itemImage' },
  item: { folder: 'items', profile: 'itemImage' },
  person: { folder: 'people', profile: 'avatar' },
};

async function storeIncomingUrl(
  kind: Exclude<MediaKind, 'banner'>,
  raw: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const trimmed = raw.trim();
  if (trimmed.startsWith('/images/')) {
    if (!publicFileFromUrl(trimmed)) return { ok: false, error: 'فایل محلی پیدا نشد.' };
    return { ok: true, url: trimmed };
  }
  const normalized = normalizeImageUrlForStorage(trimmed);
  if (!normalized || !isValidHttpImageUrl(normalized)) {
    return { ok: false, error: 'آدرس تصویر نامعتبر است.' };
  }
  if (isOurStorageUrl(normalized)) return { ok: true, url: normalized };
  const target = STORE_TARGET[kind];
  const uploaded = await uploadImageFromUrlDetailed(normalized, target.folder, target.profile);
  if (!uploaded.ok) return { ok: false, error: uploaded.error || 'آپلود تصویر ناموفق بود.' };
  return { ok: true, url: uploaded.url };
}

async function writeSlot(
  target: MediaTarget,
  url: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (target.kind === 'category') {
    const row = await prisma.categories.findFirst({
      where: { deletedAt: null, OR: [{ id: target.id }, { slug: target.id }] },
      select: { id: true },
    });
    if (!row) return { ok: false, error: 'دسته پیدا نشد.' };
    await prisma.categories.update({ where: { id: row.id }, data: { heroImage: url } });
    revalidateAdminCategoriesCache();
    revalidateCategoryCache(row.id);
    revalidateHomeCache();
    return { ok: true };
  }

  if (target.kind === 'list' || target.kind === 'list-banner') {
    const row = await prisma.lists.findFirst({
      where: { deletedAt: null, OR: [{ id: target.id }, { slug: target.id }] },
      select: { id: true, slug: true },
    });
    if (!row) return { ok: false, error: 'لیست پیدا نشد.' };
    await prisma.lists.update({
      where: { id: row.id },
      data: target.kind === 'list' ? { coverImage: url } : { horizontalImage: url },
    });
    revalidateAdminListsCache();
    revalidateListDetailCache(row.slug);
    revalidateHomeCache();
    return { ok: true };
  }

  if (target.kind === 'catalog') {
    const row = await prisma.catalog_items.findUnique({ where: { id: target.id }, select: { id: true } });
    if (!row) return { ok: false, error: 'آیتم کاتالوگ پیدا نشد.' };
    await prisma.catalog_items.update({ where: { id: row.id }, data: { imageUrl: url } });
    revalidateAdminListsCache();
    return { ok: true };
  }

  if (target.kind === 'item') {
    const row = await prisma.items.findFirst({
      where: { id: target.id, deletedAt: null },
      select: { id: true },
    });
    if (!row) return { ok: false, error: 'آیتم پیدا نشد.' };
    await prisma.items.update({ where: { id: row.id }, data: { imageUrl: url } });
    revalidateItemDetailCache(row.id);
    revalidateAdminListsCache();
    return { ok: true };
  }

  const person = await prisma.person_profiles.findFirst({
    where: { role: target.role, slug: target.slug },
    select: { id: true },
  });
  if (!person) return { ok: false, error: 'شخص پیدا نشد.' };
  await prisma.person_profiles.update({ where: { id: person.id }, data: { imageUrl: url } });
  revalidateAdminPeopleCache();
  return { ok: true };
}

function targetFromSlot(kind: MediaKind, id: string, detail: string): MediaTarget | null {
  if (kind === 'banner') return null;
  if (kind === 'person') {
    const [role, slug] = detail.split('/');
    if (role && slug) return { kind: 'person', role, slug };
    return { kind: 'person', role: id, slug: id };
  }
  return { kind, id };
}

export async function assignMediaImage(input: {
  kind: MediaKind;
  id: string;
  detail?: string;
  url: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (input.kind === 'banner') {
    return { ok: false, error: 'بنر سایت را با دکمهٔ جایگزینی همین ردیف عوض کنید.' };
  }
  const stored = await storeIncomingUrl(input.kind, input.url);
  if (!stored.ok) return stored;

  if (input.kind === 'person' && !input.detail?.includes('/')) {
    const row = await prisma.person_profiles.findUnique({ where: { id: input.id }, select: { id: true } });
    if (!row) return { ok: false, error: 'شخص پیدا نشد.' };
    await prisma.person_profiles.update({ where: { id: row.id }, data: { imageUrl: stored.url } });
    revalidateAdminPeopleCache();
    return { ok: true, url: stored.url };
  }

  const target = targetFromSlot(input.kind, input.id, input.detail ?? '');
  if (!target) return { ok: false, error: 'این بخش تصویر جدا ندارد.' };
  const written = await writeSlot(target, stored.url);
  return written.ok ? { ok: true, url: stored.url } : written;
}

export async function clearMediaImage(input: {
  kind: MediaKind;
  id: string;
  detail?: string;
}): Promise<{ ok: true; sharedRemaining: number } | { ok: false; error: string }> {
  if (input.kind === 'banner') {
    return { ok: false, error: 'بنر ثابت سایت حذف نمی‌شود. فقط می‌توانید جایگزینش کنید.' };
  }
  const current = await currentUrl(input.kind, input.id);
  if (input.kind === 'person') {
    const row = await prisma.person_profiles.findUnique({ where: { id: input.id }, select: { id: true } });
    if (!row) return { ok: false, error: 'شخص پیدا نشد.' };
    await prisma.person_profiles.update({ where: { id: row.id }, data: { imageUrl: null } });
    revalidateAdminPeopleCache();
  } else {
    const target = targetFromSlot(input.kind, input.id, input.detail ?? '');
    if (!target) return { ok: false, error: 'این بخش حذف تصویر ندارد.' };
    const written = await writeSlot(target, null);
    if (!written.ok) return written;
  }
  const sharedRemaining = current ? Math.max(0, (await countUrlUses(current)) ) : 0;
  return { ok: true, sharedRemaining };
}

async function currentUrl(kind: MediaKind, id: string): Promise<string | null> {
  if (kind === 'category') {
    const row = await prisma.categories.findUnique({ where: { id }, select: { heroImage: true } });
    return row?.heroImage ?? null;
  }
  if (kind === 'list' || kind === 'list-banner') {
    const row = await prisma.lists.findUnique({
      where: { id },
      select: { coverImage: true, horizontalImage: true },
    });
    return kind === 'list' ? row?.coverImage ?? null : row?.horizontalImage ?? null;
  }
  if (kind === 'catalog') {
    const row = await prisma.catalog_items.findUnique({ where: { id }, select: { imageUrl: true } });
    return row?.imageUrl ?? null;
  }
  if (kind === 'item') {
    const row = await prisma.items.findUnique({ where: { id }, select: { imageUrl: true } });
    return row?.imageUrl ?? null;
  }
  if (kind === 'person') {
    const row = await prisma.person_profiles.findUnique({ where: { id }, select: { imageUrl: true } });
    return row?.imageUrl ?? null;
  }
  return null;
}

async function countUrlUses(url: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: number }[]>(Prisma.sql`
    SELECT (
      (SELECT COUNT(*) FROM categories WHERE "heroImage" = ${url} AND "deletedAt" IS NULL) +
      (SELECT COUNT(*) FROM lists WHERE "deletedAt" IS NULL AND ("coverImage" = ${url} OR "horizontalImage" = ${url})) +
      (SELECT COUNT(*) FROM catalog_items WHERE "imageUrl" = ${url}) +
      (SELECT COUNT(*) FROM items WHERE "imageUrl" = ${url} AND "deletedAt" IS NULL) +
      (SELECT COUNT(*) FROM person_profiles WHERE "imageUrl" = ${url})
    )::int AS n
  `);
  return Number(rows[0]?.n ?? 0);
}

export async function exportMissingMediaAssignments(input: {
  filter: MediaFilter;
  state: MediaState;
}): Promise<{ assignments: { target: string; title: string; url: string }[] }> {
  if (input.filter === 'banner') return { assignments: [] };
  const rows = await prisma.$queryRaw<{ kind: string; id: string; title: string; detail: string | null }[]>(
    Prisma.sql`
      SELECT kind, id, title, detail
      FROM (${slotsFrom}) slots
      WHERE (${input.filter} = 'all' OR kind = ${input.filter})
        AND (url IS NULL OR btrim(COALESCE(url, '')) = '')
        AND ${stateWhere(input.state)}
      ORDER BY kind, title, id
    `
  );
  const assignments: { target: string; title: string; url: string }[] = [];
  for (const row of rows) {
    if (!isMediaKind(row.kind)) continue;
    const target = missingMediaTarget(row.kind, row.id, row.detail ?? '');
    if (!target) continue;
    assignments.push({ target, title: row.title, url: '' });
  }
  return { assignments };
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function linkedCatalogPlacements(catalogId: string) {
  return prisma.items.findMany({
    where: { catalogItemId: catalogId, deletedAt: null },
    select: { id: true, lists: { select: { slug: true } } },
  });
}

function revalidatePlacements(linked: { id: string; lists: { slug: string } }[]) {
  for (const item of linked) {
    revalidateItemDetailCache(item.id);
    revalidateListDetailCache(item.lists.slug);
  }
}

/** تصویر کاتالوگ را روی رکوردهای همان آیتم در لیست‌ها هم می‌گذارد. */
async function copyCatalogImageToLists(catalogId: string, url: string): Promise<number> {
  const linked = await linkedCatalogPlacements(catalogId);
  if (linked.length === 0) return 0;
  await prisma.items.updateMany({
    where: { id: { in: linked.map((item) => item.id) }, deletedAt: null },
    data: { imageUrl: url, updatedAt: new Date() },
  });
  revalidatePlacements(linked);
  return linked.length;
}

/** عنوان کاتالوگ و رکوردهای همان آیتم در لیست‌ها. توضیح لیست دست نمی‌خورد. */
async function renameCatalogTitle(
  target: MediaTarget,
  title: string,
): Promise<{ ok: true; listItems: number } | { ok: false; error: string }> {
  if (target.kind !== 'catalog') {
    return { ok: false, error: 'تغییر عنوان فقط با شناسهٔ کاتالوگ ممکن است.' };
  }
  const row = await prisma.catalog_items.findUnique({
    where: { id: target.id },
    select: { id: true, externalKey: true, categorySlug: true, metadata: true },
  });
  if (!row) return { ok: false, error: 'آیتم کاتالوگ پیدا نشد.' };

  const titleBased = !row.externalKey || row.externalKey.startsWith('title:');
  const nextKey = titleBased
    ? buildCatalogExternalKey(row.categorySlug, title, row.metadata) ?? row.externalKey
    : row.externalKey;
  try {
    await prisma.catalog_items.update({
      where: { id: row.id },
      data: { title, externalKey: nextKey, updatedAt: new Date() },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    await prisma.catalog_items.update({
      where: { id: row.id },
      data: { title, updatedAt: new Date() },
    });
  }

  const linked = await linkedCatalogPlacements(row.id);
  if (linked.length > 0) {
    await prisma.items.updateMany({
      where: { id: { in: linked.map((item) => item.id) }, deletedAt: null },
      data: { title, updatedAt: new Date() },
    });
    revalidatePlacements(linked);
  }
  return { ok: true, listItems: linked.length };
}

export async function importMediaAssignments(
  rows: { target: string; url?: string; title?: string }[]
): Promise<{
  updated: number;
  images: number;
  titles: number;
  listItems: number;
  errors: { target: string; error: string }[];
}> {
  const errors: { target: string; error: string }[] = [];
  let images = 0;
  let titles = 0;
  let listItems = 0;
  for (const row of rows) {
    const target = parseMediaTarget(row.target);
    if (!target) {
      errors.push({ target: row.target, error: 'هدف نامعتبر است.' });
      continue;
    }
    let changed = false;
    let rowLists = 0;
    if (row.url) {
      const stored = await storeIncomingUrl(target.kind, row.url);
      if (!stored.ok) {
        errors.push({ target: row.target, error: stored.error });
      } else {
        const written = await writeSlot(target, stored.url);
        if (!written.ok) errors.push({ target: row.target, error: written.error });
        else {
          images += 1;
          changed = true;
          if (target.kind === 'catalog') {
            rowLists = await copyCatalogImageToLists(target.id, stored.url);
          }
        }
      }
    }
    if (row.title) {
      const renamed = await renameCatalogTitle(target, row.title);
      if (!renamed.ok) errors.push({ target: row.target, error: renamed.error });
      else {
        titles += 1;
        rowLists = Math.max(rowLists, renamed.listItems);
        changed = true;
      }
    }
    listItems += rowLists;
    if (!changed && !row.url && !row.title) {
      errors.push({ target: row.target, error: 'نه تصویری هست و نه عنوانی.' });
    }
  }
  if (titles > 0 || listItems > 0) {
    revalidateAdminListsCache();
    revalidateHomeCache();
  }
  return { updated: images + titles, images, titles, listItems, errors };
}

export async function replaceSiteBanner(
  fileName: string,
  buffer: Buffer
): Promise<{ ok: true; bytes: number; width: number; height: number } | { ok: false; error: string }> {
  const safe = safeBannerFileName(fileName);
  if (!safe || !bannerNames().includes(safe)) {
    return { ok: false, error: 'این بنر در فایل‌های سایت نیست.' };
  }
  const validation = await validateImage(buffer, 'hubCover');
  if (!validation.isValid) return { ok: false, error: validation.error || 'تصویر نامعتبر است.' };
  const sharp = await getSharp();
  const output = await sharp(buffer).rotate().webp({ quality: 78 }).toBuffer();
  const meta = await sharp(output).metadata();
  const destination = path.join(BANNERS_DIR, safe);
  fs.writeFileSync(destination, output);
  const standalone = path.join(process.cwd(), '.next/standalone/public/images/banners', safe);
  if (fs.existsSync(path.dirname(standalone))) fs.copyFileSync(destination, standalone);
  revalidateHomeCache();
  return {
    ok: true,
    bytes: output.length,
    width: meta.width ?? validation.metadata?.width ?? 0,
    height: meta.height ?? validation.metadata?.height ?? 0,
  };
}
