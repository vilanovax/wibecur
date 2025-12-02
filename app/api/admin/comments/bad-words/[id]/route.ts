import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// PUT /api/admin/comments/bad-words/[id] - ویرایش کلمه بد
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { word } = body;

    if (!word || !word.trim()) {
      return NextResponse.json(
        { success: false, error: 'کلمه الزامی است' },
        { status: 400 }
      );
    }

    const trimmedWord = word.trim().toLowerCase();

    // Check if word already exists (excluding current word)
    const existing = await dbQuery(() =>
      prisma.bad_words.findFirst({
        where: {
          word: trimmedWord,
          id: { not: id },
        },
      })
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این کلمه قبلاً اضافه شده است' },
        { status: 400 }
      );
    }

    // Update word
    const updatedWord = await dbQuery(() =>
      prisma.bad_words.update({
        where: { id },
        data: {
          word: trimmedWord,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        word: {
          ...updatedWord,
          createdAt: updatedWord.createdAt.toISOString(),
          updatedAt: updatedWord.updatedAt.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Error updating bad word:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

