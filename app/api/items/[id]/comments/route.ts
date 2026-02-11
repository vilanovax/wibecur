import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getClientErrorMessage, logServerError } from '@/lib/api-error';

// GET /api/items/[id]/comments - دریافت کامنت‌های یک آیتم
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'newest'; // newest, popular

    const session = await auth();
    const userId = session?.user ? session.user.id : null;

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

    // Fetch comments (include filtered comments too, but exclude rejected ones and deleted ones)
    // Show approved comments and filtered comments (which may or may not be approved yet)
    const comments = await dbQuery(() =>
      prisma.comments.findMany({
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
      })
    );

    // Get item with its category to check comments enabled status
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        include: {
          lists: {
            include: {
              categories: true,
            },
          },
        },
      })
    );

    // Get global comment settings
    let globalSettings: Awaited<ReturnType<typeof prisma.comment_settings.findFirst>> = null;
    try {
      globalSettings = await dbQuery(() => prisma.comment_settings.findFirst());
    } catch (err) {
      console.warn('Could not fetch comment settings:', err);
    }

    // Check if comments are enabled
    const category = item?.lists?.categories;
    const categoryCommentsEnabled = category?.commentsEnabled ?? true;
    const itemCommentsEnabled = item?.commentsEnabled ?? globalSettings?.defaultCommentsEnabled ?? true;
    const commentsEnabled = categoryCommentsEnabled && itemCommentsEnabled;

    // Get user's likes for this item's comments (only if there are comments)
    const userLikes =
      userId && comments.length > 0
        ? await dbQuery(() =>
            prisma.comment_likes.findMany({
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
      data: {
        comments: formattedComments,
        commentsEnabled,
      },
    });
  } catch (error) {
    logServerError('GET /api/items/[id]/comments', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در دریافت کامنت‌ها') },
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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: itemId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'متن کامنت الزامی است' },
        { status: 400 }
      );
    }

    // Get global comment settings for max length check
    let globalSettings: Awaited<ReturnType<typeof prisma.comment_settings.findFirst>> = null;
    try {
      globalSettings = await dbQuery(() => prisma.comment_settings.findFirst());
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

    // Check if item exists with its list and category
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        include: {
          lists: {
            include: {
              categories: true,
            },
          },
        },
      })
    );

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    // Check if comments are enabled for the category
    const category = item.lists?.categories;
    if (category && category.commentsEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'کامنت‌ها برای این دسته‌بندی غیرفعال است' },
        { status: 403 }
      );
    }

    // Check if comments are enabled for the item (priority: item > global settings)
    const itemCommentsEnabled = item.commentsEnabled ?? globalSettings?.defaultCommentsEnabled ?? true;
    if (!itemCommentsEnabled) {
      return NextResponse.json(
        { success: false, error: 'کامنت‌ها برای این آیتم غیرفعال است' },
        { status: 403 }
      );
    }

    // Check max comments limit (priority: item > global settings)
    const maxComments = item.maxComments ?? globalSettings?.defaultMaxComments ?? null;
    if (maxComments !== null && maxComments !== undefined) {
      const currentCommentCount = await dbQuery(() =>
        prisma.comments.count({
          where: {
            itemId,
            deletedAt: null, // Only count non-deleted comments
          },
        })
      );

      if (currentCommentCount >= maxComments) {
        return NextResponse.json(
          {
            success: false,
            error: `حداکثر تعداد کامنت (${maxComments}) برای این آیتم تکمیل شده است`,
          },
          { status: 403 }
        );
      }
    }

    // Check rate limit
    // Priority: global rate limit > item-specific rate limit > default (5 minutes)
    const rateLimitMinutes =
      globalSettings?.globalRateLimitMinutes ??
      globalSettings?.rateLimitMinutes ??
      5;

    if (rateLimitMinutes > 0) {
      const rateLimitMs = rateLimitMinutes * 60 * 1000;
      const timeLimit = new Date(Date.now() - rateLimitMs);

      // Check if user has commented on this specific item recently
      const recentItemComment = await dbQuery(() =>
        prisma.comments.findFirst({
          where: {
            itemId,
            userId,
            createdAt: { gte: timeLimit },
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        })
      );

      if (recentItemComment) {
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
          prisma.comments.findFirst({
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

        // Track user violation (find by userId + violationType for correct record)
        const existingViolation = await tx.user_violations.findFirst({
          where: { userId, violationType: 'bad_word' },
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
  } catch (error) {
    logServerError('POST /api/items/[id]/comments', error);
    return NextResponse.json(
      {
        success: false,
        error: getClientErrorMessage(error, 'خطا در ثبت کامنت'),
        ...(process.env.NODE_ENV === 'development' && error instanceof Error && { details: error.stack }),
      },
      { status: 500 }
    );
  }
}

