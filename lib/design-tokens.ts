/**
 * Wibe Design System — Design Tokens
 * @see Product context: save-first discovery, mobile-first, RTL
 *
 * لایه‌ها: Brand → Semantic (surface/text) → Typography → Spacing → Radius → Shadow → Motion
 */

// ─── Brand ─────────────────────────────────────────────────────────────
export const brand = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  /** Legacy — use sparingly in consumer UI */
  secondary: '#8B5CF6',
  accent: '#EC4899',
} as const;

// ─── Consumer semantic colors (Wibe mobile app) ───────────────────────
export const wibe = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
} as const;

// ─── Gray scale (utilities only) ───────────────────────────────────────
export const gray = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
} as const;

// ─── Semantic state ────────────────────────────────────────────────────
export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  /** Hot / trending / viral — same family as warning in consumer UI */
  hot: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

// ─── Surface (CSS var source — light mode) ─────────────────────────────
export const surfaceLight = {
  bg: wibe.background,
  surface: wibe.surface,
  surfaceRaised: wibe.card,
  border: wibe.border,
  borderMuted: gray[100],
  text: wibe.textPrimary,
  textMuted: wibe.textSecondary,
  textSubtle: gray[400],
} as const;

export const surfaceDark = {
  bg: gray[900],
  surface: gray[800],
  surfaceRaised: gray[700],
  border: gray[600],
  borderMuted: gray[700],
  text: gray[50],
  textMuted: gray[300],
  textSubtle: gray[400],
} as const;

/** فقط: 4 / 8 / 12 / 16 / 24 / 32 / 48 */
export const spacing = {
  0: '0',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

/** sm → 8 | md → 14 | lg → 20 | xl → 28 */
export const radius = {
  none: '0',
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  pill: '9999px',
} as const;

/** Typography — Vazirmatn, airy line heights */
export const typography = {
  display: { size: '32px', weight: 700, lineHeight: '44px' },
  h1: { size: '28px', weight: 700, lineHeight: '40px' },
  h2: { size: '24px', weight: 700, lineHeight: '34px' },
  h3: { size: '20px', weight: 600, lineHeight: '28px' },
  body: { size: '16px', weight: 400, lineHeight: '26px' },
  small: { size: '14px', weight: 400, lineHeight: '22px' },
  caption: { size: '12px', weight: 400, lineHeight: '18px' },
} as const;

/** Subtle shadows only — no heavy glow */
export const shadows = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
  card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
  hero: '0 4px 16px rgba(15, 23, 42, 0.08)',
  floating: '0 8px 24px rgba(15, 23, 42, 0.10)',
  focus: '0 0 0 2px rgba(99, 102, 241, 0.35)',
} as const;

export const motion = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

// ─── Admin (unchanged scope — separate from consumer) ───────────────────
export const admin = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  hover: '#F8FAFC',
} as const;

export const adminText = {
  primary: '#0F172A',
  secondary: '#475569',
  tertiary: '#94A3B8',
  inverse: '#FFFFFF',
} as const;

export const adminStatus = {
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',
  disabled: '#94A3B8',
} as const;

export const adminStatusBg = {
  success: '#DCFCE7',
  warning: '#FEF3C7',
  danger: '#FEE2E2',
  info: '#DBEAFE',
} as const;

export const intelligence = {
  trending: '#7C3AED',
  boost: '#F97316',
  analytics: '#0EA5E9',
} as const;

export const adminRadius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
} as const;

export const adminShadows = {
  admin: '0 2px 6px rgba(15, 23, 42, 0.05)',
  adminLg: '0 8px 24px rgba(15, 23, 42, 0.08)',
} as const;

export const adminTypography = {
  xs: { size: '12px', lineHeight: '16px' },
  sm: { size: '14px', lineHeight: '20px' },
  base: { size: '16px', lineHeight: '24px' },
  lg: { size: '18px', lineHeight: '26px' },
  xl: { size: '20px', lineHeight: '28px' },
  '2xl': { size: '24px', lineHeight: '32px' },
} as const;

export const adminDark = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
} as const;

/** CSS custom properties for :root — keep in sync with globals.css */
export function getCssVariableDefinitions(): Record<string, string> {
  return {
    '--primary': brand.primary,
    '--primary-dark': brand.primaryDark,
    '--primary-light': brand.primaryLight,
    '--wibe-background': wibe.background,
    '--wibe-surface': wibe.surface,
    '--wibe-card': wibe.card,
    '--color-bg': surfaceLight.bg,
    '--color-surface': surfaceLight.surface,
    '--color-surface-raised': surfaceLight.surfaceRaised,
    '--color-border': surfaceLight.border,
    '--color-border-muted': surfaceLight.borderMuted,
    '--color-text': surfaceLight.text,
    '--color-text-muted': surfaceLight.textMuted,
    '--color-text-subtle': surfaceLight.textSubtle,
    '--color-success': semantic.success,
    '--color-warning': semantic.warning,
    '--color-hot': semantic.hot,
    '--color-danger': semantic.danger,
    '--color-info': semantic.info,
    '--shadow-sm': shadows.sm,
    '--shadow-card': shadows.card,
    '--shadow-hero': shadows.hero,
    '--shadow-floating': shadows.floating,
    '--shadow-focus': shadows.focus,
    '--spacing-xs': spacing.xs,
    '--spacing-sm': spacing.sm,
    '--spacing-md': spacing.md,
    '--spacing-lg': spacing.lg,
    '--spacing-xl': spacing.xl,
    '--spacing-2xl': spacing['2xl'],
    '--spacing-3xl': spacing['3xl'],
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    '--radius-pill': radius.pill,
    '--motion-fast': motion.fast,
    '--motion-normal': motion.normal,
    '--motion-slow': motion.slow,
    '--motion-easing': motion.easing,
  };
}

/** Tailwind theme extension snapshot */
export const tailwindTheme = {
  colors: {
    primary: { DEFAULT: brand.primary, dark: brand.primaryDark, light: brand.primaryLight },
    wibe,
    gray: Object.fromEntries(Object.entries(gray).map(([k, v]) => [k, v])) as Record<
      keyof typeof gray,
      string
    >,
    success: semantic.success,
    warning: semantic.warning,
    danger: semantic.danger,
    info: semantic.info,
  },
  spacing,
  borderRadius: radius,
  boxShadow: shadows,
  transitionDuration: { fast: motion.fast, normal: motion.normal, slow: motion.slow },
  transitionTimingFunction: { vibe: motion.easing, easeOut: motion.easeOut },
} as const;
