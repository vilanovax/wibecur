/** @type {import('@lhci/cli/src/index').LHCI.ServerCommand.Options} */
const baseUrl = process.env.LHCI_BASE_URL || 'http://localhost:3002';

/**
 * Seed uses slug `movies`; production may use `film`. Override with LHCI_CATEGORY_PATH.
 * @example LHCI_CATEGORY_PATH=/categories/film npm run lighthouse:ci
 */
const categoryPath = process.env.LHCI_CATEGORY_PATH || '/categories/movies';

/**
 * Public list detail for audits. Override with LHCI_LIST_PATH.
 * @example LHCI_LIST_PATH=/lists/great-breakfast-cafes npm run lighthouse:ci
 */
const listPath = process.env.LHCI_LIST_PATH || '/lists/great-breakfast-cafes';

const homePath = process.env.LHCI_HOME_PATH || '/';

/** @type {import('@lhci/cli/src/index').LHCI.ServerCommand.Options} */
module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}${homePath}`,
        `${baseUrl}${categoryPath}`,
        `${baseUrl}${listPath}`,
      ],
      numberOfRuns: process.env.CI ? 2 : 1,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.65 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 450 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.12 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
