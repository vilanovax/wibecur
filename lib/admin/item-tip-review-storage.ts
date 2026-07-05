const STORAGE_KEY = 'wibe-admin-item-tips-reviewed';

export type ItemTipReviewRef = {
  id: string;
  catalogItemId: string | null;
};

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

/** کلید پایدار برای «انجام شد» — یک موجودیت کاتالوگ در همه لیست‌ها */
export function getItemTipReviewKey(row: ItemTipReviewRef): string {
  return row.catalogItemId ?? row.id;
}

export function isItemTipReviewed(row: ItemTipReviewRef, reviewedIds: Set<string>): boolean {
  const key = getItemTipReviewKey(row);
  return reviewedIds.has(key) || reviewedIds.has(row.id);
}

/** مهاجرت کلیدهای قدیمی placement به catalogItemId وقتی دادهٔ صفحه در دسترس است */
export function syncItemTipReviewedIds(rows: ItemTipReviewRef[]): Set<string> {
  const stored = readReviewedIds();
  const next = new Set(stored);
  let changed = false;

  for (const row of rows) {
    const key = getItemTipReviewKey(row);
    if (key !== row.id && stored.has(row.id) && !stored.has(key)) {
      next.add(key);
      changed = true;
    }
  }

  if (changed) writeReviewedIds(next);
  return next;
}

export function getReviewedItemTipIds(): Set<string> {
  return readReviewedIds();
}

export function markItemTipReviewed(row: ItemTipReviewRef): Set<string> {
  const next = readReviewedIds();
  next.add(getItemTipReviewKey(row));
  writeReviewedIds(next);
  return next;
}

export function unmarkItemTipReviewed(row: ItemTipReviewRef): Set<string> {
  const next = readReviewedIds();
  const key = getItemTipReviewKey(row);
  next.delete(key);
  next.delete(row.id);
  writeReviewedIds(next);
  return next;
}

export function markManyItemTipsReviewed(rows: ItemTipReviewRef[]): Set<string> {
  const next = readReviewedIds();
  for (const row of rows) {
    next.add(getItemTipReviewKey(row));
  }
  writeReviewedIds(next);
  return next;
}

/** placement idهای قدیمی را با کمک سرور به catalogItemId تبدیل می‌کند */
export async function hydrateItemTipReviewedIds(stored: Set<string>): Promise<Set<string>> {
  const ids = [...stored].map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return stored;

  const BATCH_SIZE = 400;
  let next = new Set(stored);

  try {
    for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
      const chunk = ids.slice(offset, offset + BATCH_SIZE);
      const res = await fetch('/api/admin/items/tip-review-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: chunk }),
      });
      const body = (await res.json()) as { success?: boolean; data?: { keys?: string[] } };
      if (!res.ok || !body.success || !Array.isArray(body.data?.keys)) {
        return stored;
      }
      next = new Set([...next, ...body.data.keys]);
    }

    if (next.size !== stored.size) writeReviewedIds(next);
    return next;
  } catch {
    return stored;
  }
}
