import {
  displayInstagramHandle,
  displayWebsiteHost,
  phoneToTelHref,
} from '@/lib/cafe-metadata';
import { parseActorNames, personPagePath, type PersonRole } from '@/lib/people';
export const INTERNAL_METADATA_KEYS = new Set([
  'imdbId',
  'imdbID',
  'tmdbId',
  'tmdbID',
  'entryKind',
  'sourceCategorySlug',
  'tags',
  'factType',
]);

/** نکته جداگانه نمایش داده می‌شود — نه در grid متادیتا */
export const ITEM_TIP_METADATA_KEY = 'tip';

/** کلیدهایی که در هیرو نمایش داده می‌شوند */
export const HERO_METADATA_KEYS = new Set(['year', 'genre', 'imdbRating']);

export function extractItemTip(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = metadata[ITEM_TIP_METADATA_KEY];
  if (typeof raw !== 'string') return null;
  const tip = raw.trim();
  return tip || null;
}

/** اگر tip فقط مترجم است، به‌جای کارت زرد در chips نمایش داده شود */
export function parseTipAsMetadataFact(tip: string | null): MetadataFact | null {
  if (!tip) return null;
  const match = tip.match(/^مترجم\s*[:：]\s*(.+)$/u);
  if (!match?.[1]?.trim()) return null;
  return {
    key: 'translator',
    label: 'مترجم',
    value: match[1].trim(),
    icon: '📖',
    href: personPagePath('translator', match[1].trim()),
  };
}

type LightweightBodySource = {
  description?: string | null;
  listNote?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** متن اصلی ورودی سبک — بدون کارت نکته جدا */
export function buildLightweightDisplayBody(
  item: LightweightBodySource,
  options?: { lifestyleMode?: boolean }
): string {
  const desc = item.description?.trim() || '';
  const tip = extractItemTip(item.metadata);
  const note = item.listNote?.trim() || '';

  if (options?.lifestyleMode) {
    // لایف‌استایل: فقط description؛ tip جدا نمایش داده نمی‌شود
    return desc || tip || note;
  }

  return desc || tip || note;
}

/** آیا metadata.tip باید به‌صورت ItemTipCard جدا نمایش داده شود */
export function shouldShowSeparateTipCard(
  item: LightweightBodySource,
  options?: { lifestyleMode?: boolean }
): boolean {
  if (options?.lifestyleMode) return false;

  const desc = item.description?.trim() || '';
  const tip = extractItemTip(item.metadata);
  const note = item.listNote?.trim() || '';
  return Boolean(tip && tip !== desc && tip !== note);
}

export type MetadataFact = {
  key: string;
  label: string;
  value: string;
  icon: string;
  href?: string;
  /** لینک‌های داخلی — مثلاً هر بازیگر جدا */
  profileLinks?: Array<{ name: string; href: string }>;
};

const PERSON_LINK_KEYS = new Set<string>(['director', 'author', 'translator']);

const FACT_LABELS: Record<string, { label: string; icon: string }> = {
  director: { label: 'کارگردان', icon: '🎬' },
  imdbRating: { label: 'امتیاز IMDb', icon: '⭐' },
  country: { label: 'ساخت', icon: '🌍' },
  actors: { label: 'بازیگران', icon: '🎭' },
  author: { label: 'نویسنده', icon: '✍️' },
  translator: { label: 'مترجم', icon: '📖' },
  address: { label: 'آدرس', icon: '📍' },
  priceRange: { label: 'بازه قیمت', icon: '💰' },
  cuisine: { label: 'نوع غذا', icon: '🍽️' },
  phone: { label: 'تلفن', icon: '📞' },
  instagram: { label: 'اینستاگرام', icon: '📸' },
  website: { label: 'وب‌سایت', icon: '🌐' },
  mapsUrl: { label: 'مسیریابی', icon: '🗺️' },
  duration: { label: 'مدت', icon: '⏱️' },
};

const CAFE_FACT_ORDER = [
  'address',
  'phone',
  'cuisine',
  'priceRange',
  'instagram',
  'website',
  'mapsUrl',
] as const;

const MOVIE_FACT_ORDER = ['director', 'imdbRating', 'country', 'actors'] as const;
const BOOK_FACT_ORDER = ['author', 'translator'] as const;

function isMovieLikeCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return s.includes('movie') || s.includes('film') || s === 'series' || s.includes('cinema');
}

function isBookCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return s.includes('book') || s.includes('literature');
}

function isCafeCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s.includes('cafe') ||
    s.includes('restaurant') ||
    s.includes('food') ||
    s.includes('رستوران') ||
    s.includes('کافه')
  );
}

function formatPriceRange(value: string): string {
  if (value === '$') return 'ارزان';
  if (value === '$$') return 'متوسط';
  if (value === '$$$') return 'گران';
  if (value === '$$$$') return 'لوکس';
  return value;
}

function formatActors(value: unknown): string | null {
  if (Array.isArray(value)) {
    const names = value.map((v) => String(v).trim()).filter(Boolean).slice(0, 2);
    return names.length > 0 ? names.join(' · ') : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const names = value
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    return names.length > 0 ? names.join(' · ') : null;
  }
  return null;
}

function formatImdbRating(value: unknown): string | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatFactValue(key: string, value: unknown): string | null {
  if (value == null || value === '') return null;
  if (key === 'imdbRating') return formatImdbRating(value);
  if (key === 'actors') return formatActors(value);
  if (key === 'priceRange' && typeof value === 'string') return formatPriceRange(value);
  if (key === 'instagram' && typeof value === 'string') return displayInstagramHandle(value);
  if (key === 'website' && typeof value === 'string') return displayWebsiteHost(value);
  if (key === 'mapsUrl' && typeof value === 'string') return 'باز کردن در نقشه';
  return String(value).trim() || null;
}

function factHref(key: string, value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (key === 'phone') return phoneToTelHref(trimmed);
  if (key === 'instagram' || key === 'website' || key === 'mapsUrl') return trimmed;
  return undefined;
}

function pushFact(
  facts: MetadataFact[],
  key: string,
  metadata: Record<string, unknown>
): void {
  if (key === 'actors') {
    pushActorFact(facts, metadata);
    return;
  }

  const formatted = formatFactValue(key, metadata[key]);
  if (!formatted) return;
  const meta = FACT_LABELS[key] ?? { label: key, icon: '📋' };
  const externalHref = factHref(key, metadata[key]);
  const personHref =
    !externalHref && PERSON_LINK_KEYS.has(key)
      ? personPagePath(key as PersonRole, formatted)
      : undefined;
  facts.push({
    key,
    label: meta.label,
    value: formatted,
    icon: meta.icon,
    href: externalHref ?? personHref,
  });
}

function pushActorFact(facts: MetadataFact[], metadata: Record<string, unknown>): void {
  const names = parseActorNames(metadata.actors).slice(0, 6);
  if (names.length === 0) return;

  if (names.length === 1) {
    facts.push({
      key: 'actors',
      label: 'بازیگر',
      value: names[0],
      icon: '🎭',
      href: personPagePath('actor', names[0]),
    });
    return;
  }

  facts.push({
    key: 'actors',
    label: FACT_LABELS.actors.label,
    value: names.join(' · '),
    icon: FACT_LABELS.actors.icon,
    profileLinks: names.map((name) => ({
      name,
      href: personPagePath('actor', name),
    })),
  });
}

/** فکت‌های قابل نمایش برای UI جزئیات آیتم */
export function buildItemMetadataFacts(
  metadata: Record<string, unknown> | null | undefined,
  categorySlug?: string | null,
  options?: { fallbackImdbRating?: unknown }
): MetadataFact[] {
  const baseMeta =
    metadata != null && typeof metadata === 'object' ? { ...metadata } : ({} as Record<string, unknown>);

  if (
    isMovieLikeCategory(categorySlug) &&
    baseMeta.imdbRating == null &&
    options?.fallbackImdbRating != null &&
    options.fallbackImdbRating !== ''
  ) {
    baseMeta.imdbRating = options.fallbackImdbRating;
  }

  if (Object.keys(baseMeta).length === 0) return [];

  const facts: MetadataFact[] = [];
  const order = isMovieLikeCategory(categorySlug)
    ? MOVIE_FACT_ORDER
    : isBookCategory(categorySlug)
      ? BOOK_FACT_ORDER
      : isCafeCategory(categorySlug)
        ? CAFE_FACT_ORDER
        : null;

  if (order) {
    for (const key of order) {
      pushFact(facts, key, baseMeta);
    }
    return facts;
  }

  for (const [key, value] of Object.entries(baseMeta)) {
    if (HERO_METADATA_KEYS.has(key) || INTERNAL_METADATA_KEYS.has(key) || key === ITEM_TIP_METADATA_KEY) {
      continue;
    }
    if (value == null || value === '') continue;
    pushFact(facts, key, baseMeta);
  }

  return facts;
}

/** برای preview sheet — همان فکت‌ها به‌صورت chip */
export function buildItemMetadataChips(
  metadata: Record<string, unknown> | null | undefined,
  categorySlug?: string | null,
  options?: { fallbackImdbRating?: unknown }
): Array<{ key: string; label: string; value: string; href?: string; profileLinks?: MetadataFact['profileLinks'] }> {
  return buildItemMetadataFacts(metadata, categorySlug, options).map(
    ({ key, label, value, href, profileLinks }) => ({
      key,
      label,
      value,
      href,
      profileLinks,
    })
  );
}
