const STORAGE_KEY = 'wibe-admin-item-tips-reviewed';

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

export function getReviewedItemTipIds(): Set<string> {
  return readReviewedIds();
}

export function markItemTipReviewed(itemId: string): Set<string> {
  const next = readReviewedIds();
  next.add(itemId);
  writeReviewedIds(next);
  return next;
}

export function unmarkItemTipReviewed(itemId: string): Set<string> {
  const next = readReviewedIds();
  next.delete(itemId);
  writeReviewedIds(next);
  return next;
}

export function markManyItemTipsReviewed(itemIds: string[]): Set<string> {
  const next = readReviewedIds();
  for (const id of itemIds) next.add(id);
  writeReviewedIds(next);
  return next;
}
