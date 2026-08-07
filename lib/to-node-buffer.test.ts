import { describe, expect, it } from 'vitest';
import { toNodeBuffer } from './to-node-buffer';

describe('toNodeBuffer', () => {
  it('copies SharedArrayBuffer-backed Uint8Array for sharp-safe Buffer', () => {
    const sab = new SharedArrayBuffer(8);
    const view = new Uint8Array(sab);
    view[0] = 0xff;
    view[1] = 0xd8;

    const buf = toNodeBuffer(view);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.buffer).not.toBe(sab);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
  });
});
