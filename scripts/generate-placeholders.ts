/**
 * Generate placeholder images and upload to local MinIO
 * Usage: npx tsx scripts/generate-placeholders.ts
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: 'default',
  endpoint: 'http://localhost:9000',
  credentials: {
    accessKeyId: 'wibecur',
    secretAccessKey: 'wibecur_minio_secret',
  },
  forcePathStyle: true,
});

const BUCKET = 'wibe';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#0ea5e9',
];

function pickColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

async function generatePlaceholder(
  width: number,
  height: number,
  color: string,
  label?: string,
): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}"/>
    ${label ? `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="${Math.floor(width / 10)}" opacity="0.6">${label.slice(0, 12)}</text>` : ''}
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toBuffer();
}

async function exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function upload(key: string, buffer: Buffer) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  }));
}

async function main() {
  console.log('Fetching image keys from database...');

  const [items, lists, users] = await Promise.all([
    prisma.items.findMany({
      where: { imageUrl: { contains: 'localhost:9000/wibe/items/' } },
      select: { id: true, imageUrl: true, title: true },
    }),
    prisma.lists.findMany({
      where: { coverImage: { contains: 'localhost:9000/wibe/covers/' } },
      select: { id: true, coverImage: true, title: true },
    }),
    prisma.users.findMany({
      where: { image: { contains: 'localhost:9000/wibe/avatars/' } },
      select: { id: true, image: true, name: true },
    }),
  ]);

  console.log(`Found: ${items.length} items, ${lists.length} lists, ${users.length} users`);

  let uploaded = 0;
  let skipped = 0;

  // Items (400x600 portrait)
  for (const item of items) {
    const match = item.imageUrl?.match(/items\/(.+)$/);
    if (!match) continue;
    const key = `items/${match[1]}`;
    if (await exists(key)) { skipped++; continue; }
    const buf = await generatePlaceholder(400, 600, pickColor(key), item.title ?? '');
    await upload(key, buf);
    uploaded++;
    if (uploaded % 50 === 0) console.log(`  uploaded ${uploaded}...`);
  }

  // Lists (800x400 landscape)
  for (const list of lists) {
    const match = list.coverImage?.match(/covers\/(.+)$/);
    if (!match) continue;
    const key = `covers/${match[1]}`;
    if (await exists(key)) { skipped++; continue; }
    const buf = await generatePlaceholder(800, 400, pickColor(key), list.title ?? '');
    await upload(key, buf);
    uploaded++;
  }

  // Users (200x200 square)
  for (const user of users) {
    const match = user.image?.match(/avatars\/(.+)$/);
    if (!match) continue;
    const key = `avatars/${match[1]}`;
    if (await exists(key)) { skipped++; continue; }
    const buf = await generatePlaceholder(200, 200, pickColor(key), user.name ?? '');
    await upload(key, buf);
    uploaded++;
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped (already exists): ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
