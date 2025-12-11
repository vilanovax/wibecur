import sharp from 'sharp';

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
  // Maximum dimensions
  maxWidth: 1200, // Good for Retina displays (600px * 2)
  maxHeight: 1200,

  // Quality settings
  quality: {
    webp: 80, // WebP quality (better compression)
    jpeg: 85, // JPEG quality (fallback)
  },

  // Format preference
  format: 'webp' as const, // WebP is 70% smaller than JPEG

  // Max file size target (not hard limit, but we optimize toward this)
  targetMaxSize: 500 * 1024, // 500KB
};

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimize image buffer for web delivery
 * - Resize to max dimensions
 * - Convert to WebP for better compression
 * - Optimize quality
 *
 * @param buffer - Original image buffer
 * @param options - Optimization options
 * @returns Optimized image buffer and content type
 */
export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeImageOptions = {}
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const {
    maxWidth = IMAGE_CONFIG.maxWidth,
    maxHeight = IMAGE_CONFIG.maxHeight,
    quality = IMAGE_CONFIG.quality.webp,
    format = IMAGE_CONFIG.format,
  } = options;

  try {
    // Get image metadata
    const image = sharp(buffer);
    const metadata = await image.metadata();

    console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}, size: ${(buffer.length / 1024).toFixed(2)}KB`);

    // Resize if needed (maintain aspect ratio)
    let processedImage = image.resize(maxWidth, maxHeight, {
      fit: 'inside', // Don't crop, just fit inside dimensions
      withoutEnlargement: true, // Don't upscale small images
    });

    // Convert to desired format with optimization
    let optimizedBuffer: Buffer;
    let contentType: string;
    let ext: string;

    if (format === 'webp') {
      optimizedBuffer = await processedImage
        .webp({
          quality,
          effort: 4, // 0-6, higher = better compression but slower (4 is balanced)
        })
        .toBuffer();
      contentType = 'image/webp';
      ext = '.webp';
    } else if (format === 'jpeg') {
      optimizedBuffer = await processedImage
        .jpeg({
          quality,
          mozjpeg: true, // Use mozjpeg for better compression
        })
        .toBuffer();
      contentType = 'image/jpeg';
      ext = '.jpg';
    } else {
      // PNG (not recommended for photos, use for graphics/logos)
      optimizedBuffer = await processedImage
        .png({
          quality,
          compressionLevel: 9,
        })
        .toBuffer();
      contentType = 'image/png';
      ext = '.png';
    }

    const compressionRatio = ((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1);
    console.log(`Optimized image: size: ${(optimizedBuffer.length / 1024).toFixed(2)}KB (${compressionRatio}% smaller)`);

    return {
      buffer: optimizedBuffer,
      contentType,
      ext,
    };
  } catch (error: any) {
    console.error('Image optimization failed:', error.message);
    // If optimization fails, return original buffer
    return {
      buffer,
      contentType: 'image/jpeg',
      ext: '.jpg',
    };
  }
}

/**
 * Detect if buffer is an image and get its type
 */
export async function detectImageType(buffer: Buffer): Promise<string | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.format || null;
  } catch {
    return null;
  }
}
