import sharp from 'sharp';
import { ALLOWED_IMAGE_FORMATS, MAX_UPLOAD_SIZE, ImageProfile, getImageProfile } from './image-config';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Validate image buffer before optimization
 *
 * @param buffer - Image buffer to validate
 * @param profile - Image profile for size limits
 * @returns Validation result with metadata
 */
export async function validateImage(
  buffer: Buffer,
  profile: ImageProfile = 'default'
): Promise<ValidationResult> {
  try {
    // Check file size
    if (buffer.length > MAX_UPLOAD_SIZE) {
      return {
        isValid: false,
        error: `حجم فایل نباید بیشتر از ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB باشد`,
      };
    }

    // Check if it's a valid image
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (error) {
      return {
        isValid: false,
        error: 'فایل انتخاب شده یک تصویر معتبر نیست',
      };
    }

    // Check format
    const format = metadata.format;
    if (!format || !['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
      return {
        isValid: false,
        error: 'فرمت تصویر باید JPG، PNG یا WebP باشد',
      };
    }

    // Check dimensions
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      return {
        isValid: false,
        error: 'ابعاد تصویر نامعتبر است',
      };
    }

    // Check if image is corrupted
    if (!metadata.channels || metadata.channels < 1) {
      return {
        isValid: false,
        error: 'تصویر خراب است یا فرمت آن پشتیبانی نمی‌شود',
      };
    }

    // Get profile config for additional checks
    const profileConfig = getImageProfile(profile);

    // Warn if image is too large (not error, will be resized)
    if (width > profileConfig.maxWidth * 2 || height > profileConfig.maxHeight * 2) {
      console.warn(`Image is very large: ${width}x${height}. Will be resized to ${profileConfig.maxWidth}x${profileConfig.maxHeight}`);
    }

    return {
      isValid: true,
      metadata: {
        width,
        height,
        format,
        size: buffer.length,
      },
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `خطا در بررسی تصویر: ${error.message}`,
    };
  }
}

/**
 * Check if file type is allowed
 */
export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_FORMATS.includes(contentType as any);
}

/**
 * Get file extension from content type
 */
export function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };

  return map[contentType.toLowerCase()] || '.jpg';
}
