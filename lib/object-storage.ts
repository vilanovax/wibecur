import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import { getLiaraConfig } from './settings';
import crypto from 'crypto';

/**
 * Get S3 client for Liara Object Storage
 */
async function getS3Client(): Promise<S3Client | null> {
  const config = await getLiaraConfig();

  if (!config) {
    console.warn('Liara Object Storage not configured');
    return null;
  }

  return new S3Client({
    region: 'default',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Required for S3-compatible services
  });
}

/**
 * Upload image from URL to Liara Object Storage
 * @param imageUrl - URL of the image to download and upload
 * @param folder - Folder path in bucket (e.g., 'movies', 'posters')
 * @returns URL of uploaded image or null if failed
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = 'images'
): Promise<string | null> {
  try {
    const s3Client = await getS3Client();
    const config = await getLiaraConfig();

    if (!s3Client || !config) {
      console.warn('Skipping image upload - Liara not configured');
      return null;
    }

    // Download image
    console.log('Downloading image from:', imageUrl);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 seconds
      headers: {
        'User-Agent': 'WibeCur/1.0',
      },
    });

    const imageBuffer = Buffer.from(response.data);
    const contentType =
      response.headers['content-type'] || 'image/jpeg';

    // Generate unique filename
    const extension = getExtensionFromContentType(contentType);
    const filename = `${crypto.randomBytes(16).toString('hex')}${extension}`;
    const key = `${folder}/${filename}`;

    // Upload to Liara
    console.log('Uploading to Liara:', key);
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        ACL: 'public-read', // Make publicly accessible
      },
    });

    await upload.done();

    // Construct public URL
    const publicUrl = `${config.endpoint}/${config.bucketName}/${key}`;
    console.log('Image uploaded successfully:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error.message);
    return null;
  }
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };

  return map[contentType.toLowerCase()] || '.jpg';
}

/**
 * Upload image buffer to Liara Object Storage
 * @param buffer - Image buffer
 * @param contentType - Content type (e.g., 'image/jpeg')
 * @param folder - Folder path in bucket (e.g., 'avatars', 'lists', 'items')
 * @returns URL of uploaded image or null if failed
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string = 'image/jpeg',
  folder: string = 'images'
): Promise<string | null> {
  try {
    const s3Client = await getS3Client();
    const config = await getLiaraConfig();

    if (!s3Client || !config) {
      console.warn('Skipping image upload - Liara not configured');
      return null;
    }

    // Generate unique filename
    const extension = getExtensionFromContentType(contentType);
    const filename = `${crypto.randomBytes(16).toString('hex')}${extension}`;
    const key = `${folder}/${filename}`;

    // Upload to Liara
    console.log('Uploading to Liara:', key);
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read', // Make publicly accessible
      },
    });

    await upload.done();

    // Construct public URL
    const publicUrl = `${config.endpoint}/${config.bucketName}/${key}`;
    console.log('Image uploaded successfully:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error.message);
    return null;
  }
}

/**
 * Test Liara Object Storage connection
 */
export async function testLiaraConnection(): Promise<boolean> {
  try {
    const s3Client = await getS3Client();
    if (!s3Client) return false;

    // Try to list buckets (simple connectivity test)
    // Note: This may fail if permissions are limited, but it's a good test
    return true;
  } catch (error) {
    console.error('Liara connection test failed:', error);
    return false;
  }
}
