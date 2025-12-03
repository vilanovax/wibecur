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
      try {
        // Check if comment_settings model exists
        if (!prisma.comment_settings) {
          console.error('❌ prisma.comment_settings is undefined');
          throw new Error('مدل comment_settings در Prisma Client موجود نیست. لطفاً Prisma Client را generate کنید.');
        }

        let existingSettings = await prisma.comment_settings.findFirst();
        
        if (!existingSettings) {
          // Create default settings
          console.log('📝 Creating default comment_settings...');
          existingSettings = await prisma.comment_settings.create({
            data: {
              defaultMaxComments: null,
              defaultCommentsEnabled: true,
              maxCommentLength: null,
              rateLimitMinutes: 5,
              globalRateLimitMinutes: null,
            },
          });
          console.log('✅ Default comment_settings created:', existingSettings.id);
        }
        
        return existingSettings;
      } catch (error: any) {
        console.error('❌ Error in dbQuery for comment_settings:', error);
        throw error;
      }
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
      maxCommentLength,
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

    if (maxCommentLength !== null && maxCommentLength !== undefined && maxCommentLength < 1) {
      return NextResponse.json(
        { success: false, error: 'حداکثر تعداد کاراکتر باید بیشتر از 0 باشد' },
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
      try {
        // Check if comment_settings model exists
        if (!prisma.comment_settings) {
          console.error('❌ prisma.comment_settings is undefined');
          throw new Error('مدل comment_settings در Prisma Client موجود نیست. لطفاً Prisma Client را generate کنید.');
        }

        const existingSettings = await prisma.comment_settings.findFirst();
      
      if (existingSettings) {
        console.log('📝 Updating existing comment_settings:', existingSettings.id);
        return await prisma.comment_settings.update({
          where: { id: existingSettings.id },
          data: {
            defaultMaxComments: defaultMaxComments !== undefined ? defaultMaxComments : null,
            defaultCommentsEnabled: defaultCommentsEnabled !== undefined ? defaultCommentsEnabled : true,
            maxCommentLength: maxCommentLength !== undefined ? maxCommentLength : null,
            rateLimitMinutes: rateLimitMinutes !== undefined ? rateLimitMinutes : 5,
            globalRateLimitMinutes: globalRateLimitMinutes !== undefined ? globalRateLimitMinutes : null,
          },
        });
      } else {
        console.log('📝 Creating new comment_settings...');
        return await prisma.comment_settings.create({
          data: {
            defaultMaxComments: defaultMaxComments !== undefined ? defaultMaxComments : null,
            defaultCommentsEnabled: defaultCommentsEnabled !== undefined ? defaultCommentsEnabled : true,
            maxCommentLength: maxCommentLength !== undefined ? maxCommentLength : null,
            rateLimitMinutes: rateLimitMinutes !== undefined ? rateLimitMinutes : 5,
            globalRateLimitMinutes: globalRateLimitMinutes !== undefined ? globalRateLimitMinutes : null,
          },
        });
      }
      } catch (error: any) {
        console.error('❌ Error in dbQuery for comment_settings PUT:', error);
        throw error;
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

