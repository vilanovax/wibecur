import axios from 'axios';
import { resolveTmdbApiKey } from '@/lib/movie-api-keys';
import { extractImdbNameId, isLatinPersonSlug } from '@/lib/people';

export type TmdbPersonSearchResult = {
  id: number;
  name: string;
  profilePath: string | null;
  knownForDepartment: string | null;
};

export type TmdbPersonDetails = {
  id: number;
  name: string;
  biography: string | null;
  profilePath: string | null;
  homepage: string | null;
};

export type EnrichPersonFromTmdbOptions = {
  slug?: string;
  externalUrl?: string | null;
};

function tmdbProfileUrl(path: string | null): string | null {
  if (!path?.trim()) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function tmdbProfileUrlFromPath(path: string | null): string | null {
  return tmdbProfileUrl(path);
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** نام‌های جستجو — slug لاتین و بخش‌های انگلیسی displayName */
export function buildTmdbPersonSearchQueries(
  displayName: string,
  options?: EnrichPersonFromTmdbOptions
): string[] {
  const queries = new Set<string>();
  const add = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed && trimmed.length >= 2) queries.add(trimmed);
  };

  add(displayName);
  for (const part of displayName.split(/[·|]/)) {
    add(part.trim());
  }

  const latinSegment = displayName.match(/[A-Za-z][A-Za-z\s.'-]{1,}/)?.[0]?.trim();
  add(latinSegment);

  if (options?.slug && isLatinPersonSlug(options.slug)) {
    add(titleCaseFromSlug(options.slug));
  }

  return [...queries];
}

function mapTmdbPersonRow(row: Record<string, unknown>): TmdbPersonSearchResult {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    profilePath: typeof row.profile_path === 'string' ? row.profile_path : null,
    knownForDepartment:
      typeof row.known_for_department === 'string' ? row.known_for_department : null,
  };
}

export async function findTmdbPersonByImdbId(
  imdbNumericId: string
): Promise<TmdbPersonSearchResult | null> {
  const apiKey = await resolveTmdbApiKey();
  if (!apiKey?.trim()) {
    throw new Error('کلید TMDB در تنظیمات تنظیم نشده است');
  }

  const externalId = imdbNumericId.startsWith('nm') ? imdbNumericId : `nm${imdbNumericId}`;
  const url = `https://api.themoviedb.org/3/find/${encodeURIComponent(externalId)}?external_source=imdb_id&api_key=${apiKey}`;
  const response = await axios.get(url, { timeout: 12000 });
  const results = response.data?.person_results;
  if (!Array.isArray(results) || results.length === 0) return null;
  return mapTmdbPersonRow(results[0] as Record<string, unknown>);
}

export async function searchTmdbPeople(
  query: string,
  limit = 8
): Promise<TmdbPersonSearchResult[]> {
  const apiKey = await resolveTmdbApiKey();
  if (!apiKey?.trim()) {
    throw new Error('کلید TMDB در تنظیمات تنظیم نشده است');
  }

  const url = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(query.trim())}&language=en-US&page=1`;
  const response = await axios.get(url, { timeout: 12000 });
  const results = response.data?.results;
  if (!Array.isArray(results)) return [];

  return results.slice(0, limit).map((row) => mapTmdbPersonRow(row as Record<string, unknown>));
}

async function pickBestTmdbMatch(
  matches: TmdbPersonSearchResult[],
  preferredName?: string
): Promise<TmdbPersonSearchResult | null> {
  if (matches.length === 0) return null;
  const normalized = preferredName?.trim().toLowerCase();
  if (normalized) {
    const exact = matches.find((match) => match.name.trim().toLowerCase() === normalized);
    if (exact) return exact;
  }
  const withPhoto = matches.find((match) => match.profilePath);
  return withPhoto ?? matches[0] ?? null;
}

async function resolveTmdbPersonMatch(
  displayName: string,
  options?: EnrichPersonFromTmdbOptions
): Promise<TmdbPersonSearchResult> {
  const imdbId = extractImdbNameId(options?.externalUrl);
  if (imdbId) {
    const fromImdb = await findTmdbPersonByImdbId(imdbId);
    if (fromImdb) return fromImdb;
  }

  const queries = buildTmdbPersonSearchQueries(displayName, options);
  let bestMatch: TmdbPersonSearchResult | null = null;

  for (const query of queries) {
    const matches = await searchTmdbPeople(query, 5);
    const candidate = await pickBestTmdbMatch(matches, query);
    if (!candidate) continue;
    if (!bestMatch) {
      bestMatch = candidate;
      continue;
    }
    if (!bestMatch.profilePath && candidate.profilePath) {
      bestMatch = candidate;
    }
  }

  if (!bestMatch) {
    throw new Error('شخصی در TMDB پیدا نشد');
  }

  return bestMatch;
}

export async function fetchTmdbPersonDetails(personId: number): Promise<TmdbPersonDetails | null> {
  const apiKey = await resolveTmdbApiKey();
  if (!apiKey?.trim()) {
    throw new Error('کلید TMDB در تنظیمات تنظیم نشده است');
  }

  const url = `https://api.themoviedb.org/3/person/${personId}?api_key=${apiKey}&language=fa-IR`;
  const response = await axios.get(url, { timeout: 12000 });
  const data = response.data;
  if (!data || typeof data !== 'object') return null;

  return {
    id: Number(data.id),
    name: String(data.name ?? ''),
    biography: typeof data.biography === 'string' && data.biography.trim() ? data.biography.trim() : null,
    profilePath: typeof data.profile_path === 'string' ? data.profile_path : null,
    homepage: typeof data.homepage === 'string' && data.homepage.trim() ? data.homepage.trim() : null,
  };
}

export async function enrichPersonFromTmdbByName(
  displayName: string,
  options?: EnrichPersonFromTmdbOptions
): Promise<{
  tmdbId: number;
  displayName: string;
  bio: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
}> {
  const best = await resolveTmdbPersonMatch(displayName, options);

  const details = await fetchTmdbPersonDetails(best.id);
  if (!details) {
    throw new Error('جزئیات شخص در TMDB دریافت نشد');
  }

  const bio =
    details.biography ||
    (best.knownForDepartment ? `حوزه: ${best.knownForDepartment}` : null);

  return {
    tmdbId: details.id,
    displayName: details.name || best.name,
    bio,
    imageUrl: tmdbProfileUrl(details.profilePath ?? best.profilePath),
    externalUrl: details.homepage,
  };
}
