import axios from 'axios';

export type TmdbPosterSearchInput = {
  title: string;
  year?: number | string | null;
  /** عناوین جایگزین برای جستجو (مثلاً انگلیسی) */
  alternativeTitles?: string[];
};

function parseYear(raw?: number | string | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 1800 && n <= 2100 ? n : undefined;
}

function uniqueQueries(input: TmdbPosterSearchInput): string[] {
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const q of [input.title, ...(input.alternativeTitles ?? [])]) {
    const t = q?.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(t);
  }
  return queries;
}

async function searchTmdbPosterOnce(
  query: string,
  apiKey: string,
  language: string,
  year?: number
): Promise<string | null> {
  const yearParam = year ? `&year=${year}` : '';
  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}&page=1${yearParam}`;
  const response = await axios.get(searchUrl, { timeout: 10000 });
  const first = response.data?.results?.[0];
  if (!first?.poster_path) return null;
  return `https://image.tmdb.org/t/p/w500${first.poster_path}`;
}

/** جستجوی poster فیلم از TMDB — fa-IR سپس en-US، با year اختیاری */
export async function fetchTmdbPosterUrl(
  apiKey: string,
  input: TmdbPosterSearchInput
): Promise<string | null> {
  const year = parseYear(input.year);
  const queries = uniqueQueries(input);

  for (const query of queries) {
    for (const language of ['fa-IR', 'en-US'] as const) {
      const poster = await searchTmdbPosterOnce(query, apiKey, language, year);
      if (poster) return poster;
    }
    if (year) {
      for (const language of ['fa-IR', 'en-US'] as const) {
        const poster = await searchTmdbPosterOnce(query, apiKey, language);
        if (poster) return poster;
      }
    }
  }

  return null;
}

/** عناوین seed عمومی که TMDB نتیجه معتبر نمی‌دهد */
export function isGenericSeedMovieTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return true;
  return /^فیلم\s+(درام|کمدی|ترسناک|علمی|مستند|جنایی|فانتزی|اکشن)/u.test(t);
}

export function extractPosterSearchTitles(
  title: string,
  metadata?: Record<string, unknown> | null
): string[] {
  const alt: string[] = [];
  if (!metadata) return alt;

  for (const key of ['originalTitle', 'englishTitle', 'enTitle', 'titleEn']) {
    const val = metadata[key];
    if (typeof val === 'string' && val.trim()) alt.push(val.trim());
  }

  return alt;
}
