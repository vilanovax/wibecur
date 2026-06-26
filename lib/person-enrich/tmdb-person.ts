import axios from 'axios';
import { resolveTmdbApiKey } from '@/lib/movie-api-keys';

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

function tmdbProfileUrl(path: string | null): string | null {
  if (!path?.trim()) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
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

  return results.slice(0, limit).map((row: Record<string, unknown>) => ({
    id: Number(row.id),
    name: String(row.name ?? ''),
    profilePath: typeof row.profile_path === 'string' ? row.profile_path : null,
    knownForDepartment:
      typeof row.known_for_department === 'string' ? row.known_for_department : null,
  }));
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

export async function enrichPersonFromTmdbByName(displayName: string): Promise<{
  tmdbId: number;
  displayName: string;
  bio: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
}> {
  const matches = await searchTmdbPeople(displayName, 5);
  if (matches.length === 0) {
    throw new Error('شخصی در TMDB پیدا نشد');
  }

  const normalized = displayName.trim().toLowerCase();
  const best =
    matches.find((m) => m.name.trim().toLowerCase() === normalized) ?? matches[0];

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
