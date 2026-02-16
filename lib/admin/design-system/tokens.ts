/**
 * Admin Design System — Design Tokens
 * مخصوص Control, Debug, Intelligence
 *
 * Data-first · Semantic · No decorative gradients
 * primary: #6366F1
 */

// ─── 1. Color System (Semantic-Driven) ─────────────────────────────────

export const adminColors = {
  primary: {
    500: '#6366F1',
    600: '#4F46E5',
  },
  success: '#10B981',   // green-500 — رشد، سالم، فعال
  warning: '#F59E0B',   // amber-500 — افت، نیاز به بررسی، Spike
  danger: '#EF4444',    // red-500 — تخلف، حذف، Risk
  info: '#3B82F6',     // blue-500 — داده خنثی، Debug
  trending: '#8B5CF6',  // violet-500 — Score, Rank, Trending
  neutral: {
    text: '#374151',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    bg: '#F9FAFB',
  },
} as const;

// ─── 2. Typography Scale (عدد‌محور) ───────────────────────────────────

export const adminTypography = {
  displayXl: 'text-3xl font-bold',      // Score / KPI
  displayL: 'text-2xl font-semibold',
  heading: 'text-lg font-semibold',
  body: 'text-sm',
  caption: 'text-xs text-gray-500',
  number: 'font-bold tabular-nums',
} as const;

// ─── 3. Spacing Scale (یکپارچه) ──────────────────────────────────────

/** فاصله بین section ها — 32px */
export const sectionGap = 32;
/** فاصله بین کارت‌ها — 24px */
export const cardGap = 24;
/** پدینگ داخلی کارت/پنل — 20px */
export const innerPadding = 20;
/** پدینگ فشرده — 12px */
export const compactPadding = 12;

/** Tailwind classes برای spacing */
export const adminSpacing = {
  sectionGap: 'gap-8',      // 32px
  cardGap: 'gap-6',        // 24px
  innerPadding: 'p-5',     // 20px
  compactPadding: 'p-3',   // 12px
} as const;

// ─── 4. Radius System ──────────────────────────────────────────────────

export const adminRadius = {
  card: 'rounded-2xl',
  button: 'rounded-xl',
  badge: 'rounded-full',
  input: 'rounded-lg',
} as const;

// ─── 5. Elevation / Shadow ─────────────────────────────────────────────

export const adminShadow = {
  card: 'shadow-sm',
  cardHover: 'shadow-md',
  modal: 'shadow-lg',
} as const;

// ─── 6. Motion ────────────────────────────────────────────────────────

/** Admin = جدی. بدون bounce و انیمیشن هیجانی */
export const adminMotion = {
  hover: 'transition-[box-shadow,border-color] duration-150',
  modal: 'duration-200',
} as const;

// ─── 7. Status Language (یکسان‌سازی متنی) ─────────────────────────────

export const adminStatusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  shadowed: 'Shadowed',
  underReview: 'Under Review',
} as const;

export type AdminStatusKey = keyof typeof adminStatusLabels;
