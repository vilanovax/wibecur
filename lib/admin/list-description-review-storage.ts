const STORAGE_KEY = 'wibe-admin-list-descriptions-reviewed';

function readReviewedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

function writeReviewedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function getReviewedListDescriptionIds(): Set<string> {
  return readReviewedIds();
}

export function markListDescriptionReviewed(listId: string): Set<string> {
  const next = readReviewedIds();
  next.add(listId);
  writeReviewedIds(next);
  return next;
}

export function unmarkListDescriptionReviewed(listId: string): Set<string> {
  const next = readReviewedIds();
  next.delete(listId);
  writeReviewedIds(next);
  return next;
}

export function markManyListDescriptionsReviewed(listIds: string[]): Set<string> {
  const next = readReviewedIds();
  for (const id of listIds) next.add(id);
  writeReviewedIds(next);
  return next;
}

export function clearAllReviewedListDescriptions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
