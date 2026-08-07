import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

/**
 * Next.js 16+: `next lint` removed — ESLint CLI + flat config.
 * Matches prior `.eslintrc.json` (`next/core-web-vitals` only).
 *
 * eslint-plugin-react-hooks@7 (bundled with eslint-config-next 16) enables
 * React Compiler rules as errors. Those are useful locally but would fail CI
 * across the existing codebase; keep them as warnings until cleaned up.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/unsupported-syntax': 'warn',
      'react-hooks/component-hook-factories': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',
    },
  },
  {
    // global-error intentionally uses a hard <a href="/"> reload when root layout is broken
    files: ['app/global-error.tsx'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'wibe/**',
    'android/**',
    'capacitor-shell/**',
    '.agents/**',
    '.claude/**',
    'public/**',
    'scripts/**',
    'prisma/**',
    'e2e/**',
    'server.js',
    'next.config.js',
    'tailwind.config.ts',
    'postcss.config.js',
    'vitest.config.ts',
    'playwright.config.ts',
    '**/*.mjs',
    '**/*.cjs',
  ]),
]);

export default eslintConfig;
