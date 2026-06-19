import { describe, expect, it } from 'vitest';
import { CASTANDO_IMAGE_PROXY_PREFIX } from '@/lib/castando-image-proxy';
import {
  buildImageImportDownloadCandidates,
  resolveDownloadUrlForImageImport,
} from '@/lib/admin/import-external-image-to-storage';

describe('resolveDownloadUrlForImageImport', () => {
  it('wraps TMDB poster with castando proxy', () => {
    const src = 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg';
    expect(resolveDownloadUrlForImageImport(src)).toBe(
      `${CASTANDO_IMAGE_PROXY_PREFIX}${src}`
    );
  });

  it('keeps castando proxy URL as-is', () => {
    const wrapped = `${CASTANDO_IMAGE_PROXY_PREFIX}https://example.com/poster.jpg`;
    expect(resolveDownloadUrlForImageImport(wrapped)).toBe(wrapped);
  });

  it('unwraps nested proxy before re-wrapping', () => {
    const inner = 'https://m.media-amazon.com/images/M/poster.jpg';
    const wrapped = `${CASTANDO_IMAGE_PROXY_PREFIX}${inner}`;
    expect(resolveDownloadUrlForImageImport(wrapped)).toBe(wrapped);
  });
});

describe('buildImageImportDownloadCandidates', () => {
  it('tries direct URL before castando proxy', () => {
    const src = 'https://m.media-amazon.com/images/M/poster.jpg';
    const candidates = buildImageImportDownloadCandidates(src);
    expect(candidates[0]).toBe(src);
    expect(candidates.some((u) => u.startsWith(CASTANDO_IMAGE_PROXY_PREFIX))).toBe(true);
  });

  it('includes amazon URL variants', () => {
    const src =
      'https://m.media-amazon.com/images/M/MV5B.jpg@@._V1_SX300.jpg';
    const candidates = buildImageImportDownloadCandidates(src);
    expect(candidates.some((u) => u.includes('_V1_FMjpg_UX1000'))).toBe(true);
  });
});
