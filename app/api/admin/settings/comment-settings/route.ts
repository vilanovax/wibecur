import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/admin/settings/comment-settings - دریافت تنظیمات سراسری کامنت
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create settings (singleton)
    const settings = await dbQuery(async () => {
      let existingSettings = await prisma.comment_settings.findFirst();
      
      if (!existingSettings) {
        // Create default settings
        existingSettings = await prisma.comment_settings.create({
          data: {
            defaultMaxComments: null,
            defaultCommentsEnabled: true,
            rateLimitMinutes: 5,
            globalRateLimitMinutes: null,
          },
        });
      }
      
      return existingSettings;
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching comment settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/comment-settings - به‌روزرسانی تنظیمات سراسری کامنت
export async function PUT(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      defaultMaxComments,
      defaultCommentsEnabled,
      rateLimitMinutes,
      globalRateLimitMinutes,
    } = body;

    // Validate
    if (defaultMaxComments !== null && defaultMaxComments !== undefined && defaultMaxComments < 1) {
      return NextResponse.json(
        { success: false, error: 'حداکثر تعداد کامنت باید بیشتر از 0 باشد' },
        { status: 400 }
      );
    }

    if (rateLimitMinutes !== undefined && rateLimitMinutes < 1) {
      return NextResponse.json(
        { success: false, error: 'حداقل فاصله زمانی باید بیشتر از 0 باشد' },
        { status: 400 }
      );
    }

    if (globalRateLimitMinutes !== null && globalRateLimitMinutes !== undefined && globalRateLimitMinutes < 1) {
      return NextResponse.json(
        { success: false, error: 'حداقل فاصله زمانی سراسری باید بیشتر از 0 باشد' },
        { status: 400 }
      );
    }

    // Update or create settings (singleton)
    const settings = await dbQuery(async () => {
      const existingSettings = await prisma.comment_settings.findFirst();
      
      if (existingSettings) {
        return await prisma.comment_settings.update({
          where: { id: existingSettings.id },
          data: {
            defaultMaxComments: defaultMaxComments !== undefined ? defaultMaxComments : null,
            defaultCommentsEnabled: defaultCommentsEnabled !== undefined ? defaultCommentsEnabled : true,
            rateLimitMinutes: rateLimitMinutes !== undefined ? rateLimitMinutes : 5,
            globalRateLimitMinutes: globalRateLimitMinutes !== undefined ? globalRateLimitMinutes : null,
          },
        });
      } else {
        return await prisma.comment_settings.create({
          data: {
            defaultMaxComments: defaultMaxComments !== undefined ? defaultMaxComments : null,
            defaultCommentsEnabled: defaultCommentsEnabled !== undefined ? defaultCommentsEnabled : true,
            rateLimitMinutes: rateLimitMinutes !== undefined ? rateLimitMinutes : 5,
            globalRateLimitMinutes: globalRateLimitMinutes !== undefined ? globalRateLimitMinutes : null,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'تنظیمات با موفقیت ذخیره شد',
    });
  } catch (error: any) {
    console.error('Error updating comment settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

