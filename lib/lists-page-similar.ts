export type SimilarListInput = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  categoryId?: string | null;
  saveCount?: number;
  itemCount?: number;
  isFeatured?: boolean;
  categories?: { name: string; icon: string | null; slug?: string | null } | null;
  users?: { name: string | null; username: string | null; image: string | null } | null;
  _count?: { items: number; list_likes: number };
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) {
    if (b.has(w)) n += 1;
  }
  return n;
}

/** انتخاب لیست‌های مشابه از دادهٔ موجود صفحه (بدون API) */
export function pickSimilarLists<T extends SimilarListInput>(
  anchor: T,
  pool: T[],
  excludeIds: Set<string>,
  limit = 3
): T[] {
  if (pool.length === 0) return [];

  const anchorTokens = tokenize(`${anchor.title} ${anchor.description ?? ''}`);

  const scored = pool
    .filter((l) => l.id !== anchor.id && !excludeIds.has(l.id))
    .map((candidate) => {
      let score = 0;
      if (candidate.categoryId && candidate.categoryId === anchor.categoryId) score += 4;
      const candidateTokens = tokenize(`${candidate.title} ${candidate.description ?? ''}`);
      score += overlapScore(anchorTokens, candidateTokens) * 1.5;
      score += Math.min((candidate.saveCount ?? 0) / 40, 2);
      if (candidate.isFeatured) score += 0.5;
      return { candidate, score };
    })
    .filter((x) => x.score > 0.5)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, limit).map((x) => x.candidate);
  }

  return pool
    .filter((l) => l.id !== anchor.id && !excludeIds.has(l.id))
    .sort((a, b) => (b.saveCount ?? 0) - (a.saveCount ?? 0))
    .slice(0, limit);
}

export function similarListsForSection<T extends SimilarListInput>(
  sectionLists: T[],
  previewCount: number,
  limit = 3
): T[] {
  if (sectionLists.length <= previewCount) return [];

  const preview = sectionLists.slice(0, previewCount);
  const anchor = preview[0];
  if (!anchor) return [];

  const excludeIds = new Set(preview.map((l) => l.id));
  const fromSameSection = sectionLists.slice(previewCount);

  const similar = pickSimilarLists(anchor, fromSameSection, excludeIds, limit);
  if (similar.length >= 2) return similar;

  return fromSameSection.slice(0, limit);
}
