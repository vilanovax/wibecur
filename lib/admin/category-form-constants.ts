import type { CategoryLayoutType } from '@/types/category-page';

export const CATEGORY_LAYOUT_OPTIONS: {
  value: CategoryLayoutType;
  label: string;
  description: string;
}[] = [
  {
    value: 'cinematic',
    label: 'سینمایی',
    description: 'مناسب فیلم و سریال — هیرو بزرگ و فضای تیره',
  },
  {
    value: 'locationBased',
    label: 'مکان‌محور',
    description: 'کافه، رستوران، سفر — تمرکز روی شهر و مکان',
  },
  {
    value: 'editorial',
    label: 'تحریریه',
    description: 'کتاب و محتوای بلند — چیدمان مجله‌ای',
  },
  {
    value: 'minimal',
    label: 'مینیمال',
    description: 'ساده و سبک — برای دسته‌های عمومی',
  },
];

const LAYOUT_SET = new Set<string>(CATEGORY_LAYOUT_OPTIONS.map((o) => o.value));

export function normalizeCategoryLayoutType(value: unknown): CategoryLayoutType | null {
  if (typeof value !== 'string' || !LAYOUT_SET.has(value)) return null;
  return value as CategoryLayoutType;
}

export function getCategoryLayoutLabel(layoutType: string | null | undefined): string {
  if (!layoutType) return '—';
  return CATEGORY_LAYOUT_OPTIONS.find((o) => o.value === layoutType)?.label ?? layoutType;
}

export function normalizeOptionalHexColor(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  return null;
}

export function normalizeOptionalUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
