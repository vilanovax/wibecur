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

/** ابعاد WebP از هدر VP8/VP8L/VP8X — بدون وابستگی به sharp */
export function readWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (sniffImageFormat(buffer) !== 'webp' || buffer.length < 30) return null;
  const type = buffer.toString('ascii', 12, 16);
  try {
    if (type === 'VP8X' && buffer.length >= 30) {
      const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
      const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
      if (width > 0 && height > 0) return { width, height };
    }
    if (type === 'VP8 ' && buffer.length >= 30) {
      // frame header starts at offset 23 after "VP8 " + size
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      if (width > 0 && height > 0) return { width, height };
    }
    if (type === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      if (width > 0 && height > 0) return { width, height };
    }
  } catch {
    return null;
  }
  return null;
}

async function readImageMetadata(buffer: Buffer): Promise<Metadata> {
  const sharp = await getSharp();
  // بدون rotate — بعضی WebPها با rotate قبل از metadata روی musl می‌شکنند
  try {
    return await sharp(buffer, { failOn: 'none', animated: true, unlimited: true }).metadata();
  } catch (firstError) {
    try {
      return await sharp(buffer, { failOn: 'truncated', animated: false }).metadata();
    } catch {
      // آخرین تلاش: decode اجباری با re-encode
      try {
        const decoded = await sharp(buffer, { failOn: 'none', animated: true })
          .rotate()
          .toBuffer({ resolveWithObject: true });
        return {
          ...decoded.info,
          format: decoded.info.format,
          width: decoded.info.width,
          height: decoded.info.height,
          channels: decoded.info.channels,
        } as Metadata;
      } catch {
        throw firstError;
      }
    }
  }
}

/**
 * Validate image buffer before optimization
 */
export async function validateImage(
  buffer: Buffer,
  profile: ImageProfile = 'default'
): Promise<ValidationResult> {
  try {
    const normalized = toNodeBuffer(buffer);
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

    let metadata: Metadata | null = null;
    let sharpErrorDetail: string | null = null;
    try {
      metadata = await readImageMetadata(normalized);
    } catch (error) {
      sharpErrorDetail = error instanceof Error ? error.message : String(error);
      console.error('[validateImage] sharp metadata failed:', {
        sniffed,
        bytes: normalized.length,
        detail: sharpErrorDetail,
      });
    }

    // اگر sharp شکست خورد ولی امضای فایل معتبر است، از هدر WebP ابعاد را بگیر
    if (!metadata && sniffed === 'webp') {
      const dims = readWebpDimensions(normalized);
      if (dims) {
        console.warn('[validateImage] accepting WebP via header dimensions; sharp failed:', sharpErrorDetail);
        metadata = {
          format: 'webp',
          width: dims.width,
          height: dims.height,
          channels: 3,
        } as Metadata;
      }
    }

    // JPEG/PNG با امضای درست — اجازه بده بهینه‌ساز با failOn:none تلاش کند
    if (!metadata && (sniffed === 'jpeg' || sniffed === 'png')) {
      console.warn('[validateImage] accepting', sniffed, 'via magic bytes; sharp failed:', sharpErrorDetail);
      metadata = {
        format: sniffed === 'jpeg' ? 'jpeg' : 'png',
        width: 1,
        height: 1,
        channels: sniffed === 'png' ? 4 : 3,
      } as Metadata;
    }

    if (!metadata) {
      return {
        isValid: false,
        error: sniffed
          ? `خواندن تصویر ${sniffed.toUpperCase()} روی سرور ناموفق بود. فایل را دوباره به‌صورت JPG ذخیره کنید یا یک بار دیگر آپلود کنید.`
          : 'فایل انتخاب شده یک تصویر معتبر نیست',
      };
    }

    const format = metadata.format || sniffed || undefined;
    if (!format || !['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
      return {
        isValid: false,
        error: 'فرمت تصویر باید JPG، PNG یا WebP باشد',
      };
    }

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      return {
        isValid: false,
        error: 'ابعاد تصویر نامعتبر است',
      };
    }

    if (metadata.channels != null && metadata.channels < 1) {
      return {
        isValid: false,
        error: 'تصویر خراب است یا فرمت آن پشتیبانی نمی‌شود',
      };
    }

    const profileConfig = getImageProfile(profile);

    if (width > profileConfig.maxWidth * 2 || height > profileConfig.maxHeight * 2) {
      console.warn(
        `Image is very large: ${width}x${height}. Will be resized to ${profileConfig.maxWidth}x${profileConfig.maxHeight}`
      );
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
