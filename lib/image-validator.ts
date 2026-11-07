import { ALLOWED_IMAGE_FORMATS, MAX_UPLOAD_SIZE, ImageProfile, getImageProfile } from './image-config';
import { getSharp, type Metadata } from './get-sharp';
import { toNodeBuffer } from './to-node-buffer';

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

/** تشخیص فرمت از بایت‌های ابتدای فایل — وقتی sharp سخت‌گیرانه fail می‌کند */
export function sniffImageFormat(buffer: Buffer): 'jpeg' | 'png' | 'webp' | 'gif' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') {
    return 'gif';
  }
  return null;
}

async function readImageMetadata(buffer: Buffer): Promise<Metadata> {
  const sharp = await getSharp();
  try {
    return await sharp(buffer, { failOn: 'truncated', animated: true }).rotate().metadata();
  } catch (strictError) {
    // بعضی WebP/PNGهای سالم با failOn پیش‌فرض رد می‌شوند
    try {
      return await sharp(buffer, { failOn: 'none', animated: true }).rotate().metadata();
    } catch {
      throw strictError;
    }
  }
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
    const normalized = toNodeBuffer(buffer);
    // Check file size
    if (normalized.length > MAX_UPLOAD_SIZE) {
      return {
        isValid: false,
        error: `حجم فایل نباید بیشتر از ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB باشد`,
      };
    }

    if (normalized.length < 32) {
      return {
        isValid: false,
        error: 'فایل تصویر خالی یا ناقص است',
      };
    }

    const sniffed = sniffImageFormat(normalized);

    // Check if it's a valid image
    let metadata: Metadata;
    try {
      metadata = await readImageMetadata(normalized);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('[validateImage] sharp metadata failed:', {
        sniffed,
        bytes: normalized.length,
        detail,
      });
      if (sniffed === 'webp' || sniffed === 'jpeg' || sniffed === 'png') {
        // امضای فایل درست است ولی decode شکست خورد — پیام دقیق‌تر برای ادمین
        return {
          isValid: false,
          error: `خواندن تصویر ${sniffed.toUpperCase()} روی سرور ناموفق بود. فایل را دوباره به‌صورت JPG ذخیره کنید یا یک بار دیگر آپلود کنید.`,
        };
      }
      return {
        isValid: false,
        error: 'فایل انتخاب شده یک تصویر معتبر نیست',
      };
    }

    // Check format
    const format = metadata.format || sniffed || undefined;
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
    if (metadata.channels != null && metadata.channels < 1) {
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
        size: normalized.length,
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
