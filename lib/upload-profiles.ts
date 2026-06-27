/**
 * نگاشت purpose/فولدر آپلود → پروفایل بهینه‌سازی
 */
import type { ImageProfile } from './image-config';

export type UploadPurpose =
  | 'list-cover'
  | 'list-horizontal'
  | 'category-hero'
  | 'site-logo'
  | 'avatar'
  | 'cover'
  | 'item';

export interface UploadTarget {
  folder: string;
  profile: ImageProfile;
}

const PURPOSE_TARGETS: Record<string, UploadTarget> = {
  'list-cover': { folder: 'lists', profile: 'coverList' },
  'list-horizontal': { folder: 'lists', profile: 'coverListHorizontal' },
  cover: { folder: 'lists', profile: 'coverList' },
  'category-hero': { folder: 'hubs', profile: 'hubCover' },
  'site-logo': { folder: 'site', profile: 'siteLogo' },
  avatar: { folder: 'avatars', profile: 'avatar' },
  item: { folder: 'items', profile: 'itemImage' },
  people: { folder: 'people', profile: 'avatar' },
};

export function resolveUploadTarget(
  purpose?: string | null,
  fallbackFolder = 'uploads'
): UploadTarget {
  if (purpose && PURPOSE_TARGETS[purpose]) {
    return PURPOSE_TARGETS[purpose];
  }

  if (fallbackFolder === 'avatars') return PURPOSE_TARGETS.avatar;
  if (fallbackFolder === 'lists' || fallbackFolder === 'covers') {
    return PURPOSE_TARGETS['list-cover'];
  }
  if (fallbackFolder === 'hubs') return PURPOSE_TARGETS['category-hero'];
  if (fallbackFolder === 'site') return PURPOSE_TARGETS['site-logo'];
  if (fallbackFolder === 'items' || fallbackFolder === 'movies') {
    return PURPOSE_TARGETS.item;
  }
  if (fallbackFolder === 'people') return PURPOSE_TARGETS.people;

  return { folder: fallbackFolder, profile: 'default' };
}

export function profileForStorageFolder(folder: string): ImageProfile {
  return resolveUploadTarget(null, folder).profile;
}
