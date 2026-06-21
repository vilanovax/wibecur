import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { uploadImageBuffer } from '@/lib/object-storage';
import { validateImage } from '@/lib/image-validator';
import { MAX_RAW_UPLOAD_SIZE } from '@/lib/image-config';
import { resolveUploadTarget } from '@/lib/upload-profiles';
import { getClientErrorMessage, logServerError } from '@/lib/api-error';
import { toNodeBuffer } from '@/lib/to-node-buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

function extFromContentType(contentType: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('svg')) return 'svg';
  if (ct.includes('jpg') || ct.includes('jpeg')) return 'jpg';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'فایلی انتخاب نشده است' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'فقط فایل‌های تصویری مجاز هستند' },
        { status: 400 }
      );
    }

    if (file.size > MAX_RAW_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `حجم فایل نباید بیشتر از ${MAX_RAW_UPLOAD_SIZE / (1024 * 1024)} مگابایت باشد` },
        { status: 400 }
      );
    }

    const buffer = toNodeBuffer(await file.arrayBuffer());

    const purpose = formData.get('purpose') as string | null;
    const { folder, profile } = resolveUploadTarget(purpose, purpose === 'cover' ? 'covers' : 'avatars');

    const validation = await validateImage(buffer, profile);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'تصویر نامعتبر است' },
        { status: 400 }
      );
    }

    // Upload to Liara Object Storage with appropriate profile
    const url = await uploadImageBuffer(buffer, file.type, folder);

    if (!url) {
      // Dev fallback: store locally so editors can work without Liara config.
      if (process.env.NODE_ENV === 'development') {
        const ext = extFromContentType(file.type);
        const fileName = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
        const relDir = path.posix.join('uploads', folder);
        const relPath = path.posix.join(relDir, fileName);
        const absDir = path.join(process.cwd(), 'public', 'uploads', folder);
        const absPath = path.join(absDir, fileName);

        await mkdir(absDir, { recursive: true });
        await writeFile(absPath, buffer);

        return NextResponse.json({ url: `/${relPath}` }, { status: 200 });
      }

      return NextResponse.json({ error: 'خطا در آپلود فایل به Object Storage' }, { status: 500 });
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    logServerError('POST /api/upload', error);
    return NextResponse.json(
      { error: getClientErrorMessage(error, 'خطا در آپلود فایل') },
      { status: 500 }
    );
  }
}
