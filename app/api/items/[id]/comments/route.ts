import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/items/[id]/comments - دریافت کامنت‌های یک آیتم
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'newest'; // newest, popular

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    // Get all bad words for filtering (with try-catch in case table is empty)
    let badWordsList: string[] = [];
    try {
      const badWords = await prisma.bad_words.findMany({
        select: { word: true },
      });
      badWordsList = badWords.map((bw) => bw.word.toLowerCase());
    } catch (err) {
      // Table might not exist yet or be empty, continue without filtering
      console.warn('Could not fetch bad words:', err);
    }

    // Fetch comments (include filtered comments too, but exclude rejected ones and deleted ones)
    // Show approved comments and filtered comments (which may or may not be approved yet)
    const comments = await prisma.comments.findMany({
      where: {
        itemId,
        deletedAt: null, // Exclude soft-deleted comments
        OR: [
          { isApproved: true }, // Show approved comments
          { isFiltered: true }, // Show filtered comments (even if not approved yet)
        ],
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            comment_likes: true,
          },
        },
      },
      orderBy:
        sort === 'popular'
          ? { likeCount: 'desc' }
          : { createdAt: 'desc' },
    });

    // Get user's likes for this item's comments (only if there are comments)
    const userLikes =
      userId && comments.length > 0
        ? await prisma.comment_likes.findMany({
            where: {
              userId,
              commentId: {
                in: comments.map((c) => c.id),
              },
            },
            select: { commentId: true },
          })
        : [];
    const likedCommentIds = new Set(userLikes.map((l) => l.commentId));

    // Format comments
    const formattedComments = comments.map((comment) => {
      // Filter bad words from content if isFiltered
      let displayContent = comment.content;
      if (comment.isFiltered && badWordsList.length > 0) {
        badWordsList.forEach((word) => {
          // Escape special regex characters
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Create regex for case-insensitive matching
          const regex = new RegExp(escapedWord, 'gi');
          // Replace with asterisks equal to word length
          displayContent = displayContent.replace(regex, '*'.repeat(word.length));
        });
      }

      return {
        id: comment.id,
        content: displayContent,
        isFiltered: comment.isFiltered,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          id: comment.users.id,
          name: comment.users.name || 'کاربر ناشناس',
          email: comment.users.email,
          image: comment.users.image,
        },
        isLiked: likedCommentIds.has(comment.id),
        canDelete: userId === comment.userId, // User can delete their own comments
      };
    });

    return NextResponse.json({
      success: true,
      data: { comments: formattedComments },
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/items/[id]/comments - ثبت کامنت جدید
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { id: itemId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'متن کامنت الزامی است' },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.items.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    // Get bad words (with try-catch)
    let badWordsList: string[] = [];
    try {
      const badWords = await prisma.bad_words.findMany({
        select: { word: true },
      });
      badWordsList = badWords.map((bw) => bw.word.toLowerCase());
    } catch (err) {
      console.warn('Could not fetch bad words:', err);
    }

    // Check for bad words
    const contentLower = content.toLowerCase();
    const hasBadWord = badWordsList.some((word) =>
      contentLower.includes(word)
    );

    // Create comment
    const comment = await dbQuery(async () => {
      return await prisma.$transaction(async (tx) => {
        const newComment = await tx.comments.create({
        data: {
          itemId,
          userId,
          content: content.trim(),
          isFiltered: hasBadWord,
          isApproved: !hasBadWord, // Auto-approve if no bad words
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // If bad word found, report automatically and track violation
      if (hasBadWord) {
        // Auto-report to admin
        await tx.comment_reports.create({
          data: {
            commentId: newComment.id,
            userId: userId,
            reason: 'کلمه نامناسب',
          },
        });

        // Track user violation
        const existingViolation = await tx.user_violations.findFirst({
          where: { userId },
        });

        if (existingViolation) {
          await tx.user_violations.update({
            where: { id: existingViolation.id },
            data: {
              violationCount: { increment: 1 },
              lastViolationDate: new Date(),
            },
          });
        } else {
          await tx.user_violations.create({
            data: {
              userId,
              commentId: newComment.id,
              violationType: 'bad_word',
              violationCount: 1,
            },
          });
        }
      }

        return newComment;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        comment: {
          id: comment.id,
          content: comment.isFiltered
            ? comment.content.replace(
                new RegExp(badWordsList.join('|'), 'gi'),
                '*****'
              )
            : comment.content,
          isFiltered: comment.isFiltered,
          likeCount: 0,
          createdAt: comment.createdAt.toISOString(),
          user: {
            id: comment.users.id,
            name: comment.users.name || 'کاربر ناشناس',
            email: comment.users.email,
            image: comment.users.image,
          },
          isLiked: false,
          canDelete: true,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

