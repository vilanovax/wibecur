import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/comments/bad-words - لیست کلمات بد
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badWords = await prisma.bad_words.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get count of filtered comments for each word
    const wordsWithCounts = await Promise.all(
      badWords.map(async (word) => {
        const count = await prisma.comments.count({
          where: {
            isFiltered: true,
            content: {
              contains: word.word,
              mode: 'insensitive',
            },
          },
        });
        return {
          ...word,
          filteredCount: count,
          createdAt: word.createdAt.toISOString(),
          updatedAt: word.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { words: wordsWithCounts },
    });
  } catch (error: any) {
    console.error('Error fetching bad words:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/comments/bad-words - افزودن کلمه بد
export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { word } = body;

    if (!word || !word.trim()) {
      return NextResponse.json(
        { success: false, error: 'کلمه الزامی است' },
        { status: 400 }
      );
    }

    // Check if word already exists
    const existing = await prisma.bad_words.findUnique({
      where: { word: word.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این کلمه قبلاً اضافه شده است' },
        { status: 400 }
      );
    }

    const badWord = await prisma.bad_words.create({
      data: {
        word: word.trim().toLowerCase(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { word: badWord },
    });
  } catch (error: any) {
    console.error('Error creating bad word:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments/bad-words - حذف کلمه بد
export async function DELETE(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.bad_words.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'کلمه با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting bad word:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

