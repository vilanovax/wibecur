import type { Config } from 'tailwindcss';
import {
  brand,
  gray,
  semantic,
  spacing,
  radius,
  shadows,
  motion,
  typography,
} from './lib/design-tokens';

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
        gray: Object.fromEntries(
          Object.entries(gray).map(([k, v]) => [k, v])
        ) as Record<string, string>,
        success: semantic.success,
        warning: semantic.warning,
        danger: semantic.danger,
        info: semantic.info,
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
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
      fontFamily: {
        sans: ['Vazirmatn', 'Vazir', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        vazir: ['Vazirmatn', 'Vazir', 'sans-serif'],
      },
      fontSize: {
        'vibe-h1': [typography.h1.size, { lineHeight: typography.h1.lineHeight }],
        'vibe-h2': [typography.h2.size, { lineHeight: typography.h2.lineHeight }],
        'vibe-h3': [typography.h3.size, { lineHeight: typography.h3.lineHeight }],
        'vibe-h4': [typography.h4.size, { lineHeight: typography.h4.lineHeight }],
        'vibe-body': [typography.body.size, { lineHeight: typography.body.lineHeight }],
        'vibe-caption': [typography.caption.size, { lineHeight: typography.caption.lineHeight }],
      },
      fontWeight: {
        'vibe-h1': String(typography.h1.weight),
        'vibe-h2': String(typography.h2.weight),
        'vibe-h3': String(typography.h3.weight),
        'vibe-h4': String(typography.h4.weight),
      },
      keyframes: {
        savedPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'saved-pulse': 'savedPulse 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;

