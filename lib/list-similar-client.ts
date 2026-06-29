export type SimilarListClient = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  categories: { id: string; name: string; slug: string; icon: string } | null;
};

const inflight = new Map<string, Promise<SimilarListClient[]>>();
const resolved = new Map<string, SimilarListClient[]>();

function similarApiUrl(slug: string): string {
  return `/api/lists/similar?slug=${encodeURIComponent(slug)}`;
}

function parseSimilarResponse(json: unknown): SimilarListClient[] {
  if (!json || typeof json !== 'object') return [];
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as SimilarListClient[]) : [];
}

/** Prefetch / dedupe fetch for similar lists (client-side). */
export function prefetchListSimilar(slug: string): void {
  if (!slug?.trim() || inflight.has(slug) || resolved.has(slug)) return;

  const request = fetch(similarApiUrl(slug))
    .then((res) => res.json())
    .then((json) => {
      const lists = parseSimilarResponse(json);
      resolved.set(slug, lists);
      return lists;
    })
    .catch(() => {
      resolved.set(slug, []);
      return [] as SimilarListClient[];
    })
    .finally(() => {
      inflight.delete(slug);
    });

  inflight.set(slug, request);
}

export function fetchListSimilar(slug: string): Promise<SimilarListClient[]> {
  if (resolved.has(slug)) {
    return Promise.resolve(resolved.get(slug)!);
  }

  const pending = inflight.get(slug);
  if (pending) return pending;

  prefetchListSimilar(slug);
  return inflight.get(slug) ?? Promise.resolve([]);
}
