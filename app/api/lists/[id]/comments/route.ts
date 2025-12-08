import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/lists/[id]/comments - دریافت کامنت‌های یک لیست
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'newest'; // newest, popular

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    // Get all bad words for filtering (with try-catch in case table is empty)
    let badWordsList: string[] = [];
    try {
      const badWords = await dbQuery(() =>
        prisma.bad_words.findMany({
          select: { word: true },
        })
      );
      badWordsList = badWords.map((bw) => bw.word.toLowerCase());
    } catch (err) {
      // Table might not exist yet or be empty, continue without filtering
      console.warn('Could not fetch bad words:', err);
    }

    // Check if list exists and comments are enabled
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: {
          id: true,
          commentsEnabled: true,
        },
      })
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Fetch comments (include filtered comments too, but exclude rejected ones and deleted ones)
    const comments = await dbQuery(() =>
      prisma.list_comments.findMany({
        where: {
          listId,
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
        },
        orderBy:
          sort === 'popular'
            ? { likeCount: 'desc' }
            : { createdAt: 'desc' },
      })
    );

    // Get user's likes for this list's comments (only if there are comments)
    const userLikes =
      userId && comments.length > 0
        ? await dbQuery(() =>
            prisma.list_comment_likes.findMany({
              where: {
                userId,
                commentId: {
                  in: comments.map((c) => c.id),
                },
              },
              select: { commentId: true },
            })
          )
        : [];
    const likedCommentIds = new Set(userLikes.map((l) => l.commentId));

    // Filter bad words and mark filtered comments
    const processedComments = comments.map((comment) => {
      let processedContent = comment.content;
      
      if (comment.isFiltered && badWordsList.length > 0) {
        badWordsList.forEach((badWord) => {
          const regex = new RegExp(badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          processedContent = processedContent.replace(regex, '*'.repeat(badWord.length));
        });
      }

      // Check if current user has liked this comment
      const userLiked = userId ? likedCommentIds.has(comment.id) : false;

      return {
        id: comment.id,
        content: processedContent,
        isFiltered: comment.isFiltered,
        likeCount: comment.likeCount || 0,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        deletedAt: comment.deletedAt?.toISOString() || null,
        users: comment.users,
        userLiked,
      };
    });

    return NextResponse.json({
      success: true,
      data: processedComments,
      commentsEnabled: list.commentsEnabled,
    });
  } catch (error: any) {
    console.error('Error fetching list comments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت کامنت‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/lists/[id]/comments - ثبت کامنت جدید برای لیست
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
    const { id: listId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'متن کامنت الزامی است' },
        { status: 400 }
      );
    }

    // Check if list exists and comments are enabled
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: {
          id: true,
          commentsEnabled: true,
        },
      })
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    if (!list.commentsEnabled) {
      return NextResponse.json(
        { success: false, error: 'کامنت‌ها برای این لیست غیرفعال است' },
        { status: 403 }
      );
    }

    // Get global comment settings for max length check
    let globalSettings: any = null;
    try {
      if (prisma.comment_settings) {
        globalSettings = await dbQuery(() =>
          prisma.comment_settings.findFirst()
        );
      }
    } catch (err) {
      console.warn('Could not fetch comment settings:', err);
    }

    // Check max comment length
    const maxCommentLength = globalSettings?.maxCommentLength ?? null;
    if (maxCommentLength !== null && maxCommentLength !== undefined) {
      const contentLength = content.trim().length;
      if (contentLength > maxCommentLength) {
        return NextResponse.json(
          {
            success: false,
            error: `طول کامنت نباید بیشتر از ${maxCommentLength} کاراکتر باشد. (فعلی: ${contentLength})`,
          },
          { status: 400 }
        );
      }
    }

    // Check rate limit
    const rateLimitMinutes =
      globalSettings?.globalRateLimitMinutes ??
      globalSettings?.rateLimitMinutes ??
      5;

    if (rateLimitMinutes > 0) {
      const rateLimitMs = rateLimitMinutes * 60 * 1000;
      const timeLimit = new Date(Date.now() - rateLimitMs);

      // Check if user has commented on this list recently
      const recentListComment = await dbQuery(() =>
        prisma.list_comments.findFirst({
          where: {
            listId,
            userId,
            createdAt: { gte: timeLimit },
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        })
      );

      if (recentListComment) {
        return NextResponse.json(
          {
            success: false,
            error: `لطفاً ${rateLimitMinutes} دقیقه صبر کنید قبل از ارسال کامنت بعدی`,
          },
          { status: 429 }
        );
      }

      // Check global rate limit (if enabled)
      if (globalSettings?.globalRateLimitMinutes) {
        const globalTimeLimit = new Date(
          Date.now() - globalSettings.globalRateLimitMinutes * 60 * 1000
        );
        const recentGlobalComment = await dbQuery(() =>
          prisma.list_comments.findFirst({
            where: {
              userId,
              createdAt: { gte: globalTimeLimit },
              deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
          })
        );

        if (recentGlobalComment) {
          return NextResponse.json(
            {
              success: false,
              error: `لطفاً ${globalSettings.globalRateLimitMinutes} دقیقه صبر کنید قبل از ارسال کامنت بعدی`,
            },
            { status: 429 }
          );
        }
      }
    }

    // Get bad words (with try-catch)
    let badWordsList: string[] = [];
    try {
      const badWords = await dbQuery(() =>
        prisma.bad_words.findMany({
          select: { word: true },
        })
      );
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
        const newComment = await tx.list_comments.create({
          data: {
            listId,
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
          await tx.list_comment_reports.create({
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
                updatedAt: new Date(),
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
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        likeCount: 0,
        userLiked: false,
      },
    });
  } catch (error: any) {
    console.error('Error creating list comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ثبت کامنت' },
      { status: 500 }
    );
  }
}

