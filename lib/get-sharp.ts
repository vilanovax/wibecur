import type { Metadata, Sharp } from 'sharp';

export type { Metadata, Sharp };

type SharpFactory = (typeof import('sharp'))['default'];

let cachedSharp: SharpFactory | null | undefined;
let sharpLoadError: Error | null = null;
let loading: Promise<SharpFactory | null> | null = null;

function asLoadError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/**
 * آیا باینری native/wasm sharp روی این runtime قابل بارگذاری است؟
 * روی بعضی هاست‌ها (CPU بدون x86-64-v2 یا بدون WASM SIMD) sharp کلاً لود نمی‌شود.
 */
export async function isSharpAvailable(): Promise<boolean> {
  return (await tryGetSharp()) != null;
}

/** آخرین خطای بارگذاری sharp — برای لاگ و پیام کاربر */
export function getSharpLoadError(): Error | null {
  return sharpLoadError;
}

async function loadSharpOnce(): Promise<SharpFactory | null> {
  if (cachedSharp !== undefined) return cachedSharp;
  if (sharpLoadError) return null;
  if (!loading) {
    loading = import('sharp')
      .then((mod) => {
        cachedSharp = mod.default;
        return cachedSharp;
      })
      .catch((error: unknown) => {
        const err = asLoadError(error);
        sharpLoadError = new Error(
          `ماژول پردازش تصویر (sharp) روی این سرور بارگذاری نشد: ${err.message}`
        );
        cachedSharp = null;
        console.error('[getSharp] load failed:', err.message);
        return null;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

/** اگر sharp در دسترس نباشد null؛ بدون پرتاب */
export async function tryGetSharp(): Promise<SharpFactory | null> {
  return loadSharpOnce();
}

/**
 * بارگذاری lazy — جلوگیری از require شدن sharp در فاز collect page data با Turbopack.
 * اگر باینری native/wasm روی runtime لود نشود، خطا می‌دهد (یک‌بار کش می‌شود).
 */
export async function getSharp(): Promise<SharpFactory> {
  const sharp = await loadSharpOnce();
  if (!sharp) {
    throw (
      sharpLoadError ??
      new Error('ماژول پردازش تصویر (sharp) روی این سرور بارگذاری نشد.')
    );
  }
  return sharp;
}
