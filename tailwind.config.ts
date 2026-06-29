import type { Config } from 'tailwindcss';
import {
  brand,
  gray,
  semantic,
  wibe,
  spacing,
  radius,
  shadows,
  motion,
  typography,
  admin,
  adminText,
  adminStatus,
  adminStatusBg,
  intelligence,
  adminRadius,
  adminShadows,
  adminTypography,
} from './lib/design-tokens';

function typeScale(entry: { size: string; lineHeight: string; weight?: number }) {
  return [
    entry.size,
    {
      lineHeight: entry.lineHeight,
      ...(entry.weight != null ? { fontWeight: String(entry.weight) } : {}),
    },
  ] as [string, { lineHeight: string; fontWeight?: string }];
}

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: brand.primary,
          dark: brand.primaryDark,
          light: brand.primaryLight,
        },
        secondary: brand.secondary,
        accent: brand.accent,
        wibe: {
          background: wibe.background,
          surface: wibe.surface,
          card: wibe.card,
          'text-primary': wibe.textPrimary,
          'text-secondary': wibe.textSecondary,
          border: wibe.border,
        },
        background: wibe.background,
        foreground: wibe.textPrimary,
        muted: {
          DEFAULT: gray[100],
          foreground: wibe.textSecondary,
        },
        border: wibe.border,
        gray: Object.fromEntries(Object.entries(gray).map(([k, v]) => [k, v])) as Record<
          string,
          string
        >,
        success: semantic.success,
        warning: semantic.warning,
        hot: semantic.hot,
        danger: semantic.danger,
        info: semantic.info,
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },
        admin: {
          bg: admin.bg,
          card: admin.card,
          muted: admin.muted,
          border: admin.border,
          hover: admin.hover,
        },
        'admin-text': {
          primary: adminText.primary,
          secondary: adminText.secondary,
          tertiary: adminText.tertiary,
          inverse: adminText.inverse,
        },
        'admin-status': {
          success: adminStatus.success,
          warning: adminStatus.warning,
          danger: adminStatus.danger,
          info: adminStatus.info,
          disabled: adminStatus.disabled,
        },
        'admin-status-bg': {
          success: adminStatusBg.success,
          warning: adminStatusBg.warning,
          danger: adminStatusBg.danger,
          info: adminStatusBg.info,
        },
        intelligence: {
          trending: intelligence.trending,
          boost: intelligence.boost,
          analytics: intelligence.analytics,
        },
      },
      spacing: {
        xs: spacing.xs,
        sm: spacing.sm,
        md: spacing.md,
        lg: spacing.lg,
        xl: spacing.xl,
        '2xl': spacing['2xl'],
        '3xl': spacing['3xl'],
      },
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        pill: radius.pill,
        'admin-sm': adminRadius.sm,
        'admin-md': adminRadius.md,
        'admin-lg': adminRadius.lg,
        'admin-xl': adminRadius.xl,
      },
      boxShadow: {
        sm: shadows.sm,
        card: shadows.card,
        hero: shadows.hero,
        floating: shadows.floating,
        focus: shadows.focus,
        'vibe-card': shadows.card,
        'vibe-hero': shadows.hero,
        admin: adminShadows.admin,
        'admin-lg': adminShadows.adminLg,
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
      fontFamily: {
        sans: [
          'var(--font-vazirmatn)',
          'Vazirmatn',
          'Vazir',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        vazir: ['var(--font-vazirmatn)', 'Vazirmatn', 'Vazir', 'sans-serif'],
      },
      fontSize: {
        /* Wibe Design System scale */
        display: typeScale(typography.display),
        h1: typeScale(typography.h1),
        h2: typeScale(typography.h2),
        h3: typeScale(typography.h3),
        body: typeScale(typography.body),
        small: typeScale(typography.small),
        caption: typeScale(typography.caption),
        /* Legacy aliases */
        'vibe-h1': typeScale(typography.h1),
        'vibe-h2': typeScale(typography.h2),
        'vibe-h3': typeScale(typography.h3),
        'vibe-h4': typeScale(typography.small),
        'vibe-body': typeScale(typography.body),
        'vibe-caption': typeScale(typography.caption),
        'admin-xs': [adminTypography.xs.size, { lineHeight: adminTypography.xs.lineHeight }],
        'admin-sm': [adminTypography.sm.size, { lineHeight: adminTypography.sm.lineHeight }],
        'admin-base': [adminTypography.base.size, { lineHeight: adminTypography.base.lineHeight }],
        'admin-lg': [adminTypography.lg.size, { lineHeight: adminTypography.lg.lineHeight }],
        'admin-xl': [adminTypography.xl.size, { lineHeight: adminTypography.xl.lineHeight }],
        'admin-2xl': [adminTypography['2xl'].size, { lineHeight: adminTypography['2xl'].lineHeight }],
      },
      keyframes: {
        savedPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '220% 0' },
          '100%': { backgroundPosition: '-220% 0' },
        },
      },
      animation: {
        'saved-pulse': 'savedPulse 0.4s ease-out',
        shimmer: 'shimmer 1.75s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
