import { describe, expect, it } from 'vitest';
import {
  readJpegDimensions,
  readPngDimensions,
  readWebpDimensions,
  sniffImageFormat,
  validateImage,
} from './image-validator';
import { getSharp } from './get-sharp';

describe('sniffImageFormat', () => {
  it('detects webp RIFF signature', () => {
    const buf = Buffer.alloc(12);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(100, 4);
    buf.write('WEBP', 8);
    expect(sniffImageFormat(buf)).toBe('webp');
  });

  it('detects jpeg SOI', () => {
    const buf = Buffer.alloc(12, 0);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    expect(sniffImageFormat(buf)).toBe('jpeg');
  });

  it('detects png signature', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImageFormat(buf)).toBe('png');
  });
});

describe('readWebpDimensions', () => {
  it('reads dimensions from a real sharp webp', async () => {
    const sharp = await getSharp();
    const webp = await sharp({
      create: {
        width: 160,
        height: 68,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    const dims = readWebpDimensions(Buffer.from(webp));
    expect(dims).toEqual({ width: 160, height: 68 });
  });
});

describe('readPngDimensions / readJpegDimensions', () => {
  it('reads PNG IHDR without sharp metadata path', async () => {
    const sharp = await getSharp();
    const png = await sharp({
      create: {
        width: 88,
        height: 44,
        channels: 4,
        background: { r: 1, g: 2, b: 3, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    expect(readPngDimensions(Buffer.from(png))).toEqual({ width: 88, height: 44 });
  });

  it('reads JPEG SOF without sharp metadata path', async () => {
    const sharp = await getSharp();
    const jpeg = await sharp({
      create: {
        width: 120,
        height: 90,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg({ quality: 80 })
      .toBuffer();

    expect(readJpegDimensions(Buffer.from(jpeg))).toEqual({ width: 120, height: 90 });
  });
});

describe('validateImage', () => {
  it('accepts a real webp buffer from sharp', async () => {
    const sharp = await getSharp();
    const webp = await sharp({
      create: {
        width: 96,
        height: 72,
        channels: 3,
        background: { r: 40, g: 80, b: 120 },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    const result = await validateImage(Buffer.from(webp), 'coverList');
    expect(result.isValid).toBe(true);
    expect(result.metadata?.format).toBe('webp');
    expect(result.metadata?.width).toBe(96);
    expect(result.metadata?.height).toBe(72);
  });

  it('rejects empty buffer', async () => {
    const result = await validateImage(Buffer.alloc(8), 'coverList');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/خالی|ناقص|معتبر/);
  });
});
