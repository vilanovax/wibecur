/**
 * Slug helpers for admin lists (same format rules as categories)
 */

import { isValidCategorySlug, buildSlugCandidates } from '@/lib/admin/category-slug';

export const isValidListSlug = isValidCategorySlug;
export { buildSlugCandidates };

export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeListSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
