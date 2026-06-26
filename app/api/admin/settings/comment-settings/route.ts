import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveCommentAiProvider } from '@/lib/comment-ai-provider';
import {
  invalidatePenaltyThresholdsCache,
  DEFAULT_PENALTY_THRESHOLDS,
} from '@/lib/comment-permission';

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
        existingSettings = await prisma.comment_settings.create({
          data: {
            defaultMaxComments: null,
            defaultCommentsEnabled: true,
            maxCommentLength: null,
            rateLimitMinutes: 5,
            globalRateLimitMinutes: null,
            penaltyWarnThreshold: DEFAULT_PENALTY_THRESHOLDS.warn,
            penaltyRestrictThreshold: DEFAULT_PENALTY_THRESHOLDS.restrict,
            penaltyBanThreshold: DEFAULT_PENALTY_THRESHOLDS.ban,
            penaltyRestrictDays: DEFAULT_PENALTY_THRESHOLDS.restrictDays,
            commentAiProvider: 'openai',
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

function validatePenaltyThresholds(body: {
  penaltyWarnThreshold?: number;
  penaltyRestrictThreshold?: number;
  penaltyBanThreshold?: number;
  penaltyRestrictDays?: number;
}): string | null {
  const {
    penaltyWarnThreshold: warn,
    penaltyRestrictThreshold: restrict,
    penaltyBanThreshold: ban,
    penaltyRestrictDays: days,
  } = body;

  if (
    warn !== undefined &&
    (typeof warn !== 'number' || warn < 1 || !Number.isInteger(warn))
  ) {
    return 'آستانه اخطار باید عدد صحیح مثبت باشد';
  }
  if (
    restrict !== undefined &&
    (typeof restrict !== 'number' || restrict < 1 || !Number.isInteger(restrict))
  ) {
    return 'آستانه محدودیت باید عدد صحیح مثبت باشد';
  }
  if (
    ban !== undefined &&
    (typeof ban !== 'number' || ban < 1 || !Number.isInteger(ban))
  ) {
    return 'آستانه مسدودسازی باید عدد صحیح مثبت باشد';
  }
  if (
    days !== undefined &&
    (typeof days !== 'number' || days < 1 || !Number.isInteger(days))
  ) {
    return 'مدت محدودیت باید حداقل ۱ روز باشد';
  }

  const w = warn ?? DEFAULT_PENALTY_THRESHOLDS.warn;
  const r = restrict ?? DEFAULT_PENALTY_THRESHOLDS.restrict;
  const b = ban ?? DEFAULT_PENALTY_THRESHOLDS.ban;

  if (w >= r || r >= b) {
    return 'آستانه‌ها باید به ترتیب افزایشی باشند: اخطار < محدودیت < مسدود';
  }

  return null;
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
      penaltyWarnThreshold,
      penaltyRestrictThreshold,
      penaltyBanThreshold,
      penaltyRestrictDays,
      commentAiProvider,
    } = body;

    const penaltyError = validatePenaltyThresholds(body);
    if (penaltyError) {
      return NextResponse.json({ success: false, error: penaltyError }, { status: 400 });
    }

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

    const updateData = {
      defaultMaxComments: defaultMaxComments !== undefined ? defaultMaxComments : null,
      defaultCommentsEnabled: defaultCommentsEnabled !== undefined ? defaultCommentsEnabled : true,
      maxCommentLength: maxCommentLength !== undefined ? maxCommentLength : null,
      rateLimitMinutes: rateLimitMinutes !== undefined ? rateLimitMinutes : 5,
      globalRateLimitMinutes: globalRateLimitMinutes !== undefined ? globalRateLimitMinutes : null,
      ...(penaltyWarnThreshold !== undefined && { penaltyWarnThreshold }),
      ...(penaltyRestrictThreshold !== undefined && { penaltyRestrictThreshold }),
      ...(penaltyBanThreshold !== undefined && { penaltyBanThreshold }),
      ...(penaltyRestrictDays !== undefined && { penaltyRestrictDays }),
      ...(commentAiProvider !== undefined && {
        commentAiProvider: resolveCommentAiProvider(commentAiProvider),
      }),
    };

    // Update or create settings (singleton)
    const settings = await dbQuery(async () => {
      const existingSettings = await prisma.comment_settings.findFirst();

      if (existingSettings) {
        return await prisma.comment_settings.update({
          where: { id: existingSettings.id },
          data: updateData,
        });
      }

      return await prisma.comment_settings.create({
        data: {
          ...updateData,
          penaltyWarnThreshold:
            penaltyWarnThreshold ?? DEFAULT_PENALTY_THRESHOLDS.warn,
          penaltyRestrictThreshold:
            penaltyRestrictThreshold ?? DEFAULT_PENALTY_THRESHOLDS.restrict,
          penaltyBanThreshold:
            penaltyBanThreshold ?? DEFAULT_PENALTY_THRESHOLDS.ban,
          penaltyRestrictDays:
            penaltyRestrictDays ?? DEFAULT_PENALTY_THRESHOLDS.restrictDays,
          commentAiProvider: resolveCommentAiProvider(commentAiProvider),
        },
      });
    });

    invalidatePenaltyThresholdsCache();

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
