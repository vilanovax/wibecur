import { getDecryptedSettings } from '@/lib/settings';

export async function resolveTmdbApiKey(): Promise<string | null> {
  try {
    const settings = await getDecryptedSettings();
    if (settings.tmdbApiKey?.trim()) return settings.tmdbApiKey.trim();
  } catch {
    // DB unavailable — env fallback
  }
  return process.env.TMDB_API_KEY?.trim() || null;
}

export async function resolveOmdbApiKey(): Promise<string | null> {
  try {
    const settings = await getDecryptedSettings();
    if (settings.omdbApiKey?.trim()) return settings.omdbApiKey.trim();
  } catch {
    // DB unavailable — env fallback
  }
  return process.env.OMDB_API_KEY?.trim() || null;
}
