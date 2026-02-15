/**
 * Design Tokens 2.0 – Structured System
 * پایه‌ی Design System وایب
 *
 * 5 لایه:
 * - Base Tokens (raw values)
 * - Semantic Tokens (brand-aware)
 * - Component Tokens (via Tailwind)
 * - Motion Tokens
 * - Dark Mode Tokens (via CSS vars)
 */

// ─── 1. Base: Brand Colors ─────────────────────────────────────────────
export const brand = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#8B5CF6',
  accent: '#EC4899',
} as const;

// ─── 2. Base: Gray Scale (consistent usage) ────────────────────────────
export const gray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const;

// ─── 3. Semantic: State Colors ─────────────────────────────────────────
export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

// ─── 4. Semantic: Surface (light mode) ─────────────────────────────────
export const surfaceLight = {
  bg: gray[50],
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: gray[200],
  borderMuted: gray[100],
  text: gray[900],
  textMuted: gray[600],
  textSubtle: gray[500],
} as const;

// ─── 5. Semantic: Surface (dark mode) ──────────────────────────────────
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

// ─── 6. Spacing Scale (systematic) ─────────────────────────────────────
export const spacing = {
  0: '0',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
} as const;

// ─── 7. Radius Scale (consistent) ──────────────────────────────────────
export const radius = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '18px',
  xl: '22px',
  '2xl': '28px',
  pill: '9999px',
} as const;

// ─── 8. Typography Scale ───────────────────────────────────────────────
export const typography = {
  h1: { size: '24px', weight: 800, lineHeight: '32px' },
  h2: { size: '20px', weight: 700, lineHeight: '28px' },
  h3: { size: '18px', weight: 700, lineHeight: '24px' },
  h4: { size: '16px', weight: 600, lineHeight: '24px' },
  body: { size: '14px', weight: 400, lineHeight: '22px' },
  bodySm: { size: '13px', weight: 400, lineHeight: '20px' },
  caption: { size: '12px', weight: 400, lineHeight: '18px' },
  overline: { size: '11px', weight: 500, lineHeight: '16px' },
} as const;

// ─── 9. Shadows ────────────────────────────────────────────────────────
export const shadows = {
  card: '0 6px 18px rgba(0, 0, 0, 0.06)',
  hero: '0 12px 28px rgba(0, 0, 0, 0.12)',
  floating: '0 20px 40px rgba(0, 0, 0, 0.15)',
  focus: '0 0 0 2px rgba(99, 102, 241, 0.4)',
} as const;

// ─── 10. Motion ────────────────────────────────────────────────────────
export const motion = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

// ─── Tailwind Theme Helpers ────────────────────────────────────────────
/** برای استفاده در tailwind.config */
export const tailwindTheme = {
  colors: {
    primary: {
      DEFAULT: brand.primary,
      dark: brand.primaryDark,
      light: brand.primaryLight,
    },
    secondary: brand.secondary,
    accent: brand.accent,
    gray: Object.fromEntries(
      Object.entries(gray).map(([k, v]) => [k, v])
    ) as Record<keyof typeof gray, string>,
    success: semantic.success,
    warning: semantic.warning,
    danger: semantic.danger,
    info: semantic.info,
  },
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    '2xl': spacing['2xl'],
    '3xl': spacing['3xl'],
    '4xl': spacing['4xl'],
  },
  borderRadius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
    '2xl': radius['2xl'],
    pill: radius.pill,
  },
  boxShadow: {
    card: shadows.card,
    hero: shadows.hero,
    floating: shadows.floating,
    'vibe-card': shadows.card,
    'vibe-hero': shadows.hero,
  },
  transitionDuration: {
    fast: motion.fast,
    normal: motion.normal,
    slow: motion.slow,
  },
  transitionTimingFunction: {
    vibe: motion.easing,
    easeOut: motion.easeOut,
  },
} as const;
