import sharp, { type Metadata, type Sharp } from 'sharp';
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
  width?: number;
  height?: number;
}

function buildResult(
  buffer: Buffer,
  contentType: string,
  ext: string,
  originalBytes: number,
  skipped = false,
  dimensions?: { width?: number; height?: number }
): OptimizeImageResult {
  return {
    buffer,
    contentType,
    ext,
    originalBytes,
    optimizedBytes: buffer.length,
    skipped,
    width: dimensions?.width,
    height: dimensions?.height,
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
  metadata: Metadata,
  originalSize: number,
  profileConfig: ReturnType<typeof getImageProfile> | null,
  maxWidth: number,
  maxHeight: number
): boolean {
  if (!profileConfig) return false;
  if (profileConfig.forceOptimize) return false;
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

async function preparePipeline(
  buffer: Buffer,
  profileConfig: ReturnType<typeof getImageProfile> | null
): Promise<Sharp> {
  let pipeline = sharp(buffer).rotate();

  if (profileConfig?.trimTransparent) {
    try {
      pipeline = pipeline.trim({ threshold: 10 });
    } catch {
      /* trim optional */
    }
  }

  if (profileConfig?.preserveAlpha) {
    pipeline = pipeline.ensureAlpha();
  }

  return pipeline;
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
    preserveAlpha?: boolean;
    trimTransparent?: boolean;
  },
  profileConfig: ReturnType<typeof getImageProfile> | null
): Promise<{ buffer: Buffer; contentType: string; ext: string; width?: number; height?: number }> {
  let pipeline = await preparePipeline(buffer, profileConfig);

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

  let optimizedBuffer: Buffer;
  if (opts.format === 'webp') {
    optimizedBuffer = await pipeline
      .webp({
        quality: opts.quality,
        effort: 6,
        smartSubsample: true,
        alphaQuality: opts.preserveAlpha ? 90 : undefined,
      })
      .toBuffer();
  } else if (opts.format === 'jpeg') {
    optimizedBuffer = await pipeline
      .jpeg({
        quality: opts.quality,
        mozjpeg: true,
      })
      .toBuffer();
  } else {
    optimizedBuffer = await pipeline
      .png({
        quality: opts.quality,
        compressionLevel: 9,
      })
      .toBuffer();
  }

  const meta = await sharp(optimizedBuffer).metadata();
  const { contentType, ext } = formatMeta(opts.format);
  return {
    buffer: optimizedBuffer,
    contentType,
    ext,
    width: meta.width,
    height: meta.height,
  };
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
    preserveAlpha?: boolean;
    trimTransparent?: boolean;
  },
  profileConfig: ReturnType<typeof getImageProfile> | null
): Promise<{ buffer: Buffer; contentType: string; ext: string; width?: number; height?: number }> {
  let quality = opts.quality;
  let width = opts.maxWidth;
  let height = opts.maxHeight;
  const minWidth = Math.max(Math.round(opts.maxWidth * 0.45), 120);
  const minHeight = Math.max(Math.round(opts.maxHeight * 0.45), 32);

  let lastResult = await encodeImage(
    buffer,
    { ...opts, maxWidth: width, maxHeight: height, quality },
    profileConfig
  );

  for (let attempt = 0; attempt < 12 && lastResult.buffer.length > opts.maxSize; attempt++) {
    if (quality > 48) {
      quality -= 8;
    } else if (opts.resizeFit === 'cover' && opts.aspectRatio) {
      const scaled = resolveTargetDimensions(
        Math.max(Math.round(width * 0.88), minWidth),
        Math.max(Math.round(height * 0.88), minHeight),
        opts.aspectRatio
      );
      width = scaled.width;
      height = scaled.height;
      quality = Math.max(opts.quality - 18, 52);
    } else {
      width = Math.max(Math.round(width * 0.88), minWidth);
      height = Math.max(Math.round(height * 0.88), minHeight);
      quality = Math.max(opts.quality - 18, 52);
    }

    lastResult = await encodeImage(
      buffer,
      { ...opts, maxWidth: width, maxHeight: height, quality },
      profileConfig
    );
  }

  return lastResult;
}

/**
 * Optimize image buffer for web delivery
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
  const preserveAlpha = profileConfig?.preserveAlpha;
  const trimTransparent = profileConfig?.trimTransparent;
  const originalSize = buffer.length;

  const encodeOpts = {
    maxWidth,
    maxHeight,
    quality,
    format,
    resizeFit,
    aspectRatio,
    preserveAlpha,
    trimTransparent,
  };

  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (shouldSkipOptimization(metadata, originalSize, profileConfig, maxWidth, maxHeight)) {
      const { ext, contentType } = formatMeta(metadata.format);
      return buildResult(
        buffer,
        contentType,
        ext,
        originalSize,
        true,
        { width, height }
      );
    }

    let encoded = await encodeImage(buffer, encodeOpts, profileConfig);

    if (maxSize && encoded.buffer.length > maxSize) {
      encoded = await compressToTargetSize(
        buffer,
        { ...encodeOpts, maxSize },
        profileConfig
      );
    }

    return buildResult(
      encoded.buffer,
      encoded.contentType,
      encoded.ext,
      originalSize,
      false,
      { width: encoded.width, height: encoded.height }
    );
  } catch (error: unknown) {
    console.error('⚠️ Optimization failed:', (error as Error).message);

    try {
      const fallback = await encodeImage(
        buffer,
        {
          maxWidth,
          maxHeight,
          quality: Math.max(quality - 20, 50),
          format: 'webp',
          preserveAlpha,
          trimTransparent,
        },
        profileConfig
      );
      return buildResult(
        fallback.buffer,
        fallback.contentType,
        fallback.ext,
        originalSize,
        false,
        { width: fallback.width, height: fallback.height }
      );
    } catch {
      const metadata = await sharp(buffer).metadata().catch(() => null);
      const { ext, contentType } = formatMeta(metadata?.format);
      return buildResult(buffer, contentType, ext, originalSize, true, {
        width: metadata?.width,
        height: metadata?.height,
      });
    }
  }
}

export async function detectImageType(buffer: Buffer): Promise<string | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.format || null;
  } catch {
    return null;
  }
}
