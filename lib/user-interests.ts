import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { activeCategoryWhere } from '@/lib/public-content-filters';
import {
  CATEGORY_DEFAULT_KEYWORD_IDS,
  getInterestKeyword,
  isValidInterestKeywordId,
  resolveInterestKeywordId,
  type InterestKeyword,
} from '@/lib/interest-keywords';

export type InterestEventType = 'list_view' | 'category_view';

export type InterestEventInput = {
  type: InterestEventType;
  categorySlug?: string;
  listId?: string;
  /** tags لیست — از کلاینت برای جلوگیری از کوئری اضافه */
  keywords?: string[];
};

export type UserInterestItem = {
  keywordId: string;
  label: string;
  emoji: string;
  group: InterestKeyword['group'];
  source: 'manual' | 'inferred';
  weight: number;
  pinned: boolean;
  hidden: boolean;
};

const LIST_VIEW_WEIGHT = 1;
const CATEGORY_VIEW_WEIGHT = 1.5;
const TAG_VIEW_WEIGHT = 1.2;
const BOOKMARK_TAG_WEIGHT = 2;
const MANUAL_PIN_WEIGHT = 10;
const MAX_PREFERRED_KEYWORDS = 10;
const MAX_MANUAL_KEYWORDS = 12;

function eventBaseWeight(type: InterestEventType): number {
  return type === 'category_view' ? CATEGORY_VIEW_WEIGHT : LIST_VIEW_WEIGHT;
}

async function upsertKeywordWeight(
  userId: string,
  keywordId: string,
  increment: number,
  forceManual = false
): Promise<void> {
  if (!isValidInterestKeywordId(keywordId)) return;

  const existing = await dbQuery(() =>
    prisma.user_keyword_preference.findUnique({
      where: { userId_keywordId: { userId, keywordId } },
    })
  );

  if (existing?.hidden) return;

  if (existing?.source === 'manual' && !forceManual) {
    await dbQuery(() =>
      prisma.user_keyword_preference.update({
        where: { id: existing.id },
        data: { weight: existing.weight + increment * 0.2 },
      })
    );
    return;
  }

  await dbQuery(() =>
    prisma.user_keyword_preference.upsert({
      where: { userId_keywordId: { userId, keywordId } },
      create: {
        userId,
        keywordId,
        source: forceManual ? 'manual' : 'inferred',
        weight: increment,
        pinned: forceManual,
        hidden: false,
      },
      update: {
        source: forceManual ? 'manual' : 'inferred',
        weight: { increment },
      },
    })
  );
}

async function recordKeywordsFromRaw(userId: string, rawKeywords: string[], weight: number): Promise<void> {
  const seen = new Set<string>();
  for (const raw of rawKeywords) {
    const id = resolveInterestKeywordId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    await upsertKeywordWeight(userId, id, weight);
  }
}

/** ثبت بازدید لیست/دسته — علایق keyword-based */
export async function recordInterestEvent(userId: string, event: InterestEventInput): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (event.keywords?.length) {
    tasks.push(recordKeywordsFromRaw(userId, event.keywords, TAG_VIEW_WEIGHT));
  }

  if (event.listId && !event.keywords?.length) {
    tasks.push(
      (async () => {
        const list = await dbQuery(() =>
          prisma.lists.findUnique({
            where: { id: event.listId },
            select: { tags: true, title: true },
          })
        );
        if (!list) return;
        const raw = [...(list.tags ?? []), list.title];
        await recordKeywordsFromRaw(userId, raw, TAG_VIEW_WEIGHT);
      })()
    );
  }

  const categorySlug = event.categorySlug?.trim().toLowerCase();
  if (categorySlug) {
    const defaultIds = CATEGORY_DEFAULT_KEYWORD_IDS[categorySlug] ?? [];
    tasks.push(
      (async () => {
        for (const keywordId of defaultIds) {
          await upsertKeywordWeight(userId, keywordId, eventBaseWeight(event.type));
        }
      })()
    );

    // همچنان سیگنال دسته‌ای سبک برای fallback
    tasks.push(recordCategoryEvent(userId, categorySlug, event.type));
  }

  await Promise.all(tasks);
}

async function recordCategoryEvent(
  userId: string,
  categorySlug: string,
  type: InterestEventType
): Promise<void> {
  const category = await dbQuery(() =>
    prisma.categories.findFirst({
      where: { slug: categorySlug, ...activeCategoryWhere },
      select: { slug: true },
    })
  );
  if (!category) return;

  const existing = await dbQuery(() =>
    prisma.user_category_preference.findUnique({
      where: { userId_categorySlug: { userId, categorySlug } },
    })
  );
  if (existing?.hidden) return;

  const increment = eventBaseWeight(type);
  if (existing?.source === 'manual') {
    await dbQuery(() =>
      prisma.user_category_preference.update({
        where: { id: existing.id },
        data: { weight: existing.weight + increment * 0.25 },
      })
    );
    return;
  }

  await dbQuery(() =>
    prisma.user_category_preference.upsert({
      where: { userId_categorySlug: { userId, categorySlug } },
      create: {
        userId,
        categorySlug,
        source: 'inferred',
        weight: increment,
        pinned: false,
        hidden: false,
      },
      update: { source: 'inferred', weight: { increment } },
    })
  );
}

async function fetchBookmarkKeywordWeights(userId: string): Promise<Map<string, number>> {
  const bookmarks = await dbQuery(() =>
    prisma.bookmarks.findMany({
      where: {
        userId,
        lists: {
          deletedAt: null,
          isActive: true,
          OR: [{ categoryId: null }, { categories: { isActive: true, deletedAt: null } }],
        },
      },
      select: { lists: { select: { tags: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  );

  const weights = new Map<string, number>();
  for (const bookmark of bookmarks) {
    const raw = [...(bookmark.lists?.tags ?? []), bookmark.lists?.title ?? ''];
    for (const token of raw) {
      const id = resolveInterestKeywordId(token);
      if (!id) continue;
      weights.set(id, (weights.get(id) ?? 0) + BOOKMARK_TAG_WEIGHT);
    }
  }
  return weights;
}

function mapPreferenceToItem(
  keywordId: string,
  weight: number,
  pref?: { source: string; pinned: boolean; hidden: boolean }
): UserInterestItem | null {
  const meta = getInterestKeyword(keywordId);
  if (!meta) return null;
  return {
    keywordId,
    label: meta.label,
    emoji: meta.emoji,
    group: meta.group,
    source: pref?.source === 'manual' ? 'manual' : 'inferred',
    weight,
    pinned: pref?.pinned ?? pref?.source === 'manual',
    hidden: pref?.hidden ?? false,
  };
}

/** علایق keyword کاربر */
export async function getUserInterests(userId: string): Promise<UserInterestItem[]> {
  const [preferences, bookmarkWeights] = await Promise.all([
    dbQuery(() =>
      prisma.user_keyword_preference.findMany({
        where: { userId },
        orderBy: [{ pinned: 'desc' }, { weight: 'desc' }],
      })
    ),
    fetchBookmarkKeywordWeights(userId),
  ]);

  const scores = new Map<string, number>();
  const prefById = new Map(preferences.map((p) => [p.keywordId, p]));

  for (const pref of preferences) {
    if (pref.hidden) continue;
    let score = pref.weight;
    if (pref.pinned || pref.source === 'manual') score += MANUAL_PIN_WEIGHT;
    scores.set(pref.keywordId, (scores.get(pref.keywordId) ?? 0) + score);
  }

  for (const [keywordId, weight] of bookmarkWeights) {
    scores.set(keywordId, (scores.get(keywordId) ?? 0) + weight);
  }

  const items: UserInterestItem[] = [];
  for (const [keywordId, weight] of scores) {
    const item = mapPreferenceToItem(keywordId, weight, prefById.get(keywordId));
    if (item && !item.hidden) items.push(item);
  }

  return items.sort((a, b) => b.weight - a.weight);
}

/** keyword idهای ترجیحی برای پیشنهاد اکسپلور */
export async function getPreferredKeywordIds(userId: string): Promise<string[]> {
  const interests = await getUserInterests(userId);
  return interests.slice(0, MAX_PREFERRED_KEYWORDS).map((i) => i.keywordId);
}

/** fallback: دسته‌های ترجیحی (وقتی keyword کافی نیست) */
export async function getPreferredCategoryIds(userId: string): Promise<string[]> {
  const preferences = await dbQuery(() =>
    prisma.user_category_preference.findMany({
      where: { userId, hidden: false },
      orderBy: [{ pinned: 'desc' }, { weight: 'desc' }],
      take: 5,
    })
  );
  if (preferences.length === 0) return [];

  const slugs = preferences.map((p) => p.categorySlug);
  const categories = await dbQuery(() =>
    prisma.categories.findMany({
      where: { slug: { in: slugs }, ...activeCategoryWhere },
      select: { id: true, slug: true },
    })
  );
  const slugToId = new Map(categories.map((c) => [c.slug, c.id]));
  return slugs.map((s) => slugToId.get(s)).filter((id): id is string => Boolean(id));
}

export type UpdateUserInterestsInput = {
  pinnedKeywordIds?: string[];
  hiddenKeywordIds?: string[];
};

/** ویرایش علایق دستی */
export async function updateUserInterests(
  userId: string,
  input: UpdateUserInterestsInput
): Promise<UserInterestItem[]> {
  const pinnedIds = [...new Set((input.pinnedKeywordIds ?? []).filter(isValidInterestKeywordId))].slice(
    0,
    MAX_MANUAL_KEYWORDS
  );
  const hiddenIds = new Set(
    (input.hiddenKeywordIds ?? []).filter(isValidInterestKeywordId).filter((id) => !pinnedIds.includes(id))
  );
  const pinnedSet = new Set(pinnedIds);

  const existing = await dbQuery(() =>
    prisma.user_keyword_preference.findMany({ where: { userId } })
  );
  const existingById = new Map(existing.map((p) => [p.keywordId, p]));

  for (const keywordId of pinnedIds) {
    const prev = existingById.get(keywordId);
    await dbQuery(() =>
      prisma.user_keyword_preference.upsert({
        where: { userId_keywordId: { userId, keywordId } },
        create: {
          userId,
          keywordId,
          source: 'manual',
          weight: Math.max(prev?.weight ?? 0, MANUAL_PIN_WEIGHT),
          pinned: true,
          hidden: false,
        },
        update: {
          source: 'manual',
          pinned: true,
          hidden: false,
          weight: Math.max(prev?.weight ?? 0, MANUAL_PIN_WEIGHT),
        },
      })
    );
  }

  for (const keywordId of hiddenIds) {
    const prev = existingById.get(keywordId);
    await dbQuery(() =>
      prisma.user_keyword_preference.upsert({
        where: { userId_keywordId: { userId, keywordId } },
        create: {
          userId,
          keywordId,
          source: prev?.source ?? 'inferred',
          weight: prev?.weight ?? 0,
          pinned: false,
          hidden: true,
        },
        update: { hidden: true, pinned: false },
      })
    );
  }

  for (const pref of existing) {
    if (pref.source !== 'manual' || !pref.pinned) continue;
    if (pinnedSet.has(pref.keywordId)) continue;
    if (hiddenIds.has(pref.keywordId)) continue;
    await dbQuery(() =>
      prisma.user_keyword_preference.update({
        where: { id: pref.id },
        data: { pinned: false, source: pref.weight > 0 ? 'inferred' : pref.source },
      })
    );
  }

  return getUserInterests(userId);
}
