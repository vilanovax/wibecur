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
  const score = (match: TmdbPersonSearchResult): number => {
    let s = 0;
    const name = match.name.trim().toLowerCase();
    if (normalized && name === normalized) s += 100;
    else if (normalized && name.includes(normalized)) s += 40;
    if (match.profilePath) s += 50;
    if (match.knownForDepartment === 'Directing') s += 10;
    if (match.knownForDepartment === 'Acting') s += 5;
    return s;
  };

  return [...matches].sort((a, b) => score(b) - score(a))[0] ?? null;
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
    const candidateScore = (candidate.profilePath ? 50 : 0) + (candidate.knownForDepartment === 'Directing' ? 10 : 0);
    const bestScore = (bestMatch.profilePath ? 50 : 0) + (bestMatch.knownForDepartment === 'Directing' ? 10 : 0);
    if (candidateScore > bestScore) {
      bestMatch = candidate;
    }
  }

  if (!bestMatch) {
    throw new Error('شخصی در TMDB پیدا نشد');
  }

  return bestMatch;
}

export async function fetchTmdbPersonProfileImageUrl(
  personId: number
): Promise<{ imageUrl: string | null; profilePath: string | null }> {
  const details = await fetchTmdbPersonDetails(personId);
  if (details?.profilePath) {
    return { imageUrl: tmdbProfileUrl(details.profilePath), profilePath: details.profilePath };
  }

  const apiKey = await resolveTmdbApiKey();
  if (!apiKey?.trim()) {
    throw new Error('کلید TMDB در تنظیمات تنظیم نشده است');
  }

  const url = `https://api.themoviedb.org/3/person/${personId}/images?api_key=${apiKey}`;
  const response = await axios.get(url, { timeout: 12000 });
  const profiles = response.data?.profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return { imageUrl: null, profilePath: null };
  }

  const best = [...profiles].sort(
    (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(b.vote_average ?? 0) - Number(a.vote_average ?? 0)
  )[0] as Record<string, unknown> | undefined;

  const profilePath = typeof best?.file_path === 'string' ? best.file_path : null;
  return { imageUrl: tmdbProfileUrl(profilePath), profilePath };
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

  const profile = await fetchTmdbPersonProfileImageUrl(best.id);

  const bio =
    details.biography ||
    (best.knownForDepartment ? `حوزه: ${best.knownForDepartment}` : null);

  return {
    tmdbId: details.id,
    displayName: details.name || best.name,
    bio,
    imageUrl: profile.imageUrl,
    externalUrl: details.homepage,
  };
}
