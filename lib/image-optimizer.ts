import sharp from 'sharp';
import { ImageProfile, getImageProfile } from './image-config';

export interface OptimizeImageOptions {
  profile?: ImageProfile;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface OptimizeImageResult {
  buffer: Buffer;
  contentType: string;
  ext: string;
  originalBytes: number;
  optimizedBytes: number;
  skipped: boolean;
}

function buildResult(
  buffer: Buffer,
  contentType: string,
  ext: string,
  originalBytes: number,
  skipped = false
): OptimizeImageResult {
  return {
    buffer,
    contentType,
    ext,
    originalBytes,
    optimizedBytes: buffer.length,
    skipped,
  };
}

function formatMeta(format: string | undefined): {
  ext: string;
  contentType: string;
} {
  if (format === 'png') return { ext: '.png', contentType: 'image/png' };
  if (format === 'webp') return { ext: '.webp', contentType: 'image/webp' };
  return { ext: '.jpg', contentType: 'image/jpeg' };
}

function resolveTargetDimensions(
  maxWidth: number,
  maxHeight: number,
  aspectRatio?: number
): { width: number; height: number } {
  if (!aspectRatio || aspectRatio <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  let width = maxWidth;
  let height = Math.round(width / aspectRatio);
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }
  return { width, height };
}


function shouldSkipOptimization(
  metadata: sharp.Metadata,
  originalSize: number,
  profileConfig: ReturnType<typeof getImageProfile> | null,
  maxWidth: number,
  maxHeight: number
): boolean {
  if (!profileConfig) return false;
  if (profileConfig.resizeFit === 'cover') return false;

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const format = metadata.format;

  const withinDimensions = width > 0 && height > 0 && width <= maxWidth && height <= maxHeight;
  const withinSkipSize = originalSize <= profileConfig.skipOptimizationIfSmallerThan;
  const withinMaxSize = originalSize <= profileConfig.maxSize;
  const matchingFormat = format === profileConfig.format;

  return withinDimensions && withinSkipSize && withinMaxSize && matchingFormat;
}

async function encodeImage(
  buffer: Buffer,
  opts: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'webp' | 'jpeg' | 'png';
    resizeFit?: 'inside' | 'cover';
    aspectRatio?: number;
  }
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  let pipeline = sharp(buffer).rotate();

  if (opts.resizeFit === 'cover' && opts.aspectRatio) {
    const { width, height } = resolveTargetDimensions(
      opts.maxWidth,
      opts.maxHeight,
      opts.aspectRatio
    );
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    });
  } else {
    pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (opts.format === 'webp') {
    const optimizedBuffer = await pipeline
      .webp({
        quality: opts.quality,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();
    return { buffer: optimizedBuffer, contentType: 'image/webp', ext: '.webp' };
  }

  if (opts.format === 'jpeg') {
    const optimizedBuffer = await pipeline
      .jpeg({
        quality: opts.quality,
        mozjpeg: true,
      })
      .toBuffer();
    return { buffer: optimizedBuffer, contentType: 'image/jpeg', ext: '.jpg' };
  }

  const optimizedBuffer = await pipeline
    .png({
      quality: opts.quality,
      compressionLevel: 9,
    })
    .toBuffer();
  return { buffer: optimizedBuffer, contentType: 'image/png', ext: '.png' };
}

async function compressToTargetSize(
  buffer: Buffer,
  opts: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'webp' | 'jpeg' | 'png';
    maxSize: number;
    resizeFit?: 'inside' | 'cover';
    aspectRatio?: number;
  }
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  let quality = opts.quality;
  let width = opts.maxWidth;
  let height = opts.maxHeight;
  let lastResult = await encodeImage(buffer, { ...opts, maxWidth: width, maxHeight: height, quality });

  for (let attempt = 0; attempt < 10 && lastResult.buffer.length > opts.maxSize; attempt++) {
    if (quality > 52) {
      quality -= 8;
    } else {
      if (opts.resizeFit === 'cover' && opts.aspectRatio) {
        const scaled = resolveTargetDimensions(
          Math.max(Math.round(width * 0.88), 640),
          Math.max(Math.round(height * 0.88), 360),
          opts.aspectRatio
        );
        width = scaled.width;
        height = scaled.height;
      } else {
        width = Math.max(Math.round(width * 0.88), 480);
        height = Math.max(Math.round(height * 0.88), 360);
      }
      quality = Math.max(opts.quality - 18, 58);
    }

    lastResult = await encodeImage(buffer, {
      ...opts,
      maxWidth: width,
      maxHeight: height,
      quality,
    });
  }

  return lastResult;
}

/**
 * Optimize image buffer for web delivery
 * - Resize to max dimensions
 * - Convert to WebP for better compression
 * - Enforce profile maxSize with iterative quality/scale reduction
 */
export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeImageOptions = {}
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const result = await optimizeImageDetailed(buffer, options);
  return {
    buffer: result.buffer,
    contentType: result.contentType,
    ext: result.ext,
  };
}

export async function optimizeImageDetailed(
  buffer: Buffer,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResult> {
  const profileConfig = options.profile ? getImageProfile(options.profile) : null;

  const maxWidth = options.maxWidth ?? profileConfig?.maxWidth ?? 1200;
  const maxHeight = options.maxHeight ?? profileConfig?.maxHeight ?? 1200;
  const quality = options.quality ?? profileConfig?.quality ?? 80;
  const format = options.format ?? profileConfig?.format ?? 'webp';
  const maxSize = profileConfig?.maxSize;
  const resizeFit = profileConfig?.resizeFit;
  const aspectRatio = profileConfig?.aspectRatio;
  const originalSize = buffer.length;

  const encodeOpts = {
    maxWidth,
    maxHeight,
    quality,
    format,
    resizeFit,
    aspectRatio,
  };

  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (shouldSkipOptimization(metadata, originalSize, profileConfig, maxWidth, maxHeight)) {
      const { ext, contentType } = formatMeta(metadata.format);
      return buildResult(buffer, contentType, ext, originalSize, true);
    }

    let encoded = await encodeImage(buffer, encodeOpts);

    if (maxSize && encoded.buffer.length > maxSize) {
      encoded = await compressToTargetSize(buffer, {
        ...encodeOpts,
        maxSize,
      });
    }

    return buildResult(encoded.buffer, encoded.contentType, encoded.ext, originalSize);
  } catch (error: unknown) {
    console.error('⚠️ Optimization failed:', (error as Error).message);

    try {
      const fallback = await encodeImage(buffer, {
        maxWidth,
        maxHeight,
        quality: Math.max(quality - 20, 50),
        format: 'webp',
      });
      return buildResult(fallback.buffer, fallback.contentType, fallback.ext, originalSize);
    } catch {
      const metadata = await sharp(buffer).metadata().catch(() => null);
      const { ext, contentType } = formatMeta(metadata?.format);
      return buildResult(buffer, contentType, ext, originalSize, true);
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
