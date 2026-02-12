import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import { getObjectStorageConfig } from './object-storage-config';
import crypto from 'crypto';
import { optimizeImage } from './image-optimizer';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Get S3-compatible client (MinIO or Liara)
 */
async function getS3Client() {
  const config = await getObjectStorageConfig();

  if (!config) {
    if (isDev) console.warn('Object Storage not configured (MinIO or Liara)');
    return null;
  }

  return new S3Client({
    region: 'us-east-1',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // لازم برای MinIO و Liara
  });
}

/**
 * اطمینان از وجود bucket و دسترسی عمومی (برای MinIO)
 */
async function ensureBucket(
  client: S3Client,
  bucketName: string,
  provider: string
) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === 'NotFound' || code === 'NoSuchBucket') {
      await client.send(new CreateBucketCommand({ Bucket: bucketName }));
      if (isDev) console.log('Bucket created:', bucketName);

      // MinIO: دسترسی عمومی برای خواندن تصاویر
      if (provider === 'minio') {
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        });
        await client.send(
          new PutBucketPolicyCommand({ Bucket: bucketName, Policy: policy })
        );
        if (isDev) console.log('Bucket policy set: public read');
      }
    } else throw err;
  }
}

/**
 * ساخت URL عمومی برای دسترسی مرورگر
 */
function buildPublicUrl(
  config: Awaited<ReturnType<typeof getObjectStorageConfig>>,
  key: string
): string {
  if (!config) return '';
  const base = config.publicUrlBase || config.endpoint;
  return `${base.replace(/\/$/, '')}/${config.bucketName}/${key}`;
}

/**
 * Upload image from URL to Object Storage (MinIO یا Liara)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = 'images'
): Promise<string | null> {
  try {
    const client = await getS3Client();
    const config = await getObjectStorageConfig();

    if (!client || !config) {
      if (isDev) console.warn('Skipping image upload - Object Storage not configured');
      return null;
    }

    await ensureBucket(client, config.bucketName, config.provider);

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

    if (isDev) console.log('Uploading to', config.provider, ':', key);

    const uploadParams = {
      Bucket: config.bucketName,
      Key: key,
      Body: optimized.buffer,
      ContentType: optimized.contentType,
      ...(config.provider === 'liara' && { ACL: 'public-read' as const }),
    };

    const upload = new Upload({
      client,
      params: uploadParams,
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
 * Upload image buffer to Object Storage (MinIO یا Liara)
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
      if (isDev) console.warn('Skipping image upload - Object Storage not configured');
      return null;
    }

    await ensureBucket(client, config.bucketName, config.provider);

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

    if (isDev) console.log('Uploading to', config.provider, ':', key);

    const uploadParams = {
      Bucket: config.bucketName,
      Key: key,
      Body: optimized.buffer,
      ContentType: optimized.contentType,
      ...(config.provider === 'liara' && { ACL: 'public-read' as const }),
    };

    const upload = new Upload({
      client,
      params: uploadParams,
    });

    await upload.done();

    return buildPublicUrl(config, key);
  } catch (error: unknown) {
    console.error('Error uploading image:', (error as Error).message);
    return null;
  }
}

/**
 * تست اتصال به Object Storage
 */
export async function testObjectStorageConnection(): Promise<boolean> {
  try {
    const client = await getS3Client();
    return !!client;
  } catch (error) {
    console.error('Object Storage connection test failed:', error);
    return false;
  }
}

/** @deprecated از testObjectStorageConnection استفاده کن */
export async function testLiaraConnection(): Promise<boolean> {
  return testObjectStorageConnection();
}
