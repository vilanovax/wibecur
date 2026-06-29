/**
 * Shared list badge styles — consumer UI.
 * Hot/trending/viral use warning (amber); primary reserved for CTA and featured admin picks.
 */
export const LIST_BADGE_LABELS = {
  trending: 'ترند',
  TRENDING: 'ترند',
  new: 'جدید',
  NEW: 'جدید',
  featured: 'ویژه',
  FEATURED: 'ویژه',
  rising: 'در حال رشد',
  ai: 'AI',
} as const;

/** Solid pill on images */
export const listBadgeSolidStyles = {
  trending: 'bg-warning text-white',
  TRENDING: 'bg-warning/90 text-white',
  new: 'bg-success text-white',
  NEW: 'bg-success/90 text-white',
  featured: 'bg-primary text-white',
  FEATURED: 'bg-primary/90 text-white',
  rising: 'bg-primary text-white',
  ai: 'bg-info text-white',
} as const;

/** Soft pill on light backgrounds */
export const listBadgeSoftStyles = {
  trending: 'bg-warning/10 text-warning',
  TRENDING: 'bg-warning/10 text-warning',
} as const;

export type ListBadgeKey = keyof typeof listBadgeSolidStyles;

export function listBadgeLabel(key: string): string | undefined {
  return LIST_BADGE_LABELS[key as keyof typeof LIST_BADGE_LABELS];
}

export function listBadgeSolidClass(key: string, fallback = 'bg-gray-100 text-foreground'): string {
  return listBadgeSolidStyles[key as ListBadgeKey] ?? fallback;
}
