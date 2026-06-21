import type { Prisma } from '@prisma/client';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { publicItemWhere } from '@/lib/public-content-filters';
import { expandDbSearchAnchors, fuzzyMatchInText } from '@/lib/search-fuzzy';

export type SearchMatchReason =
  | 'title'
  | 'genre'
  | 'actor'
  | 'director'
  | 'author'
  | 'keyword'
  | 'tag'
  | 'description'
  | 'category';

export type SearchMatchTier = 'direct' | 'indirect';

export type SearchScoreResult = {
  score: number;
  reason: SearchMatchReason | null;
  matchHint: string | null;
  matchTier: SearchMatchTier;
};

type ItemMeta = Record<string, unknown> | null | undefined;

export type SearchableItemFields = {
  title: string;
  description?: string | null;
  metadata?: ItemMeta;
  catalogTitle?: string | null;
  catalogDescription?: string | null;
  catalogMetadata?: ItemMeta;
  listTitle?: string | null;
  listDescription?: string | null;
  listTags?: string[];
  categoryName?: string | null;
};

/** گروه‌های تم/ژانر — کوئری تک‌مفهومی → حالت کشف (نه لیست صدها آیتم) */
const BROAD_THEME_GROUPS: string[][] = [
  ['اکشن', 'action', 'جنگی', 'مبارزه'],
  ['سرقت', 'heist', 'robbery', 'دزدی', 'قاپ'],
  ['ماشین', 'car', 'رانندگی', 'driving', 'chase', 'تعقیب'],
  ['انتقام', 'revenge', 'vengeance'],
  ['ترسناک', 'horror', 'وحشت'],
  ['کمدی', 'comedy', 'خنده'],
  ['عاشقانه', 'romance', 'romantic', 'عشق'],
  ['علمی تخیلی', 'sci-fi', 'science fiction', 'فضایی'],
  ['فانتزی', 'fantasy'],
  ['درام', 'drama'],
  ['معمایی', 'mystery', 'thriller', 'هیجان'],
  ['انیمیشن', 'animation', 'animated'],
  ['مستند', 'documentary'],
  ['جنگ', 'war'],
  ['غرب', 'western'],
  ['نوجوان', 'teen', 'young adult'],
];

/** زیرموضوع‌های پیشنهادی برای chip در حالت کشف */
const BROAD_SUBTHEME_CHIPS: Record<string, string[]> = {
  اکشن: ['سرقت', 'انتقام', 'ماشین', 'جنگ'],
  action: ['سرقت', 'انتقام', 'ماشین', 'جنگ'],
  ترسناک: ['معمایی', 'هیجان', 'وحشت'],
  horror: ['معمایی', 'هیجان', 'وحشت'],
  کمدی: ['عاشقانه', 'خانوادگی'],
  comedy: ['عاشقانه', 'خانوادگی'],
  عاشقانه: ['کمدی', 'درام'],
  romance: ['کمدی', 'درام'],
};

export type BroadQueryResult = {
  isBroad: boolean;
  subThemes: string[];
};

function groupMatchesQuery(group: string[], q: string, tokens: string[]): boolean {
  const lowerGroup = group.map((g) => g.toLowerCase());
  if (lowerGroup.some((g) => g === q || q.includes(g) || g.includes(q))) return true;
  if (tokens.length === 0) return false;
  return tokens.every((t) => lowerGroup.some((g) => g === t || g.includes(t) || t.includes(g)));
}

function subThemesForBroadQuery(q: string, group: string[]): string[] {
  const qLower = q.toLowerCase();
  for (const [key, chips] of Object.entries(BROAD_SUBTHEME_CHIPS)) {
    if (group.some((g) => g.toLowerCase() === key.toLowerCase())) {
      return chips.filter((c) => c.toLowerCase() !== qLower);
    }
  }
  return group
    .filter((g) => g.toLowerCase() !== qLower && /[\u0600-\u06FF]/.test(g))
    .slice(0, 4);
}

/** کوئری تک‌مفهومی مثل «اکشن» → کشف، نه dump صدها آیتم */
export function detectBroadQuery(rawQuery: string): BroadQueryResult {
  const q = normalizeSearchQuery(rawQuery).toLowerCase();
  if (q.length < SEARCH_MIN_LENGTH) return { isBroad: false, subThemes: [] };

  const tokens = tokenizeQuery(rawQuery);
  if (tokens.length >= 3) return { isBroad: false, subThemes: [] };

  for (const group of BROAD_THEME_GROUPS) {
    if (groupMatchesQuery(group, q, tokens)) {
      return { isBroad: true, subThemes: subThemesForBroadQuery(q, group) };
    }
  }

  return { isBroad: false, subThemes: [] };
}

export type SearchQueryIntent = 'broad' | 'specific';

/** گروه‌های مترادف — برای جستجوی فارسی/انگلیسی و تم‌های رایج */
const SYNONYM_GROUPS: string[][] = [
  ['اکشن', 'action', 'جنگی', 'مبارزه'],
  ['سرقت', 'heist', 'robbery', 'دزدی', 'قاپ'],
  ['ماشین', 'car', 'رانندگی', 'driving', 'chase', 'تعقیب'],
  ['انتقام', 'revenge', 'vengeance'],
  ['ترسناک', 'horror', 'وحشت'],
  ['کمدی', 'comedy', 'خنده'],
  ['عاشقانه', 'romance', 'romantic', 'عشق'],
  ['علمی تخیلی', 'sci-fi', 'science fiction', 'فضایی'],
  ['فانتزی', 'fantasy'],
  ['درام', 'drama'],
  ['معمایی', 'mystery', 'thriller', 'هیجان'],
  ['انیمیشن', 'animation', 'animated'],
  ['مستند', 'documentary'],
  ['جنگ', 'war'],
  ['غرب', 'western'],
  ['نوجوان', 'teen', 'young adult'],
  ['فیلم', 'movie', 'film', 'سینما'],
  ['کتاب', 'book', 'رمان', 'novel'],
  ['کافه', 'cafe', 'coffee', 'قهوه'],
];

const STOP_WORDS = new Set(['و', 'در', 'با', 'از', 'به', 'the', 'a', 'an', 'of']);

function tokenizeQuery(query: string): string[] {
  return normalizeSearchQuery(query)
    .toLowerCase()
    .split(/[\s,،]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= SEARCH_MIN_LENGTH && !STOP_WORDS.has(t));
}

/** گسترش کوئری با توکن‌ها و مترادف‌ها */
export function expandSearchTerms(rawQuery: string): string[] {
  const normalized = normalizeSearchQuery(rawQuery).toLowerCase();
  const terms = new Set<string>();

  if (normalized.length >= SEARCH_MIN_LENGTH) {
    terms.add(normalized);
  }

  for (const token of tokenizeQuery(rawQuery)) {
    terms.add(token);
  }

  const snapshot = [...terms];
  for (const group of SYNONYM_GROUPS) {
    const lowerGroup = group.map((g) => g.toLowerCase());
    const hit = snapshot.some(
      (term) =>
        lowerGroup.some((g) => g === term || g.includes(term) || term.includes(g))
    );
    if (hit) {
      for (const g of lowerGroup) {
        if (g.length >= SEARCH_MIN_LENGTH) terms.add(g);
      }
    }
  }

  return [...terms].filter((t) => t.length >= SEARCH_MIN_LENGTH);
}

/** توکن‌ها + anchorهای فازی برای OR در Prisma (title/catalog) */
function collectDbSearchTerms(rawQuery: string): {
  terms: string[];
  titleAnchors: string[];
} {
  const q = normalizeSearchQuery(rawQuery).toLowerCase();
  const tokens = tokenizeQuery(rawQuery);
  const terms = expandSearchTerms(rawQuery);
  const anchorSource =
    tokens.length > 0 ? tokens : q.length >= SEARCH_MIN_LENGTH ? [q] : [];
  const titleAnchors = expandDbSearchAnchors(anchorSource).filter(
    (anchor) => anchor.length >= SEARCH_MIN_LENGTH && !terms.includes(anchor)
  );
  return { terms, titleAnchors };
}

function findFuzzyTitleMatch(
  rawQuery: string,
  item: SearchableItemFields
): { matchedText: string; distance: number } | null {
  const q = normalizeSearchQuery(rawQuery).toLowerCase();
  const tokens = tokenizeQuery(rawQuery);
  const parts = [...new Set([q, ...tokens])].filter((p) => p.length >= SEARCH_MIN_LENGTH);
  const fields = [item.title, item.catalogTitle].filter(Boolean) as string[];

  let best: { matchedText: string; distance: number } | null = null;

  for (const field of fields) {
    for (const part of parts) {
      const match = fuzzyMatchInText(part, field);
      if (!match.matched || match.distance == null || match.distance === 0) continue;
      if (!best || match.distance < best.distance) {
        best = { matchedText: match.matchedText ?? part, distance: match.distance };
      }
    }
  }

  return best;
}

function titleFieldsFuzzyMatch(rawQuery: string, item: SearchableItemFields): boolean {
  const q = normalizeSearchQuery(rawQuery).toLowerCase();
  const tokens = tokenizeQuery(rawQuery);
  const parts = [...new Set([q, ...tokens])].filter((p) => p.length >= SEARCH_MIN_LENGTH);
  for (const field of [item.title, item.catalogTitle ?? '']) {
    if (!field) continue;
    for (const part of parts) {
      if (fuzzyMatchInText(part, field).matched) return true;
    }
  }
  return false;
}

function metaString(meta: ItemMeta, key: string): string {
  const val = meta?.[key];
  if (val == null || val === '') return '';
  return String(val).trim();
}

function metaActors(meta: ItemMeta): string {
  const val = meta?.actors;
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean).join(' ');
  if (typeof val === 'string') return val.trim();
  return '';
}

function extractSearchProfileText(meta: ItemMeta): string {
  const profile = meta?.searchProfile;
  if (!profile || typeof profile !== 'object') return '';
  const p = profile as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of ['genres', 'subgenres', 'themes', 'keywords'] as const) {
    const val = p[key];
    if (Array.isArray(val)) {
      parts.push(...val.map((v) => String(v).trim()).filter(Boolean));
    } else if (typeof val === 'string' && val.trim()) {
      parts.push(val.trim());
    }
  }
  if (typeof p.searchText === 'string' && p.searchText.trim()) {
    parts.push(p.searchText.trim());
  }
  return parts.join(' ');
}

/** متن قابل جستجو برای یک آیتم — عنوان، متادیتا، کاتالوگ، تگ‌ها */
export function buildItemSearchHaystack(item: SearchableItemFields): string {
  const meta = { ...(item.catalogMetadata ?? {}), ...(item.metadata ?? {}) };
  const parts = [
    item.title,
    item.description ?? '',
    item.catalogTitle ?? '',
    item.catalogDescription ?? '',
    metaString(meta, 'genre'),
    metaString(meta, 'director'),
    metaString(meta, 'author'),
    metaActors(meta),
    metaString(meta, 'country'),
    metaString(meta, 'cuisine'),
    metaString(meta, 'address'),
    metaString(meta, 'priceRange'),
    meta.year != null ? String(meta.year) : '',
    extractSearchProfileText(meta),
    item.listTitle ?? '',
    item.listDescription ?? '',
    item.categoryName ?? '',
    ...(item.listTags ?? []),
  ]
    .filter((v) => v != null && String(v).trim())
    .map((v) => String(v));

  return parts.join(' ').toLowerCase();
}

function termMatches(text: string, term: string): boolean {
  if (!text || !term) return false;
  return text.toLowerCase().includes(term.toLowerCase());
}

function firstMatchingTerm(text: string, terms: string[]): string | null {
  const lower = text.toLowerCase();
  for (const term of terms) {
    if (lower.includes(term.toLowerCase())) return term;
  }
  return null;
}

/** مستقیم = عنوان/ژانر/بازیگر/کارگردان/نویسنده/پروفایل خود آیتم */
export function resolveItemMatchTier(
  item: SearchableItemFields,
  rawQuery: string,
  terms: string[] = expandSearchTerms(rawQuery)
): SearchMatchTier {
  const q = normalizeSearchQuery(rawQuery).toLowerCase();
  const title = item.title.toLowerCase();
  const meta = { ...(item.catalogMetadata ?? {}), ...(item.metadata ?? {}) };
  const genre = metaString(meta, 'genre');
  const actors = metaActors(meta);
  const director = metaString(meta, 'director');
  const author = metaString(meta, 'author');
  const profileText = extractSearchProfileText(meta);

  if (title.includes(q) || terms.some((t) => title.includes(t))) return 'direct';
  if (titleFieldsFuzzyMatch(rawQuery, item)) return 'direct';
  if (actors && terms.some((t) => termMatches(actors, t))) return 'direct';
  if (director && terms.some((t) => termMatches(director, t))) return 'direct';
  if (author && terms.some((t) => termMatches(author, t))) return 'direct';
  if (genre && (termMatches(genre, q) || terms.some((t) => termMatches(genre, t)))) return 'indirect';
  if (profileText && terms.some((t) => termMatches(profileText, t))) return 'indirect';

  return 'indirect';
}

/** امتیازدهی آیتم برای رتبه‌بندی نتایج جستجو */
export function scoreItemForSearch(
  item: SearchableItemFields,
  rawQuery: string,
  terms: string[] = expandSearchTerms(rawQuery)
): SearchScoreResult {
  const q = normalizeSearchQuery(rawQuery).toLowerCase();
  const title = item.title.toLowerCase();
  const haystack = buildItemSearchHaystack(item);
  const meta = { ...(item.catalogMetadata ?? {}), ...(item.metadata ?? {}) };

  let score = 0;
  let reason: SearchMatchReason | null = null;
  let matchHint: string | null = null;

  if (title === q) {
    score += 200;
    reason = 'title';
  } else if (title.includes(q)) {
    score += 120;
    reason = 'title';
  } else if (terms.some((t) => title.includes(t))) {
    score += 90;
    reason = 'title';
  } else {
    const fuzzyTitle = findFuzzyTitleMatch(rawQuery, item);
    if (fuzzyTitle) {
      score += Math.max(72, 98 - fuzzyTitle.distance * 12);
      reason = 'title';
      matchHint = `شبیه: ${fuzzyTitle.matchedText}`;
    }
  }

  const genre = metaString(meta, 'genre');
  if (genre) {
    const genreHit = firstMatchingTerm(genre, terms) ?? (termMatches(genre, q) ? q : null);
    if (genreHit) {
      score += 70;
      if (reason !== 'title') {
        reason = 'genre';
        matchHint = `ژانر: ${genre}`;
      }
    }
  }

  const director = metaString(meta, 'director');
  if (director && (termMatches(director, q) || terms.some((t) => termMatches(director, t)))) {
    score += 55;
    if (!reason) {
      reason = 'director';
      matchHint = `کارگردان: ${director}`;
    }
  }

  const author = metaString(meta, 'author');
  if (author && (termMatches(author, q) || terms.some((t) => termMatches(author, t)))) {
    score += 55;
    if (!reason) {
      reason = 'author';
      matchHint = `نویسنده: ${author}`;
    }
  }

  const actors = metaActors(meta);
  if (actors) {
    const actorHit = firstMatchingTerm(actors, terms) ?? (termMatches(actors, q) ? q : null);
    if (actorHit) {
      score += 50;
      if (!reason) {
        reason = 'actor';
        const actorName = actors.split(/[,،]/).find((a) => termMatches(a, actorHit)) ?? actorHit;
        matchHint = `بازیگر: ${actorName.trim()}`;
      }
    }
  }

  const profileText = extractSearchProfileText(meta);
  if (profileText && terms.some((t) => termMatches(profileText, t))) {
    score += 40;
    if (!reason) {
      reason = 'keyword';
      const hit = firstMatchingTerm(profileText, terms);
      matchHint = hit ? `کلیدواژه: ${hit}` : 'مرتبط با جستجو';
    }
  }

  const listTitle = (item.listTitle ?? '').toLowerCase();
  const listDesc = (item.listDescription ?? '').toLowerCase();
  if (listTitle && (listTitle.includes(q) || terms.some((t) => listTitle.includes(t)))) {
    score += 48;
    if (reason !== 'title') {
      reason = 'keyword';
      matchHint = `در لیست: ${item.listTitle}`;
    }
  } else if (listDesc && (listDesc.includes(q) || terms.some((t) => listDesc.includes(t)))) {
    score += 32;
    if (!reason) {
      reason = 'keyword';
      matchHint = item.listTitle ? `در لیست: ${item.listTitle}` : 'در توضیحات لیست';
    }
  }

  const matchedTags = (item.listTags ?? []).filter((tag) =>
    terms.some((t) => tag.toLowerCase().includes(t))
  );
  if (matchedTags.length > 0) {
    score += 35;
    if (!reason) {
      reason = 'tag';
      matchHint = `تگ: ${matchedTags[0]}`;
    }
  }

  if (item.categoryName && terms.some((t) => termMatches(item.categoryName!, t))) {
    score += 25;
    if (!reason) {
      reason = 'category';
      matchHint = `دسته: ${item.categoryName}`;
    }
  }

  const desc = (item.description ?? item.catalogDescription ?? '').toLowerCase();
  if (desc && (desc.includes(q) || terms.some((t) => desc.includes(t)))) {
    score += 20;
    if (!reason) reason = 'description';
  }

  if (haystack.includes(q)) {
    score += 30;
  }

  const tokens = tokenizeQuery(rawQuery);
  const matchedTokenCount = tokens.filter((t) => haystack.includes(t)).length;
  score += matchedTokenCount * 12;

  if (score > 0 && !matchHint && reason === 'title') {
    matchHint = null;
  } else if (score > 0 && !matchHint && reason === 'description') {
    matchHint = 'در توضیحات';
  } else if (score > 0 && !matchHint && reason === 'genre' && genre) {
    matchHint = `ژانر: ${genre.split(/[,،]/)[0]?.trim() || genre}`;
  }

  const matchTier = score > 0 ? resolveItemMatchTier(item, rawQuery, terms) : 'indirect';

  return { score, reason, matchHint, matchTier };
}

const itemModerationWhere: Prisma.itemsWhereInput = publicItemWhere;

function metadataStringContains(term: string, path: string[]): Prisma.JsonFilter {
  return {
    path,
    string_contains: term,
    mode: 'insensitive',
  };
}

/** شرط Prisma برای جستجوی گسترده آیتم‌های کاتالوگ (ادمین) */
export function buildCatalogItemSearchOrClauses(
  rawQuery: string
): Prisma.catalog_itemsWhereInput[] {
  const { terms, titleAnchors } = collectDbSearchTerms(rawQuery);
  const q = normalizeSearchQuery(rawQuery);
  const clauses: Prisma.catalog_itemsWhereInput[] = [];

  const addTerm = (term: string) => {
    clauses.push(
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { externalKey: { contains: term, mode: 'insensitive' } },
      { metadata: metadataStringContains(term, ['genre']) },
      { metadata: metadataStringContains(term, ['director']) },
      { metadata: metadataStringContains(term, ['author']) },
      { metadata: metadataStringContains(term, ['searchProfile', 'searchText']) }
    );
  };

  const addTitleAnchor = (term: string) => {
    clauses.push({ title: { contains: term, mode: 'insensitive' } });
  };

  if (q.length >= SEARCH_MIN_LENGTH) addTerm(q);
  for (const term of terms) {
    if (term !== q) addTerm(term);
  }
  for (const anchor of titleAnchors) addTitleAnchor(anchor);

  return clauses;
}

/** شرط Prisma برای جستجوی گسترده آیتم‌ها */
export function buildItemSearchWhere(
  rawQuery: string,
  listWhere: Prisma.listsWhereInput
): Prisma.itemsWhereInput {
  const { terms, titleAnchors } = collectDbSearchTerms(rawQuery);
  if (terms.length === 0 && titleAnchors.length === 0) {
    return { id: { in: [] } };
  }

  const termClauses: Prisma.itemsWhereInput[] = [];

  const addTerm = (term: string) => {
    termClauses.push(
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      {
        catalog_items: {
          is: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      },
      { metadata: metadataStringContains(term, ['genre']) },
      { metadata: metadataStringContains(term, ['director']) },
      { metadata: metadataStringContains(term, ['author']) },
      { metadata: metadataStringContains(term, ['country']) },
      { metadata: metadataStringContains(term, ['searchProfile', 'searchText']) },
      {
        catalog_items: {
          is: {
            OR: [
              { metadata: metadataStringContains(term, ['genre']) },
              { metadata: metadataStringContains(term, ['searchProfile', 'searchText']) },
            ],
          },
        },
      },
      {
        lists: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            {
              categories: {
                isActive: true,
                deletedAt: null,
                name: { contains: term, mode: 'insensitive' },
              },
            },
            { tags: { has: term } },
          ],
        },
      }
    );
  };

  const addTitleAnchor = (term: string) => {
    termClauses.push(
      { title: { contains: term, mode: 'insensitive' } },
      {
        catalog_items: {
          is: { title: { contains: term, mode: 'insensitive' } },
        },
      }
    );
  };

  for (const term of terms) addTerm(term);
  for (const anchor of titleAnchors) addTitleAnchor(anchor);

  return {
    lists: listWhere,
    AND: [itemModerationWhere, { OR: termClauses }],
  };
}

/** شرط سبک Prisma — فقط عنوان آیتم/کاتالوگ (سریع‌تر از buildItemSearchWhere) */
export function buildItemTitleSearchWhere(
  rawQuery: string,
  listWhere: Prisma.listsWhereInput
): Prisma.itemsWhereInput {
  const { terms, titleAnchors } = collectDbSearchTerms(rawQuery);
  const searchTerms = [...new Set([...titleAnchors, ...terms])].slice(0, 4);
  if (searchTerms.length === 0) {
    return { id: { in: [] } };
  }

  const termClauses: Prisma.itemsWhereInput[] = [];
  for (const term of searchTerms) {
    termClauses.push(
      { title: { contains: term, mode: 'insensitive' } },
      {
        catalog_items: {
          is: { title: { contains: term, mode: 'insensitive' } },
        },
      }
    );
  }

  return {
    lists: listWhere,
    AND: [itemModerationWhere, { OR: termClauses }],
  };
}

/** شرط Prisma برای جستجوی گسترده لیست‌ها */
export function buildExtendedListSearchOrClauses(
  rawQuery: string
): Prisma.listsWhereInput[] {
  const { terms, titleAnchors } = collectDbSearchTerms(rawQuery);
  const q = normalizeSearchQuery(rawQuery);
  const clauses: Prisma.listsWhereInput[] = [];

  const addTerm = (term: string) => {
    clauses.push(
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      {
        categories: {
          isActive: true,
          deletedAt: null,
          name: { contains: term, mode: 'insensitive' },
        },
      },
      { tags: { has: term } },
      {
        items: {
          some: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { metadata: metadataStringContains(term, ['genre']) },
              { metadata: metadataStringContains(term, ['director']) },
              { metadata: metadataStringContains(term, ['author']) },
              { metadata: metadataStringContains(term, ['searchProfile', 'searchText']) },
              {
                catalog_items: {
                  OR: [
                    { title: { contains: term, mode: 'insensitive' } },
                    { description: { contains: term, mode: 'insensitive' } },
                    { metadata: metadataStringContains(term, ['genre']) },
                    { metadata: metadataStringContains(term, ['searchProfile', 'searchText']) },
                  ],
                },
              },
            ],
          },
        },
      }
    );
  };

  const addTitleAnchor = (term: string) => {
    clauses.push(
      { title: { contains: term, mode: 'insensitive' } },
      {
        items: {
          some: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { catalog_items: { is: { title: { contains: term, mode: 'insensitive' } } } },
            ],
          },
        },
      }
    );
  };

  if (q.length >= SEARCH_MIN_LENGTH) addTerm(q);
  for (const term of terms) {
    if (term !== q) addTerm(term);
  }
  for (const anchor of titleAnchors) addTitleAnchor(anchor);

  return clauses;
}
