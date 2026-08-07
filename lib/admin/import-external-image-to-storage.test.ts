import { describe, expect, it } from 'vitest';
import { CASTANDO_IMAGE_PROXY_PREFIX } from '@/lib/castando-image-proxy';
import {
  buildImageImportDownloadCandidates,
  buildPersonAvatarDownloadCandidates,
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
  it('tries castando proxy first for TMDB URLs', () => {
    const src = 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg';
    const candidates = buildImageImportDownloadCandidates(src);
    expect(candidates[0]).toBe(`${CASTANDO_IMAGE_PROXY_PREFIX}${src}`);
    expect(candidates.some((u) => u === src)).toBe(true);
  });

  it('includes TMDB size variants behind proxy', () => {
    const src = 'https://image.tmdb.org/t/p/original/abc.jpg';
    const candidates = buildImageImportDownloadCandidates(src);
    expect(
      candidates.some((u) =>
        u.startsWith(CASTANDO_IMAGE_PROXY_PREFIX) && u.includes('/w500/abc.jpg')
      )
    ).toBe(true);
  });

  it('tries castando proxy first when preferCastandoProxy is set', () => {
    const src = 'https://instagram.com/p/example/media.jpg';
    const candidates = buildImageImportDownloadCandidates(src, { preferCastandoProxy: true });
    expect(candidates[0]).toBe(`${CASTANDO_IMAGE_PROXY_PREFIX}${src}`);
    expect(candidates.some((u) => u === src)).toBe(true);
  });

  it('tries direct URL before castando proxy for amazon', () => {
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

  it('uses castando proxy only for person avatar TMDB URLs', () => {
    const src = 'https://image.tmdb.org/t/p/original/abc.jpg';
    const candidates = buildPersonAvatarDownloadCandidates(src);
    expect(candidates.length).toBe(1);
    expect(candidates[0]).toContain('castando.ir');
    expect(candidates[0]).toContain('/w500/abc.jpg');
    expect(candidates.some((u) => u.includes('image.tmdb.org') && !u.includes('castando'))).toBe(
      false
    );
  });
});
