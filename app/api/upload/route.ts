import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { uploadImageBuffer } from '@/lib/object-storage';
import { validateImage } from '@/lib/image-validator';
import type { ImageProfile } from '@/lib/image-config';
import { getClientErrorMessage, logServerError } from '@/lib/api-error';

function profileForFolder(folder: string): ImageProfile {
  return folder === 'avatars' ? 'avatar' : folder === 'covers' ? 'coverList' : 'default';
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

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const purpose = formData.get('purpose') as string;
    const folder = purpose === 'cover' ? 'covers' : 'avatars';
    const profile = profileForFolder(folder);

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
      return NextResponse.json(
        { error: 'خطا در آپلود فایل به Object Storage' },
        { status: 500 }
      );
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
