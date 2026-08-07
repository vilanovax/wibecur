import { describe, expect, it } from 'vitest';
import {
  buildAvatarPlaceholderSvg,
  isAvatarStorageKey,
} from '@/lib/storage-image-fallback';

describe('storage-image-fallback', () => {
  it('detects avatar keys', () => {
    expect(isAvatarStorageKey('wibe/avatars/abc.jpg')).toBe(true);
    expect(isAvatarStorageKey('wibe/covers/x.webp')).toBe(false);
  });

  it('builds svg placeholder', () => {
    const svg = buildAvatarPlaceholderSvg();
    expect(svg).toContain('<svg');
    expect(svg).toContain('Avatar');
  });
});
