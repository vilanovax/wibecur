import { isOurStorageUrl } from '@/lib/object-storage-config';
import { getLiaraImageMode, toLiaraImageSrc } from '@/lib/liara-image-url';

export const IMAGE_LOAD_MAX_RETRIES = 2;

/** cache-bust برای خطاهای موقت شبکه (مثل ERR_NETWORK_CHANGED) */
export function withImageRetryQuery(src: string, retry: number): string {
  if (!src || retry <= 0) return src;
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}_retry=${retry}`;
}

export type LiaraImageSrcOptions = {
  forceProxy?: boolean;
};

/** آدرس نهایی <img> با پشتیبانی از fallback به proxy */
export function buildLiaraDisplaySrc(
  rawUrl: string,
  options?: LiaraImageSrcOptions & { retry?: number }
): string {
  if (!rawUrl?.trim()) return '';
  const url = rawUrl.trim();
  if (url.startsWith('/')) return withImageRetryQuery(url, options?.retry ?? 0);
  if (!isOurStorageUrl(url)) return url;

  const base = toLiaraImageSrc(url, options);
  return withImageRetryQuery(base, options?.retry ?? 0);
}

/** آیا بعد از retry باید به same-origin proxy سوئیچ کنیم؟ */
export function shouldFallbackLiaraToProxy(rawUrl: string, forceProxy: boolean): boolean {
  return !forceProxy && isOurStorageUrl(rawUrl) && getLiaraImageMode() === 'direct';
}
