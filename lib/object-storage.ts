import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import { getObjectStorageConfig } from './object-storage-config';
import crypto from 'crypto';
import { optimizeImage } from './image-optimizer';

const isDev = process.env.NODE_ENV === 'development';

/**
 * S3 client برای Liara Object Storage
 */
async function getS3Client() {
  const config = await getObjectStorageConfig();

  if (!config) {
    if (isDev) console.warn('Liara Object Storage not configured');
    return null;
  }

  return new S3Client({
    region: 'default',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * ساخت URL عمومی تصویر در Liara
 */
function buildPublicUrl(
  config: Awaited<ReturnType<typeof getObjectStorageConfig>>,
  key: string
): string {
  if (!config) return '';
  return `${config.endpoint.replace(/\/$/, '')}/${config.bucketName}/${key}`;
}

/**
 * آپلود تصویر از URL به Liara Object Storage
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = 'images'
): Promise<string | null> {
  try {
    const client = await getS3Client();
    const config = await getObjectStorageConfig();

    if (!client || !config) {
      if (isDev) console.warn('Skipping image upload - Liara not configured');
      return null;
    }

    if (isDev) console.log('Downloading image from:', imageUrl);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'WibeCur/1.0' },
    });

    const imageBuffer = Buffer.from(response.data);
    const profile = folder === 'items' ? 'itemImage' : 'default';
    const optimized = await optimizeImage(imageBuffer, { profile });

    const filename = `${crypto.randomBytes(16).toString('hex')}${optimized.ext}`;
    const key = `${folder}/${filename}`;

    if (isDev) console.log('Uploading to Liara:', key);

    const upload = new Upload({
      client,
      params: {
        Bucket: config.bucketName,
        Key: key,
        Body: optimized.buffer,
        ContentType: optimized.contentType,
        ACL: 'public-read',
      },
    });

    await upload.done();

    const publicUrl = buildPublicUrl(config, key);
    if (isDev) console.log('Image uploaded:', publicUrl);

    return publicUrl;
  } catch (error: unknown) {
    console.error('Error uploading image:', (error as Error).message);
    return null;
  }
}

/**
 * آپلود بافر تصویر به Liara Object Storage
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string = 'image/jpeg',
  folder: string = 'images'
): Promise<string | null> {
  try {
    const client = await getS3Client();
    const config = await getObjectStorageConfig();

    if (!client || !config) {
      if (isDev) console.warn('Skipping image upload - Liara not configured');
      return null;
    }

    const profile =
      folder === 'items' ? 'itemImage' :
      folder === 'avatars' ? 'avatar' :
      folder === 'covers' ? 'coverProfile' :
      folder === 'lists' ? 'coverList' :
      folder === 'hubs' ? 'hubCover' :
      'default';

    const optimized = await optimizeImage(buffer, { profile });

    const filename = `${crypto.randomBytes(16).toString('hex')}${optimized.ext}`;
    const key = `${folder}/${filename}`;

    if (isDev) console.log('Uploading to Liara:', key);

    const upload = new Upload({
      client,
      params: {
        Bucket: config.bucketName,
        Key: key,
        Body: optimized.buffer,
        ContentType: optimized.contentType,
        ACL: 'public-read',
      },
    });

    await upload.done();

    return buildPublicUrl(config, key);
  } catch (error: unknown) {
    console.error('Error uploading image:', (error as Error).message);
    return null;
  }
}

/**
 * تست اتصال به Liara Object Storage
 */
export async function testObjectStorageConnection(): Promise<boolean> {
  try {
    const client = await getS3Client();
    return !!client;
  } catch (error) {
    console.error('Liara connection test failed:', error);
    return false;
  }
}

/** @deprecated از testObjectStorageConnection استفاده کن */
export async function testLiaraConnection(): Promise<boolean> {
  return testObjectStorageConnection();
}
