import 'server-only';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImageFromUrlDetailed } from '@/lib/object-storage';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import {
  buildImageImportDownloadCandidates,
  buildPersonAvatarDownloadCandidates,
} from '@/lib/admin/import-external-image-to-storage';
import { CASTANDO_IMAGE_PROXY_PREFIX } from '@/lib/castando-image-proxy';
import { isTmdbImageUrl } from '@/lib/image-url-policy';
import {
  isAppObjectStorageImageUrl,
  needsS3MigrationImageUrl,
  resolveUrlForS3Migration,
} from '@/lib/item-image-storage';
import {
  personImageStorageStatus,
  personImageStatusForDiscovered,
  type PersonImageProfileRow,
  type PersonImageStatus,
} from '@/lib/person-image-utils';
import {
  discoverPeopleFromItems,
  getPersonProfileFlexible,
  upsertPersonProfile,
} from '@/lib/person-profiles-server';
import { getCachedDiscoveredPeople } from '@/lib/admin/person-discovery-cached';
import { resolvePersonPage } from '@/lib/people-server';
import type { PersonRole } from '@/lib/people';
import {
  enrichPersonFromTmdbByName,
  fetchTmdbPersonDetails,
  fetchTmdbPersonProfileImageUrl,
  tmdbProfileUrlFromPath,
} from '@/lib/person-enrich/tmdb-person';

export const PERSON_IMAGE_STORAGE_FOLDER = 'people';

export type PersonImageActionResult = {
  role: PersonRole;
  slug: string;
  displayName: string;
  status:
    | 'fetched'
    | 'migrated'
    | 'already_on_storage'
    | 'no_image'
    | 'skipped'
    | 'failed';
  previousUrl?: string | null;
  newUrl?: string | null;
  error?: string;
  errorCode?: 'storage_not_configured' | 'download_failed' | 'upload_failed' | 'tmdb';
};

export type PersonImageStats = {
  total: number;
  noImage: number;
  onStorage: number;
  external: number;
  tmdbCapable: number;
};

export type { PersonImageStatus };

export type PersonImageUploadOptions = {
  /** دانلود سریع با timeout کوتاه — برای import آواتار */
  fast?: boolean;
};

const PERSON_IMAGE_FAST_TIMEOUT_MS = 28_000;
const PERSON_IMAGE_RETRY_TIMEOUT_MS = 35_000;

export async function uploadPersonImageToStorage(
  sourceUrl: string,
  options?: PersonImageUploadOptions
): Promise<{ ok: true; url: string } | { ok: false; error: string; code?: string }> {
  const trimmed = sourceUrl.trim();
  if (!trimmed) {
    return { ok: false, error: 'آدرس تصویر خالی است' };
  }
  if (isAppObjectStorageImageUrl(trimmed)) {
    return { ok: true, url: trimmed };
  }

  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      ok: false,
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
      code: 'storage_not_configured',
    };
  }

  const candidates = options?.fast
    ? buildPersonAvatarDownloadCandidates(trimmed)
    : buildImageImportDownloadCandidates(trimmed);
  if (candidates.length === 0) {
    return { ok: false, error: 'آدرس تصویر نامعتبر است', code: 'download_failed' };
  }

  let lastError: { error: string; code?: string } = {
    error: 'دانلود تصویر ناموفق بود',
    code: 'download_failed',
  };

  const timeoutMs = options?.fast ? PERSON_IMAGE_FAST_TIMEOUT_MS : undefined;

  for (const downloadUrl of candidates) {
    const upload = await uploadImageFromUrlDetailed(
      downloadUrl,
      PERSON_IMAGE_STORAGE_FOLDER,
      'avatar',
      timeoutMs != null ? { timeoutMs } : undefined
    );
    if (upload.ok) {
      if (!isAppObjectStorageImageUrl(upload.url)) {
        return {
          ok: false,
          error: 'URL آپلودشده به ParsPack تشخیص داده نشد',
          code: 'upload_failed',
        };
      }
      return { ok: true, url: upload.url };
    }
    lastError = { error: upload.error, code: upload.code };
  }

  if (options?.fast && isTmdbImageUrl(trimmed)) {
    const retryCandidates = buildImageImportDownloadCandidates(trimmed).filter((url) =>
      url.startsWith(CASTANDO_IMAGE_PROXY_PREFIX)
    );
    for (const downloadUrl of retryCandidates) {
      const upload = await uploadImageFromUrlDetailed(
        downloadUrl,
        PERSON_IMAGE_STORAGE_FOLDER,
        'avatar',
        { timeoutMs: PERSON_IMAGE_RETRY_TIMEOUT_MS }
      );
      if (upload.ok) {
        if (!isAppObjectStorageImageUrl(upload.url)) {
          return {
            ok: false,
            error: 'URL آپلودشده به ParsPack تشخیص داده نشد',
            code: 'upload_failed',
          };
        }
        return { ok: true, url: upload.url };
      }
      lastError = { error: upload.error, code: upload.code };
    }
  }

  return { ok: false, error: lastError.error, code: lastError.code };
}

export type PersonImageJsonImportResult =
  | { ok: true; url: string; source: 'url' | 'tmdb'; tmdbId?: number | null }
  | { ok: false; error: string };

async function resolvePersonProfileImageUrlFromTmdb(
  displayName: string,
  options: { slug: string; externalUrl?: string | null; tmdbId?: number | null }
): Promise<{ imageUrl: string | null; tmdbId: number | null; error?: string }> {
  try {
    if (options.tmdbId) {
      const profile = await fetchTmdbPersonProfileImageUrl(options.tmdbId);
      if (!profile.imageUrl) {
        return {
          imageUrl: null,
          tmdbId: options.tmdbId,
          error: 'شخص در TMDB یافت شد اما عکس پروفایل ندارد',
        };
      }
      return { imageUrl: profile.imageUrl, tmdbId: options.tmdbId };
    }
    const enriched = await enrichPersonFromTmdbByName(displayName, {
      slug: options.slug,
      externalUrl: options.externalUrl ?? null,
    });
    if (!enriched.imageUrl) {
      return {
        imageUrl: null,
        tmdbId: enriched.tmdbId,
        error: 'شخص در TMDB یافت شد اما عکس پروفایل ندارد',
      };
    }
    return { imageUrl: enriched.imageUrl, tmdbId: enriched.tmdbId };
  } catch (err) {
    return {
      imageUrl: null,
      tmdbId: options.tmdbId ?? null,
      error: err instanceof Error ? err.message : 'خطا در TMDB',
    };
  }
}

/** import JSON — TMDB API اول (برای کارگردان/بازیگر)، سپس URL JSON */
export async function importPersonImageFromJson(
  _client: PrismaClient,
  role: PersonRole,
  slug: string,
  displayName: string,
  imageUrl: string,
  existing?: { externalUrl?: string | null; tmdbId?: number | null }
): Promise<PersonImageJsonImportResult> {
  const trimmed = imageUrl.trim();
  const isMediaRole = role === 'actor' || role === 'director';
  const fast = { fast: true as const };
  let tmdbLookupError: string | undefined;

  if (isMediaRole) {
    const tmdb = await resolvePersonProfileImageUrlFromTmdb(displayName, {
      slug,
      externalUrl: existing?.externalUrl,
      tmdbId: existing?.tmdbId,
    });
    tmdbLookupError = tmdb.error;

    if (tmdb.imageUrl) {
      const stored = await uploadPersonImageToStorage(tmdb.imageUrl, fast);
      if (stored.ok) {
        return { ok: true, url: stored.url, source: 'tmdb', tmdbId: tmdb.tmdbId };
      }
      if (trimmed && !isTmdbImageUrl(trimmed)) {
        const fromJson = await uploadPersonImageToStorage(trimmed, fast);
        if (fromJson.ok) {
          return { ok: true, url: fromJson.url, source: 'url', tmdbId: tmdb.tmdbId };
        }
        return {
          ok: false,
          error: `TMDB: ${stored.error} · JSON: ${fromJson.error}`,
        };
      }
      return { ok: false, error: `TMDB: ${stored.error}${tmdb.error ? ` · ${tmdb.error}` : ''}` };
    }

    if (tmdb.error?.includes('کلید TMDB')) {
      return { ok: false, error: tmdb.error };
    }

    if (trimmed && !isTmdbImageUrl(trimmed)) {
      const fromJson = await uploadPersonImageToStorage(trimmed, fast);
      if (fromJson.ok) {
        return { ok: true, url: fromJson.url, source: 'url', tmdbId: tmdb.tmdbId };
      }
      return {
        ok: false,
        error: tmdb.error
          ? `${tmdb.error} · JSON: ${fromJson.error}`
          : fromJson.error,
      };
    }

    return {
      ok: false,
      error:
        tmdb.error ??
        (trimmed && isTmdbImageUrl(trimmed)
          ? 'تصویر در TMDB یافت نشد — URLهای TMDB در JSON نادیده گرفته می‌شوند؛ imageUrl را خالی بگذارید'
          : 'تصویر در TMDB یافت نشد'),
    };
  }

  if (trimmed && isTmdbImageUrl(trimmed)) {
    return {
      ok: false,
      error: 'URLهای TMDB در JSON پشتیبانی نمی‌شوند — imageUrl را خالی بگذارید تا از API جستجو شود',
    };
  }

  if (trimmed) {
    const stored = await uploadPersonImageToStorage(trimmed, fast);
    if (stored.ok) {
      return { ok: true, url: stored.url, source: 'url' };
    }
    return {
      ok: false,
      error: isMediaRole
        ? `${stored.error}${tmdbLookupError ? ` · TMDB: ${tmdbLookupError}` : ' · تصویر در TMDB یافت نشد'}`
        : stored.error,
    };
  }

  return {
    ok: false,
    error: isMediaRole
      ? 'تصویر در TMDB یافت نشد — imageUrl را خالی بگذارید یا URL معتبر بدهید'
      : 'آدرس تصویر خالی است',
  };
}

async function resolvePersonContext(
  client: PrismaClient,
  role: PersonRole,
  slug: string
) {
  const pageData = await resolvePersonPage(client, role, slug, { forAdmin: true });
  const displayName = pageData?.displayName ?? slug.replace(/-/g, ' ');
  const existing = await getPersonProfileFlexible(client, role, slug, displayName);
  return { pageData, existing, displayName: existing?.displayName ?? displayName };
}

export async function migratePersonImageToStorage(
  client: PrismaClient,
  role: PersonRole,
  slug: string
): Promise<PersonImageActionResult> {
  const { existing, displayName } = await resolvePersonContext(client, role, slug);
  const previousUrl = existing?.imageUrl ?? null;

  if (!previousUrl?.trim()) {
    return { role, slug, displayName, status: 'no_image', error: 'تصویری برای این شخص ثبت نشده' };
  }

  if (!needsS3MigrationImageUrl(previousUrl)) {
    return {
      role,
      slug,
      displayName,
      status: 'already_on_storage',
      previousUrl,
      newUrl: previousUrl,
    };
  }

  const uploaded = await uploadPersonImageToStorage(previousUrl);
  if (!uploaded.ok) {
    return {
      role,
      slug,
      displayName,
      status: 'failed',
      previousUrl,
      error: uploaded.error,
      errorCode: uploaded.code as PersonImageActionResult['errorCode'],
    };
  }

  await upsertPersonProfile(client, {
    role,
    slug,
    displayName,
    imageUrl: uploaded.url,
    status: existing?.status ?? 'published',
    bio: existing?.bio ?? undefined,
    externalUrl: existing?.externalUrl ?? undefined,
    tmdbId: existing?.tmdbId ?? undefined,
  });

  return {
    role,
    slug,
    displayName,
    status: 'migrated',
    previousUrl,
    newUrl: uploaded.url,
  };
}

export async function fetchPersonImageFromTmdb(
  client: PrismaClient,
  role: PersonRole,
  slug: string
): Promise<PersonImageActionResult> {
  if (role !== 'actor' && role !== 'director') {
    return {
      role,
      slug,
      displayName: slug,
      status: 'failed',
      error: 'دریافت خودکار تصویر فقط برای بازیگر و کارگردان پشتیبانی می‌شود',
      errorCode: 'tmdb',
    };
  }

  const { existing, displayName, pageData } = await resolvePersonContext(client, role, slug);
  if (!pageData && !existing) {
    return { role, slug, displayName, status: 'failed', error: 'شخص در آیتم‌های سایت یافت نشد' };
  }

  let sourceUrl: string | null = null;
  let tmdbId = existing?.tmdbId ?? null;
  let resolvedName = displayName;

  try {
    if (tmdbId) {
      const profile = await fetchTmdbPersonProfileImageUrl(tmdbId);
      sourceUrl = profile.imageUrl;
      const details = await fetchTmdbPersonDetails(tmdbId);
      if (details?.name) resolvedName = details.name;
    } else {
      const enriched = await enrichPersonFromTmdbByName(displayName, {
        slug,
        externalUrl: existing?.externalUrl ?? null,
      });
      sourceUrl = enriched.imageUrl;
      tmdbId = enriched.tmdbId;
      resolvedName = enriched.displayName;
    }
  } catch (err) {
    return {
      role,
      slug,
      displayName,
      status: 'failed',
      error: err instanceof Error ? err.message : 'خطا در TMDB',
      errorCode: 'tmdb',
    };
  }

  if (!sourceUrl) {
    return { role, slug, displayName: resolvedName, status: 'no_image', error: 'تصویر در TMDB یافت نشد' };
  }

  const uploaded = await uploadPersonImageToStorage(sourceUrl, { fast: true });
  if (!uploaded.ok) {
    return {
      role,
      slug,
      displayName: resolvedName,
      status: 'failed',
      previousUrl: sourceUrl,
      error: uploaded.error,
      errorCode: uploaded.code as PersonImageActionResult['errorCode'],
    };
  }

  await upsertPersonProfile(client, {
    role,
    slug,
    displayName: resolvedName,
    imageUrl: uploaded.url,
    tmdbId,
    status: existing?.status ?? 'published',
    bio: existing?.bio ?? undefined,
    externalUrl: existing?.externalUrl ?? undefined,
  });

  return {
    role,
    slug,
    displayName: resolvedName,
    status: 'fetched',
    previousUrl: sourceUrl,
    newUrl: uploaded.url,
  };
}

export async function getPersonImageStats(
  client: PrismaClient = prisma,
  role?: PersonRole
): Promise<PersonImageStats> {
  const [people, profiles] = await Promise.all([
    getCachedDiscoveredPeople(),
    client.person_profiles.findMany({
      where: role ? { role } : undefined,
      select: { role: true, slug: true, displayName: true, imageUrl: true, externalUrl: true },
    }),
  ]);

  const filteredPeople = role ? people.filter((person) => person.role === role) : people;
  const profileRows = profiles.map((profile) => ({
    role: profile.role as PersonRole,
    slug: profile.slug,
    displayName: profile.displayName,
    imageUrl: profile.imageUrl,
    externalUrl: profile.externalUrl,
  }));

  const stats: PersonImageStats = {
    total: filteredPeople.length,
    noImage: 0,
    onStorage: 0,
    external: 0,
    tmdbCapable: 0,
  };

  for (const person of filteredPeople) {
    if (person.role === 'actor' || person.role === 'director') {
      stats.tmdbCapable += 1;
    }

    const status = personImageStatusForDiscovered(person, profileRows);
    if (status === 'none') stats.noImage += 1;
    else if (status === 'storage') stats.onStorage += 1;
    else stats.external += 1;
  }

  return stats;
}

export type PersonImageCandidate = {
  role: PersonRole;
  slug: string;
  displayName: string;
};

async function loadPersonImageProfiles(
  client: PrismaClient,
  role?: PersonRole
): Promise<PersonImageProfileRow[]> {
  const profiles = await client.person_profiles.findMany({
    where: role ? { role } : undefined,
    select: {
      role: true,
      slug: true,
      displayName: true,
      imageUrl: true,
      externalUrl: true,
    },
  });
  return profiles.map((profile) => ({
    role: profile.role as PersonRole,
    slug: profile.slug,
    displayName: profile.displayName,
    imageUrl: profile.imageUrl,
    externalUrl: profile.externalUrl,
  }));
}

export async function listPersonImageCandidates(
  client: PrismaClient,
  action: 'fetch_tmdb' | 'migrate_storage',
  options?: { role?: PersonRole; limit?: number; onlyMissing?: boolean }
): Promise<{ candidates: PersonImageCandidate[]; remaining: number }> {
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const { people } = await discoverPeopleFromItems(client, {
    role: options?.role,
    skipPagination: true,
  });
  const profiles = await loadPersonImageProfiles(client, options?.role);

  const filtered = people.filter((person) => {
    if (action === 'fetch_tmdb' && person.role !== 'actor' && person.role !== 'director') {
      return false;
    }
    const status = personImageStatusForDiscovered(person, profiles);
    if (options?.onlyMissing !== false) {
      if (action === 'fetch_tmdb') return status === 'none' || status === 'external';
      return status === 'external';
    }
    if (action === 'migrate_storage') return status === 'external';
    return status !== 'storage';
  });

  const remaining = Math.max(0, filtered.length - limit);
  const candidates = filtered.slice(0, limit).map((person) => ({
    role: person.role,
    slug: person.slug,
    displayName: person.displayName,
  }));

  return { candidates, remaining };
}

export async function bulkProcessPersonImages(
  client: PrismaClient,
  action: 'fetch_tmdb' | 'migrate_storage',
  options?: { role?: PersonRole; limit?: number; onlyMissing?: boolean }
): Promise<{
  results: PersonImageActionResult[];
  summary: { processed: number; fetched: number; migrated: number; failed: number; skipped: number };
  remaining: number;
}> {
  const { candidates, remaining } = await listPersonImageCandidates(client, action, options);

  const results: PersonImageActionResult[] = [];
  let fetched = 0;
  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  for (const person of candidates) {
    const result =
      action === 'fetch_tmdb'
        ? await fetchPersonImageFromTmdb(client, person.role, person.slug)
        : await migratePersonImageToStorage(client, person.role, person.slug);

    results.push(result);
    if (result.status === 'fetched') fetched += 1;
    else if (result.status === 'migrated') migrated += 1;
    else if (result.status === 'failed') failed += 1;
    else skipped += 1;
  }

  return {
    results,
    summary: { processed: results.length, fetched, migrated, failed, skipped },
    remaining,
  };
}

export type PersonMissingImageRecord = PersonImageCandidate & {
  itemCount: number;
  imageStatus: PersonImageStatus;
};

export type PersonImageListFilter = 'all' | 'none' | 'has' | 'storage' | 'external' | 'missing';

function matchesPersonImageFilter(
  status: PersonImageStatus,
  filter: PersonImageListFilter
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'none':
      return status === 'none';
    case 'has':
      return status !== 'none';
    case 'storage':
      return status === 'storage';
    case 'external':
      return status === 'external';
    case 'missing':
      return status !== 'storage';
    default:
      return true;
  }
}

/** همهٔ اشخاص کشف‌شده با وضعیت تصویر */
export async function listDiscoveredPeopleWithImageStatus(
  client: PrismaClient,
  options?: { role?: PersonRole; imageFilter?: PersonImageListFilter }
): Promise<PersonMissingImageRecord[]> {
  const filter = options?.imageFilter ?? 'all';
  const { people } = await discoverPeopleFromItems(client, {
    role: options?.role,
    skipPagination: true,
  });
  const profiles = await loadPersonImageProfiles(client, options?.role);

  return people
    .map((person) => ({
      role: person.role,
      slug: person.slug,
      displayName: person.displayName,
      itemCount: person.itemCount,
      imageStatus: personImageStatusForDiscovered(person, profiles),
    }))
    .filter((person) => matchesPersonImageFilter(person.imageStatus, filter));
}

/** اشخاصی که تصویرشان روی ParsPack نیست (بدون تصویر یا لینک خارجی) */
export async function listPeopleMissingStorageImage(
  client: PrismaClient,
  options?: { role?: PersonRole; onlyNoImage?: boolean; imageFilter?: PersonImageListFilter }
): Promise<PersonMissingImageRecord[]> {
  const imageFilter =
    options?.imageFilter ??
    (options?.onlyNoImage ? 'none' : 'missing');
  return listDiscoveredPeopleWithImageStatus(client, {
    role: options?.role,
    imageFilter,
  });
}
