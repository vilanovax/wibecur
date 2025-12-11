import sharp from 'sharp';
import { ImageProfile, getImageProfile } from './image-config';

export interface OptimizeImageOptions {
  profile?: ImageProfile;
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
  // Get profile configuration if specified
  const profileConfig = options.profile ? getImageProfile(options.profile) : null;

  const {
    maxWidth = profileConfig?.maxWidth || 1200,
    maxHeight = profileConfig?.maxHeight || 1200,
    quality = profileConfig?.quality || 80,
    format = profileConfig?.format || 'webp',
  } = options;

  const skipThreshold = profileConfig?.skipOptimizationIfSmallerThan || 300 * 1024;

  try {
    // Get image metadata
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const originalSize = buffer.length;
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    console.log(`[${options.profile || 'default'}] Original: ${width}x${height}, ${metadata.format}, ${(originalSize / 1024).toFixed(2)}KB`);

    // Skip optimization if image is already small and appropriately sized
    const isAlreadySmall = originalSize < skipThreshold;
    const isAlreadyRightSize = width <= maxWidth && height <= maxHeight &&
                               width < 800 && height < 800;

    if (isAlreadySmall && isAlreadyRightSize) {
      console.log('✓ Image is already optimized, skipping');
      // Return original with proper format detection
      const ext = metadata.format === 'png' ? '.png' :
                  metadata.format === 'webp' ? '.webp' : '.jpg';
      const contentType = metadata.format === 'png' ? 'image/png' :
                         metadata.format === 'webp' ? 'image/webp' : 'image/jpeg';
      return {
        buffer,
        contentType,
        ext,
      };
    }

    console.log('→ Optimizing image...');

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
    console.log(`✓ Optimized: ${(optimizedBuffer.length / 1024).toFixed(2)}KB (${compressionRatio}% smaller)`);

    return {
      buffer: optimizedBuffer,
      contentType,
      ext,
    };
  } catch (error: any) {
    console.error('⚠️ Optimization failed:', error.message);
    console.log('→ Fallback: trying with lower quality...');

    // Fallback: try with lower quality
    try {
      const fallbackQuality = Math.max(quality - 20, 50);
      const image = sharp(buffer);
      const fallbackBuffer = await image
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: fallbackQuality })
        .toBuffer();

      console.log(`✓ Fallback succeeded with quality ${fallbackQuality}`);
      return {
        buffer: fallbackBuffer,
        contentType: 'image/webp',
        ext: '.webp',
      };
    } catch (fallbackError) {
      console.error('⚠️ Fallback also failed, returning original');
      // Return original if all fails
      const metadata = await sharp(buffer).metadata().catch(() => null);
      const ext = metadata?.format === 'png' ? '.png' :
                  metadata?.format === 'webp' ? '.webp' : '.jpg';
      const contentType = metadata?.format === 'png' ? 'image/png' :
                         metadata?.format === 'webp' ? 'image/webp' : 'image/jpeg';
      return {
        buffer,
        contentType,
        ext,
      };
    }
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
