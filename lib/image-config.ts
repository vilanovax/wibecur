/**
 * Image optimization profiles for different use cases
 */

export type ImageProfile =
  | 'avatar'
  | 'coverProfile'
  | 'coverList'
  | 'itemImage'
  | 'itemThumbnail'
  | 'hubCover'
  | 'default';

export interface ImageProfileConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSize: number; // in bytes
  skipOptimizationIfSmallerThan: number; // in bytes
  format: 'webp' | 'jpeg' | 'png';
}

/**
 * Predefined image profiles for different use cases
 */
export const IMAGE_PROFILES: Record<ImageProfile, ImageProfileConfig> = {
  // User avatar
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
    maxSize: 500 * 1024, // 500KB
    skipOptimizationIfSmallerThan: 200 * 1024, // 200KB
    format: 'webp',
  },

  // Profile cover image
  coverProfile: {
    maxWidth: 1200,
    maxHeight: 500, // Changed from 400 for better mobile ratio
    quality: 85,
    maxSize: 1024 * 1024, // 1MB
    skipOptimizationIfSmallerThan: 300 * 1024, // 300KB
    format: 'webp',
  },

  // List cover image
  coverList: {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 85,
    maxSize: 1.5 * 1024 * 1024, // 1.5MB
    skipOptimizationIfSmallerThan: 400 * 1024, // 400KB
    format: 'webp',
  },

  // Main item image
  itemImage: {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 85,
    maxSize: 1024 * 1024, // 1MB
    skipOptimizationIfSmallerThan: 300 * 1024, // 300KB
    format: 'webp',
  },

  // Item thumbnail
  itemThumbnail: {
    maxWidth: 800, // Changed from 600 for Retina mobile
    maxHeight: 600, // Changed from 450 for Retina mobile
    quality: 80,
    maxSize: 300 * 1024, // 300KB
    skipOptimizationIfSmallerThan: 150 * 1024, // 150KB
    format: 'webp',
  },

  // Hub cover (admin only)
  hubCover: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85, // Changed from 90 - sufficient quality with less size
    maxSize: 2 * 1024 * 1024, // 2MB
    skipOptimizationIfSmallerThan: 500 * 1024, // 500KB
    format: 'webp',
  },

  // Default profile (fallback)
  default: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 80,
    maxSize: 500 * 1024, // 500KB
    skipOptimizationIfSmallerThan: 300 * 1024, // 300KB
    format: 'webp',
  },
};

/**
 * Get image profile configuration
 */
export function getImageProfile(profile: ImageProfile): ImageProfileConfig {
  return IMAGE_PROFILES[profile] || IMAGE_PROFILES.default;
}

/**
 * Allowed image formats for upload
 */
export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

/**
 * Maximum upload size before optimization (10MB)
 */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
