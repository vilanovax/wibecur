import type { CommentSeedTone, ToneMix } from './types';

/** انتخاب لحن بر اساس وزن‌های کمپین */
export function pickToneFromMix(mix: ToneMix): CommentSeedTone {
  const entries: { tone: CommentSeedTone; weight: number }[] = [
    { tone: 'positive', weight: mix.positive },
    { tone: 'negative', weight: mix.negative },
    { tone: 'neutral', weight: mix.neutral },
    { tone: 'question', weight: mix.question },
  ];
  const total = entries.reduce((s, e) => s + Math.max(0, e.weight), 0) || 1;
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.tone;
  }
  return 'neutral';
}

/**
 * تاریخ تصادفی در بازه — کمی وزن به روزهای اخیر‌تر برای طبیعی‌تر شدن
 */
export function randomDateInRange(from: Date, to: Date): Date {
  const start = from.getTime();
  const end = to.getTime();
  if (end <= start) return new Date(start);

  const u = Math.random();
  const biased = u * u;
  return new Date(start + biased * (end - start));
}

/** توزیع تعداد کامنت بین آیتم‌ها */
export function distributeCommentCounts(
  itemIds: string[],
  totalCount: number,
  perItemCount?: number | null
): Map<string, number> {
  const map = new Map<string, number>();
  if (itemIds.length === 0) return map;

  if (perItemCount && perItemCount > 0) {
    for (const id of itemIds) {
      map.set(id, perItemCount);
    }
    return map;
  }

  let remaining = totalCount;
  const shuffled = [...itemIds].sort(() => Math.random() - 0.5);

  while (remaining > 0) {
    for (const id of shuffled) {
      if (remaining <= 0) break;
      map.set(id, (map.get(id) ?? 0) + 1);
      remaining -= 1;
    }
  }

  return map;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
