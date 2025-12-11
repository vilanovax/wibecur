import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { uploadImageBuffer } from '@/lib/object-storage';

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

    // Upload to Liara Object Storage
    const url = await uploadImageBuffer(buffer, file.type, 'user-uploads');

    if (!url) {
      return NextResponse.json(
        { error: 'خطا در آپلود فایل به Object Storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}
