import type { Metadata, Sharp } from 'sharp';

export type { Metadata, Sharp };

type SharpFactory = (typeof import('sharp'))['default'];

let sharpModule: Promise<SharpFactory> | null = null;

/** بارگذاری lazy — جلوگیری از require شدن sharp در فاز collect page data با Turbopack */
export async function getSharp(): Promise<SharpFactory> {
  if (!sharpModule) {
    sharpModule = import('sharp').then((mod) => mod.default);
  }
  return sharpModule;
}
