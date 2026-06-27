import {
  isAppObjectStorageImageUrl,
} from '@/lib/item-image-storage';

export type PersonImageStatus = 'none' | 'storage' | 'external';

export function personImageStorageStatus(url: string | null | undefined): PersonImageStatus {
  if (!url?.trim()) return 'none';
  if (isAppObjectStorageImageUrl(url.trim())) return 'storage';
  return 'external';
}
