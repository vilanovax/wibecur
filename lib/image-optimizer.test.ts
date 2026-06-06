import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { optimizeImageDetailed } from './image-optimizer';
import { getImageProfile } from './image-config';
import { resolveUploadTarget } from './upload-profiles';

describe('resolveUploadTarget', () => {
  it('maps list-cover to lists folder and coverList profile', () => {
    expect(resolveUploadTarget('list-cover')).toEqual({
      folder: 'lists',
      profile: 'coverList',
    });
  });

  it('maps category-hero to hubs folder and hubCover profile', () => {
    expect(resolveUploadTarget('category-hero')).toEqual({
      folder: 'hubs',
      profile: 'hubCover',
    });
  });
});

describe('optimizeImageDetailed coverList', () => {
  it('compresses large JPEG to webp under coverList maxSize', async () => {
    const largeJpeg = await sharp({
      create: {
        width: 2400,
        height: 1600,
        channels: 3,
        background: { r: 180, g: 40, b: 90 },
        noise: {
          type: 'gaussian',
          mean: 128,
          sigma: 30,
        },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await optimizeImageDetailed(largeJpeg, { profile: 'coverList' });
    const profile = getImageProfile('coverList');

    expect(result.contentType).toBe('image/webp');
    expect(result.ext).toBe('.webp');
    expect(result.optimizedBytes).toBeLessThanOrEqual(profile.maxSize);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(profile.maxWidth);
    expect(meta.height).toBeLessThanOrEqual(profile.maxHeight);
  });
});
