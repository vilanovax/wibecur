import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSharp } from '@/lib/get-sharp';
import { validateImage } from '@/lib/image-validator';
import { getDisplayImageUrl } from '@/lib/display-image';
import { isValidHttpImageUrl, normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';
import { uploadImageFromUrlDetailed } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isPublicHttpUrl } from '@/lib/ssrf-guard';
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
  MEDIA_KINDS,
  parseMediaTarget,
  safeBannerFileName,
  type MediaFilter,
  type MediaKind,
  type MediaSlot,
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
  SELECT 'category'::text AS kind, id, name AS title, slug AS detail, "heroImage" AS url
  FROM categories
  WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT 'list'::text, id, title, slug, "coverImage"
  FROM lists
  WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT 'list-banner'::text, id, title, slug, "horizontalImage"
  FROM lists
  WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT 'catalog'::text, id, title, COALESCE("categorySlug", ''), "imageUrl"
  FROM catalog_items
  UNION ALL
  SELECT 'item'::text, i.id, i.title, COALESCE(l.title, ''), i."imageUrl"
  FROM items i
  LEFT JOIN lists l ON l.id = i."listId"
  WHERE i."deletedAt" IS NULL
  UNION ALL
  SELECT 'person'::text, p.id, p."displayName", p.role || '/' || p.slug, p."imageUrl"
  FROM person_profiles p
`;

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

async function fileMeta(filePath: string): Promise<{ bytes: number; width: number | null; height: number | null }> {
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

async function bannerSlots(q: string): Promise<MediaSlot[]> {
  const names = bannerNames().filter((name) => !q || name.toLowerCase().includes(q.toLowerCase()));
  const slots: MediaSlot[] = [];
  for (const name of names) {
    const meta = await fileMeta(path.join(BANNERS_DIR, name));
    const imageUrl = `/images/banners/${name}`;
    slots.push({
      key: `banner:${name}`,
      kind: 'banner',
      id: name,
      title: name,
      detail: 'فایل ثابت سایت',
      imageUrl,
      previewUrl: imageUrl,
      bytes: meta.bytes,
      width: meta.width,
      height: meta.height,
      canClear: false,
      editHref: null,
    });
  }
  return slots;
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

async function decorate(row: {
  kind: string;
  id: string;
  title: string;
  detail: string | null;
  url: string | null;
}): Promise<MediaSlot> {
  const kind = row.kind as MediaKind;
  const imageUrl = row.url?.trim() || null;
  let bytes: number | null = null;
  let width: number | null = null;
  let height: number | null = null;
  if (imageUrl?.startsWith('/images/')) {
    const file = publicFileFromUrl(imageUrl);
    if (file) {
      const meta = await fileMeta(file);
      bytes = meta.bytes;
      width = meta.width;
      height = meta.height;
    }
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
    width,
    height,
    canClear: kind !== 'banner',
    editHref: editHref(kind, row.id, row.detail?.trim() || ''),
  };
}

async function probeRemoteBytes(slots: MediaSlot[]): Promise<void> {
  await Promise.all(
    slots.map(async (slot) => {
      if (slot.bytes != null || !slot.imageUrl || !isPublicHttpUrl(slot.imageUrl)) return;
      try {
        const response = await fetch(slot.imageUrl, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(1200),
        });
        const length = Number(response.headers.get('content-length'));
        if (response.ok && Number.isFinite(length) && length > 0) slot.bytes = length;
      } catch {
        /* حجم نامشخص می‌ماند */
      }
    })
  );
}

export async function loadMediaLibrary(input: {
  filter: MediaFilter;
  q: string;
  missing: boolean;
  page: number;
}): Promise<MediaLibraryData> {
  const q = input.q.trim().slice(0, 80);
  const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
  const pattern = likePattern(q);
  const counts = emptyCounts();

  const grouped = await prisma.$queryRaw<{ kind: string; n: number }[]>(Prisma.sql`
    SELECT kind, COUNT(*)::int AS n
    FROM (${slotsFrom}) slots
    GROUP BY kind
  `);
  for (const row of grouped) {
    if (row.kind in counts) counts[row.kind as MediaKind] = Number(row.n);
  }
  counts.banner = bannerNames().length;
  counts.all = MEDIA_KINDS.reduce((sum, kind) => sum + (kind === 'banner' ? 0 : counts[kind]), 0);

  if (input.filter === 'banner') {
    const all = input.missing ? [] : await bannerSlots(q);
    const start = (page - 1) * PAGE_SIZE;
    return {
      slots: all.slice(start, start + PAGE_SIZE),
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
  `;

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ n: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS n FROM (${slotsFrom}) slots ${where}
    `),
    prisma.$queryRaw<{ kind: string; id: string; title: string; detail: string | null; url: string | null }[]>(
      Prisma.sql`
        SELECT kind, id, title, detail, url
        FROM (${slotsFrom}) slots
        ${where}
        ORDER BY kind, title, id
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
      `
    ),
  ]);

  const slots = await Promise.all(rows.map((row) => decorate(row)));
  await probeRemoteBytes(slots);

  return {
    slots,
    total: Number(countRows[0]?.n ?? 0),
    page,
    pageSize: PAGE_SIZE,
    counts,
  };
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

export async function importMediaAssignments(
  rows: { target: string; url: string }[]
): Promise<{ updated: number; errors: { target: string; error: string }[] }> {
  const errors: { target: string; error: string }[] = [];
  let updated = 0;
  for (const row of rows) {
    const target = parseMediaTarget(row.target);
    if (!target) {
      errors.push({ target: row.target, error: 'هدف نامعتبر است.' });
      continue;
    }
    const stored = await storeIncomingUrl(target.kind, row.url);
    if (!stored.ok) {
      errors.push({ target: row.target, error: stored.error });
      continue;
    }
    const written = await writeSlot(target, stored.url);
    if (!written.ok) {
      errors.push({ target: row.target, error: written.error });
      continue;
    }
    updated += 1;
  }
  return { updated, errors };
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
