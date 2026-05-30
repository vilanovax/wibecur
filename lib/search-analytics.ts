import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH, SEARCH_SUGGESTIONS } from '@/lib/list-search';

const TRENDING_WINDOW_DAYS = 7;
const TRENDING_DEFAULT_LIMIT = 6;

export type TrendingQuery = {
  query: string;
  count: number;
};

export function getFallbackTrendingQueries(limit = TRENDING_DEFAULT_LIMIT): TrendingQuery[] {
  return SEARCH_SUGGESTIONS.slice(0, limit).map((item, index) => ({
    query: item.query,
    count: Math.max(1, 5 - index),
  }));
}

export async function logSearchQuery(raw: string, source?: string): Promise<void> {
  const normalized = normalizeSearchQuery(raw);
  if (normalized.length < SEARCH_MIN_LENGTH) return;

  const displayQuery = raw.trim().replace(/\s+/g, ' ');

  try {
    await dbQuery(() =>
      prisma.search_query_stats.upsert({
        where: { normalizedQuery: normalized },
        create: {
          normalizedQuery: normalized,
          displayQuery,
          searchCount: 1,
          lastSearchedAt: new Date(),
        },
        update: {
          displayQuery,
          searchCount: { increment: 1 },
          lastSearchedAt: new Date(),
        },
      })
    );
  } catch (error) {
    // جدول ممکن است هنوز migrate نشده باشد
    if (process.env.NODE_ENV === 'development') {
      console.warn('logSearchQuery skipped:', (error as Error)?.message, source);
    }
  }
}

export async function getTrendingSearchQueries(
  limit = TRENDING_DEFAULT_LIMIT
): Promise<{ queries: TrendingQuery[]; source: 'analytics' | 'fallback' }> {
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  try {
    const rows = await dbQuery(() =>
      prisma.search_query_stats.findMany({
        where: { lastSearchedAt: { gte: since } },
        orderBy: [{ searchCount: 'desc' }, { lastSearchedAt: 'desc' }],
        take: safeLimit,
        select: {
          displayQuery: true,
          normalizedQuery: true,
          searchCount: true,
        },
      })
    );

    if (rows.length === 0) {
      return { queries: getFallbackTrendingQueries(safeLimit), source: 'fallback' };
    }

    return {
      queries: rows.map((row) => ({
        query: row.displayQuery || row.normalizedQuery,
        count: row.searchCount,
      })),
      source: 'analytics',
    };
  } catch {
    return { queries: getFallbackTrendingQueries(safeLimit), source: 'fallback' };
  }
}
