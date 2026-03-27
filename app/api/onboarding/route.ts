import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/onboarding — دریافت کتگوری‌ها و تگ‌ها برای آنبوردینگ
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [categories, tags] = await Promise.all([
      dbQuery(() =>
        prisma.categories.findMany({
          where: { isActive: true },
          select: { id: true, name: true, slug: true, icon: true, color: true },
          orderBy: { order: 'asc' },
        })
      ),
      dbQuery(() =>
        prisma.category_tags.findMany({
          where: { isActive: true },
          select: { id: true, categoryId: true, name: true, slug: true, icon: true },
          orderBy: { order: 'asc' },
        })
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: { categories, tags },
    });
  } catch (error: any) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding — ذخیره علاقه‌مندی‌های کاربر
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { categoryIds, tagIds } = body as {
      categoryIds?: string[];
      tagIds?: string[];
    };

    if (!categoryIds || categoryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'حداقل یک دسته‌بندی انتخاب کنید' },
        { status: 400 }
      );
    }

    await dbQuery(async () => {
      await prisma.$transaction(async (tx) => {
        // Clear previous onboarding interests
        await tx.user_interests.deleteMany({
          where: { userId, source: 'onboarding' },
        });

        // Insert category interests
        const categoryRecords = categoryIds.map((categoryId: string) => ({
          userId,
          categoryId,
          tagId: null,
          source: 'onboarding',
        }));

        // Insert tag interests
        const tagRecords = (tagIds ?? []).map((tagId: string) => ({
          userId,
          categoryId: null,
          tagId,
          source: 'onboarding',
        }));

        await tx.user_interests.createMany({
          data: [...categoryRecords, ...tagRecords],
        });

        // Mark onboarding as completed
        await tx.users.update({
          where: { id: userId },
          data: { onboardingCompleted: true },
        });
      });
    });

    return NextResponse.json({
      success: true,
      message: 'سلیقه‌هات ذخیره شد!',
    });
  } catch (error: any) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره اطلاعات' },
      { status: 500 }
    );
  }
}
