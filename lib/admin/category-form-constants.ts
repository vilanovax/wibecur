import type { CategoryLayoutType } from '@/types/category-page';

/** نحوهٔ نمایش عنوان و سایه روی کارت کاور لیست در اپ */
export type CoverDisplayMode = 'ui' | 'baked' | 'photo';

export const COVER_DISPLAY_MODE_OPTIONS: {
  value: CoverDisplayMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'ui',
    label: 'عنوان روی کاور',
    description: 'عکس تمیز + لایهٔ تیره + عنوان UI (پیش‌فرض)',
  },
  {
    value: 'baked',
    label: 'پوستر طراحی‌شده',
    description: 'عنوان داخل تصویر است — بدون متن و سایهٔ UI',
  },
  {
    value: 'photo',
    label: 'عنوان زیر عکس',
    description: 'کاور بدون لایه؛ عنوان زیر تصویر نمایش داده می‌شود',
  },
];

const COVER_MODE_SET = new Set<string>(COVER_DISPLAY_MODE_OPTIONS.map((o) => o.value));

export function normalizeCoverDisplayMode(value: unknown): CoverDisplayMode {
  if (typeof value === 'string' && COVER_MODE_SET.has(value)) {
    return value as CoverDisplayMode;
  }
  return 'ui';
}

/** پرچم‌های نمایش کاور لیست بر اساس تنظیمات دسته */
export function getCoverDisplayFlags(value: unknown): {
  mode: CoverDisplayMode;
  showScrim: boolean;
  showTitleOnCover: boolean;
  showTitleBelow: boolean;
} {
  const mode = normalizeCoverDisplayMode(value);
  return {
    mode,
    showScrim: mode === 'ui',
    showTitleOnCover: mode === 'ui',
    showTitleBelow: mode === 'photo',
  };
}

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
