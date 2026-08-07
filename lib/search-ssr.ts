import 'server-only';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { unifiedSearch, type UnifiedSearchResult } from '@/lib/unified-search';
import { SEARCH_ITEMS_ONLY_LIMITS } from '@/lib/search-client';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';

/** SSR seed for /search?q= — items tab first paint (async-suspense-boundaries). */
export async function fetchSearchPageSeed(
  rawQuery: string | undefined
): Promise<UnifiedSearchResult | null> {
  const q = normalizeSearchQuery(rawQuery ?? '');
  if (q.length < SEARCH_MIN_LENGTH) return null;

  return dbQuery(() =>
    unifiedSearch(prisma, q, {
      listLimit: SEARCH_ITEMS_ONLY_LIMITS.listLimit,
      directItemLimit: SEARCH_ITEMS_ONLY_LIMITS.directItemLimit,
      indirectItemLimit: SEARCH_ITEMS_ONLY_LIMITS.indirectItemLimit,
      relatedLimit: SEARCH_ITEMS_ONLY_LIMITS.relatedLimit,
      fast: SEARCH_ITEMS_ONLY_LIMITS.fast,
    })
  );
}
