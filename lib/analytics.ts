'use client';

/**
 * لایه آنالیتیکس - ثبت eventهای سفارشی
 * از Vercel Analytics استفاده می‌کند (صفحات به‌صورت خودکار ثبت می‌شوند)
 */

import { track as vercelTrack } from '@vercel/analytics';

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
  | 'list_suggest';

export function track(event: AnalyticsEvent, data?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(event, data);
  } catch {
    // در محیط dev یا بدون Vercel، ignore
  }
}
