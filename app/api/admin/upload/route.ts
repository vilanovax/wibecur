import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { uploadImageBufferDetailed } from '@/lib/object-storage';
import { validateImage } from '@/lib/image-validator';
import { MAX_RAW_UPLOAD_SIZE } from '@/lib/image-config';
import { resolveUploadTarget } from '@/lib/upload-profiles';
import { toNodeBuffer } from '@/lib/to-node-buffer';

// POST /api/admin/upload - Upload image file
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      );
    }

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

    const purpose =
      (formData.get('purpose') as string | null) ??
      new URL(request.url).searchParams.get('purpose');

    const { folder, profile } = resolveUploadTarget(purpose);

    const validation = await validateImage(buffer, profile);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'تصویر نامعتبر است' },
        { status: 400 }
      );
    }

    const uploaded = await uploadImageBufferDetailed(buffer, file.type, folder, profile);

    if (!uploaded?.url) {
      return NextResponse.json(
        { error: 'خطا در آپلود فایل به Object Storage' },
        { status: 500 }
      );
    }

    const { optimization } = uploaded;

    return NextResponse.json(
      {
        url: uploaded.url,
        profile,
        folder,
        optimized: {
          width: optimization.width,
          height: optimization.height,
          bytes: optimization.optimizedBytes,
          originalBytes: optimization.originalBytes,
          format: optimization.ext.replace('.', ''),
          skipped: optimization.skipped,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}
