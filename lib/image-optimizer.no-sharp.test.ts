import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./get-sharp', () => ({
  getSharp: vi.fn(async () => {
    throw new Error('ماژول پردازش تصویر (sharp) روی این سرور بارگذاری نشد: Unsupported CPU');
  }),
  tryGetSharp: vi.fn(async () => null),
  isSharpAvailable: vi.fn(async () => false),
  getSharpLoadError: vi.fn(
    () => new Error('ماژول پردازش تصویر (sharp) روی این سرور بارگذاری نشد: Unsupported CPU')
  ),
}));

describe('optimizeImageDetailed without sharp', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('passthrough uploads original JPEG instead of throwing 500', async () => {
    const { optimizeImageDetailed } = await import('./image-optimizer');
    // minimal JPEG: SOI + APP0-ish + SOF0 with 32x24 + EOI (enough for sniff + SOF reader)
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x18, 0x00, 0x20, 0x01, 0x01, 0x11,
      0x00, 0xff, 0xd9,
    ]);
    // pad so validate length checks elsewhere wouldn't reject — optimizer has no min length
    const padded = Buffer.concat([jpeg, Buffer.alloc(40, 0)]);

    const result = await optimizeImageDetailed(padded, { profile: 'itemImage' });

    expect(result.skipped).toBe(true);
    expect(result.contentType).toBe('image/jpeg');
    expect(result.ext).toBe('.jpg');
    expect(result.buffer.equals(padded)).toBe(true);
    expect(result.width).toBe(32);
    expect(result.height).toBe(24);
  });
});
