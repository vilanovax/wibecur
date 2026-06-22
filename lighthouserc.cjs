/** @type {import('@lhci/cli/src/index').LHCI.ServerCommand.Options} */
const baseUrl = process.env.LHCI_BASE_URL || 'http://localhost:3002';

/**
 * Seed uses slug `movies`; production may use `film`. Override with LHCI_CATEGORY_PATH.
 * @example LHCI_CATEGORY_PATH=/categories/film npm run lighthouse:ci
 */
const categoryPath = process.env.LHCI_CATEGORY_PATH || '/categories/movies';

/**
 * Seed item with poster for item detail audits. Override with LHCI_ITEM_PATH.
 * @example LHCI_ITEM_PATH=/items/your-id npm run lighthouse:ci
 */
const itemPath =
  process.env.LHCI_ITEM_PATH || '/items/ishGWMipxDOeMKb9W3W80';

const explorePath = process.env.LHCI_EXPLORE_PATH || '/user-lists';

/** @type {import('@lhci/cli/src/index').LHCI.ServerCommand.Options} */
module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/lists`,
        `${baseUrl}${categoryPath}`,
        `${baseUrl}${itemPath}`,
        `${baseUrl}${explorePath}`,
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
