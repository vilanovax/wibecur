/**
 * Mock data for Admin Dashboard 3.0 – Control Tower
 * Used when real data is unavailable or for placeholder UI
 */

import type { KpiItem, ModerationAlert, TopList, TopCategory, TopCurator, ActivityEvent } from './types';

export const MOCK_KPIS: KpiItem[] = [
  { label: 'کاربران فعال امروز', value: 142, delta: 12, deltaLabel: 'نسبت به دیروز', trend: 'up' },
  { label: 'کاربران جدید امروز', value: 8, delta: -2, trend: 'down' },
  { label: 'لیست‌های جدید امروز', value: 5, delta: 3, trend: 'up' },
  { label: 'ذخیره امروز', value: 234, delta: 18, trend: 'up' },
  { label: 'نرخ ذخیره', value: '۴.۲٪', delta: 0.3, trend: 'up' },
  { label: 'ریپورت‌های در انتظار', value: 3, delta: 0, trend: 'neutral', sparkline: [2, 4, 3, 5, 3] },
];

export const MOCK_MODERATION: ModerationAlert[] = [
  { id: '1', type: 'reported_items', label: 'ریپورت آیتم‌ها', count: 2, severity: 'high', href: '/admin/comments/item-reports' },
  { id: '2', type: 'pending_lists', label: 'لیست‌های در انتظار بررسی', count: 1, href: '/admin/lists' },
  { id: '3', type: 'flagged_curators', label: 'کیوریتورهای پرچم‌دار', count: 0, href: '/admin/users' },
];

export const MOCK_TOP_LISTS: TopList[] = [
  { id: '1', title: 'بهترین فیلم‌های ۱۴۰۳', slug: 'best-films-1403', category: 'فیلم', saveCount: 1240, viewCount: 5600, isTrending: true },
  { id: '2', title: 'کافه‌های دنج تهران', slug: 'tehran-cafes', category: 'کافه', saveCount: 890, viewCount: 3200, isTrending: true },
  { id: '3', title: 'کتاب‌های توسعه فردی', slug: 'self-dev-books', category: 'کتاب', saveCount: 650, viewCount: 2100 },
];

export const MOCK_TOP_CATEGORIES: TopCategory[] = [
  { id: '1', name: 'فیلم', slug: 'movie', listCount: 45, sharePercent: 32, delta: 5 },
  { id: '2', name: 'کافه', slug: 'cafe', listCount: 28, sharePercent: 20, delta: 2 },
  { id: '3', name: 'کتاب', slug: 'book', listCount: 22, sharePercent: 16, delta: -1 },
];

export const MOCK_TOP_CURATORS: TopCurator[] = [
  { id: '1', name: 'مریم محمدی', username: 'maryam', followers: 1240, saves: 4520, growthPercent: 12, reliability: 'high' },
  { id: '2', name: 'علی رضایی', username: 'ali', followers: 890, saves: 2100, growthPercent: 28, reliability: 'medium' },
];

export const MOCK_ACTIVITIES: ActivityEvent[] = [
  { id: '1', type: 'list_created', title: 'لیست جدید ایجاد شد', description: 'کافه‌های شمال تهران', actor: 'سارا', timestamp: new Date(), href: '/admin/lists' },
  { id: '2', type: 'item_added', title: 'آیتم اضافه شد', description: 'فیلم خاک‌ستر سبز', actor: 'علی', timestamp: new Date(Date.now() - 3600000) },
  { id: '3', type: 'report_submitted', title: 'ریپورت جدید', description: 'آیتم نامناسب', timestamp: new Date(Date.now() - 7200000), href: '/admin/comments/item-reports' },
];
