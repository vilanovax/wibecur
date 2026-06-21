'use client';

/**
 * لایه آنالیتیکس — رویدادهای سفارشی
 * - Umami: با NEXT_PUBLIC_UMAMI_WEBSITE_ID (صفحات + event)
 * - Vercel Analytics: فقط روی deploy وercel
 */

import { track as vercelTrack } from '@vercel/analytics';
import { trackUmamiEvent } from '@/lib/umami';

export type AnalyticsEvent =
  | 'list_bookmark'
  | 'list_unbookmark'
  | 'list_create'
  | 'item_save'
  | 'item_unsave'
  | 'follow'
  | 'unfollow'
  | 'search'
  | 'comment_submit'
  | 'share'
  | 'item_suggest'
  | 'list_suggest'
  | 'home_section_click'
  | 'featured_hero_click'
  | 'home_tab_switch'
  | 'category_chip_click'
  | 'mood_card_click'
  | 'mood_explorer_click'
  | 'search_result_click'
  | 'search_no_results'
  | 'item_preview_open'
  | 'creator_profile_view'
  | 'signup_complete'
  | 'first_bookmark'
  | 'list_scroll_depth';

export type HomeSectionId =
  | 'trending'
  | 'for_you'
  | 'rising'
  | 'mood'
  | 'saved'
  | 'featured'
  | 'creator_spotlight';

export type AnalyticsData = Record<string, string | number | boolean>;

const MAX_QUERY_LEN = 80;

function clipQuery(query: string): string {
  const t = query.trim();
  return t.length > MAX_QUERY_LEN ? t.slice(0, MAX_QUERY_LEN) : t;
}

export function track(event: AnalyticsEvent, data?: AnalyticsData) {
  trackUmamiEvent(event, data);

  if (process.env.NEXT_PUBLIC_VERCEL !== '1') return;
  try {
    vercelTrack(event, data);
  } catch {
    // ignore
  }
}

export type ListAnalyticsContext = {
  listSlug?: string | null;
  categorySlug?: string | null;
  source?: string;
};

type ListAnalyticsInput = ListAnalyticsContext & {
  listId?: string;
  [key: string]: string | number | boolean | null | undefined;
};

/** فیلدهای قابل‌فهم برای Umami از context لیست */
export function listAnalyticsPayload(ctx?: ListAnalyticsInput): AnalyticsData | undefined {
  if (!ctx) return undefined;
  const out: AnalyticsData = {};
  if (ctx.listSlug) out.list_slug = ctx.listSlug;
  if (ctx.categorySlug) out.category_slug = ctx.categorySlug;
  if (ctx.source) out.source = ctx.source;
  for (const [key, value] of Object.entries(ctx)) {
    if (key === 'listSlug' || key === 'categorySlug' || key === 'source') continue;
    if (value == null) continue;
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function trackHomeSectionClick(
  section: HomeSectionId,
  data?: {
    list_slug?: string;
    category_slug?: string;
    target?: 'card' | 'see_all';
  }
) {
  track('home_section_click', {
    section,
    target: data?.target ?? 'card',
    ...(data?.list_slug ? { list_slug: data.list_slug } : {}),
    ...(data?.category_slug ? { category_slug: data.category_slug } : {}),
  });
}

export function trackFeaturedHeroClick(data: {
  list_slug: string;
  category_slug?: string;
  action: 'view' | 'save';
  slot_id?: string;
}) {
  track('featured_hero_click', {
    list_slug: data.list_slug,
    action: data.action,
    ...(data.category_slug ? { category_slug: data.category_slug } : {}),
    ...(data.slot_id ? { slot_id: data.slot_id } : {}),
  });
}

export function trackHomeTabSwitch(tab: 'trending' | 'foryou' | 'rising') {
  track('home_tab_switch', { tab });
}

export function trackCategoryChipClick(categorySlug: string, categoryName?: string) {
  track('category_chip_click', {
    category_slug: categorySlug,
    ...(categoryName ? { category_name: categoryName } : {}),
  });
}

export function trackMoodCardClick(
  moodId: string,
  target: 'list' | 'more',
  listSlug?: string
) {
  track('mood_card_click', {
    mood_id: moodId,
    target,
    ...(listSlug ? { list_slug: listSlug } : {}),
  });
}

export function trackMoodExplorerClick(
  moodId: string,
  source: 'card' | 'quick_now' | 'surprise',
  listSlug?: string
) {
  track('mood_explorer_click', {
    mood_id: moodId,
    source,
    ...(listSlug ? { list_slug: listSlug } : {}),
  });
}

export function trackSearchResultClick(data: {
  query: string;
  source: string;
  result_type: 'list' | 'item';
  result_slug?: string;
  result_id?: string;
  category_slug?: string;
  position?: number;
}) {
  track('search_result_click', {
    query: clipQuery(data.query),
    source: data.source,
    result_type: data.result_type,
    ...(data.result_slug ? { result_slug: data.result_slug } : {}),
    ...(data.result_id ? { result_id: data.result_id } : {}),
    ...(data.category_slug ? { category_slug: data.category_slug } : {}),
    ...(data.position != null ? { position: data.position } : {}),
  });
}

export function trackSearchNoResults(query: string, source: string) {
  track('search_no_results', {
    query: clipQuery(query),
    source,
  });
}

export function trackItemPreviewOpen(data: {
  item_id: string;
  list_slug?: string;
  category_slug?: string;
  position?: number;
}) {
  track('item_preview_open', {
    item_id: data.item_id,
    ...(data.list_slug ? { list_slug: data.list_slug } : {}),
    ...(data.category_slug ? { category_slug: data.category_slug } : {}),
    ...(data.position != null ? { position: data.position } : {}),
  });
}

export type CreatorProfileSource =
  | 'list_card'
  | 'spotlight'
  | 'leaderboard'
  | 'list_detail';

export function trackCreatorProfileView(username: string, source: CreatorProfileSource) {
  track('creator_profile_view', {
    creator_username: username,
    source,
  });
}

export type SignupSource =
  | 'home_strip'
  | 'login_banner'
  | 'item_gate'
  | 'bookmark_gate'
  | 'home_empty'
  | 'direct';

export function trackSignupComplete(source: SignupSource = 'direct') {
  track('signup_complete', { source });
}

export function trackFirstBookmark(data: {
  list_slug?: string;
  category_slug?: string;
  source?: string;
}) {
  track('first_bookmark', {
    ...(data.list_slug ? { list_slug: data.list_slug } : {}),
    ...(data.category_slug ? { category_slug: data.category_slug } : {}),
    ...(data.source ? { source: data.source } : {}),
  });
}

export type ListScrollDepth = 25 | 50 | 75 | 100;

export function trackListScrollDepth(data: {
  list_slug: string;
  category_slug?: string;
  depth: ListScrollDepth;
}) {
  track('list_scroll_depth', {
    list_slug: data.list_slug,
    depth: data.depth,
    ...(data.category_slug ? { category_slug: data.category_slug } : {}),
  });
}

/** ثبت جستجو در Umami/Vercel + دیتابیس داخلی (پرجستجو) */
export function trackSearch(query: string, source: string) {
  const trimmed = clipQuery(query);
  if (trimmed.length < 2) return;

  track('search', { query: trimmed, source });

  if (typeof window !== 'undefined') {
    void fetch('/api/search/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed, source }),
      keepalive: true,
    }).catch(() => {});
  }
}
