type BinaryInput = Buffer | Uint8Array | ArrayBuffer;

function asUint8Array(data: BinaryInput): Uint8Array {
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

/** کپی امن به Node Buffer — sharp/crypto با SharedArrayBuffer خطا می‌دهند */
export function toNodeBuffer(data: BinaryInput): Buffer {
  return Buffer.from(asUint8Array(data).slice());
}
