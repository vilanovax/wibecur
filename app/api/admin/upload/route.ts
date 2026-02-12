import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { uploadImageBuffer } from '@/lib/object-storage';
import { validateImage } from '@/lib/image-validator';
import type { ImageProfile } from '@/lib/image-config';

function profileForFolder(folder: string): ImageProfile {
  return folder === 'avatars' ? 'avatar' : folder === 'lists' ? 'coverList' : 'default';
}

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'فقط فایل‌های تصویری مجاز هستند' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const purpose = formData.get('purpose') as string ||
                   new URL(request.url).searchParams.get('purpose');
    let folder = 'uploads';
    if (purpose === 'list-cover' || purpose === 'cover') {
      folder = 'lists';
    } else if (purpose === 'avatar') {
      folder = 'avatars';
    }
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

    return NextResponse.json({ url }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}
