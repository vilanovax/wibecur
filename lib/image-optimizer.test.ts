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

describe('optimizeImageDetailed hubCover', () => {
  it('compresses large JPEG to webp under hubCover maxSize (category hero)', async () => {
    const largeJpeg = await sharp({
      create: {
        width: 2560,
        height: 1440,
        channels: 3,
        background: { r: 30, g: 60, b: 120 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await optimizeImageDetailed(largeJpeg, { profile: 'hubCover' });
    const profile = getImageProfile('hubCover');

    expect(result.contentType).toBe('image/webp');
    expect(result.ext).toBe('.webp');
    expect(result.optimizedBytes).toBeLessThanOrEqual(profile.maxSize);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(profile.maxWidth);
    expect(meta.height).toBeLessThanOrEqual(profile.maxHeight);
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
    expect(meta.width).toBe(1280);
    expect(meta.height).toBe(960);
  });

  it('crops wide image to 4:3 for coverList', async () => {
    const wideJpeg = await sharp({
      create: {
        width: 2400,
        height: 1000,
        channels: 3,
        background: { r: 20, g: 80, b: 140 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const result = await optimizeImageDetailed(wideJpeg, { profile: 'coverList' });
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(1280);
    expect(meta.height).toBe(960);
  });
});

describe('optimizeImageDetailed coverListHorizontal', () => {
  it('crops image to 21:9 banner', async () => {
    const tallJpeg = await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 3,
        background: { r: 90, g: 20, b: 40 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const result = await optimizeImageDetailed(tallJpeg, { profile: 'coverListHorizontal' });
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(686);
  });
});
