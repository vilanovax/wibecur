import { getDisplayListTitle } from '@/lib/list-display-title';

/** حذف تکرار لیست‌ها بر اساس id — حفظ اولین occurrence */
export function dedupeListsById<T extends { id: string }>(lists: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of lists) {
    if (seen.has(list.id)) continue;
    seen.add(list.id);
    out.push(list);
  }
  return out;
}

/** کلید مقایسهٔ عنوان نمایشی — فاصله‌ها و نیم‌فاصله حذف می‌شوند */
export function normalizeDisplayTitleKey(title: string): string {
  return title
    .trim()
    .replace(/\u200c/g, '')
    .replace(/[\s‌]+/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .toLowerCase();
}

type DedupeByTitleInput = {
  id: string;
  title: string;
  slug?: string | null;
  saveCount?: number | null;
  isFeatured?: boolean | null;
  categories?: { slug?: string | null } | null;
  categorySlug?: string | null;
};

function titleScore(list: DedupeByTitleInput): number {
  let score = list.saveCount ?? 0;
  if (list.isFeatured) score += 10_000;
  return score;
}

/**
 * حذف تکرار بر اساس عنوان نمایشی (فارسی) داخل یک سکشن/فید.
 * وقتی دو لیست با کاور متفاوت همان عنوان را نشان می‌دهند، فقط قوی‌تر می‌ماند.
 */
export function dedupeListsByDisplayTitle<T extends DedupeByTitleInput>(lists: T[]): T[] {
  const bestByKey = new Map<string, T>();
  const order: string[] = [];

  for (const list of lists) {
    const display = getDisplayListTitle({
      title: list.title,
      slug: list.slug,
      categorySlug: list.categorySlug ?? list.categories?.slug ?? null,
    });
    const key = normalizeDisplayTitleKey(display);
    if (!key) {
      const fallback = `id:${list.id}`;
      if (!bestByKey.has(fallback)) {
        bestByKey.set(fallback, list);
        order.push(fallback);
      }
      continue;
    }

    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, list);
      order.push(key);
      continue;
    }

    if (titleScore(list) > titleScore(existing)) {
      bestByKey.set(key, list);
    }
  }

  return order.map((key) => bestByKey.get(key)!).filter(Boolean);
}
