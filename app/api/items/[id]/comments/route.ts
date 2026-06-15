import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId, sessionUserNotFoundResponse } from '@/lib/api-db';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getClientErrorMessage, logServerError } from '@/lib/api-error';
import { getCachedBadWords } from '@/lib/bad-words';
import {
  getCommentPermission,
  recordBadWordViolation,
  applyAutoRestrictionAfterPenalty,
  getUserPenaltyScore,
} from '@/lib/comment-permission';
import { DEFAULT_LIST_COMMENT_MAX_LENGTH } from '@/lib/comment-limits';

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
    const userId = session?.user ? await resolveSessionUserId(session) : null;

    // موازی‌سازی کوئری‌های مستقل
    const [badWordsList, comments, item, globalSettings] = await Promise.all([
      getCachedBadWords(),
      dbQuery(() =>
        prisma.comments.findMany({
          where: {
            itemId,
            deletedAt: null,
            OR: [
              { isApproved: true },
              { isFiltered: true },
            ],
          },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                image: true,
                avatarType: true,
                avatarId: true,
                avatarStatus: true,
                curatorLevel: true,
              },
            },
            _count: { select: { comment_likes: true } },
          },
          orderBy:
            sort === 'popular'
              ? [{ weightedScore: 'desc' }, { helpfulUp: 'desc' }, { createdAt: 'desc' }]
              : { createdAt: 'desc' },
        })
      ),
      dbQuery(() =>
        prisma.items.findUnique({
          where: { id: itemId },
          include: {
            lists: { include: { categories: true } },
          },
        })
      ),
      dbQuery(() => prisma.comment_settings.findFirst()).catch(() => null),
    ]);

    // Check if comments are enabled
    const category = item?.lists?.categories;
    const categoryCommentsEnabled = category?.commentsEnabled ?? true;
    const itemCommentsEnabled = item?.commentsEnabled ?? globalSettings?.defaultCommentsEnabled ?? true;
    const commentsEnabled = categoryCommentsEnabled && itemCommentsEnabled;

    const [userLikes, userVotes] = await Promise.all([
      userId && comments.length > 0
        ? dbQuery(() =>
            prisma.comment_likes.findMany({
              where: {
                userId,
                commentId: { in: comments.map((c) => c.id) },
              },
              select: { commentId: true },
            })
          )
        : Promise.resolve([]),
      userId && comments.length > 0
        ? dbQuery(() =>
            prisma.comment_votes.findMany({
              where: {
                userId,
                commentId: { in: comments.map((c) => c.id) },
              },
              select: { commentId: true, value: true },
            })
          )
        : Promise.resolve([]),
    ]);
    const likedCommentIds = new Set(userLikes.map((l) => l.commentId));
    const userVoteByCommentId = new Map(userVotes.map((v) => [v.commentId, v.value]));

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

      const legacyUp = comment.likeCount > comment.helpfulUp ? comment.likeCount : 0;
      const helpfulUp = comment.helpfulUp > 0 ? comment.helpfulUp : legacyUp;
      let userVote: number | null = userVoteByCommentId.get(comment.id) ?? null;
      if (userVote == null && likedCommentIds.has(comment.id)) {
        userVote = 1;
      }

      return {
        id: comment.id,
        content: displayContent,
        isFiltered: comment.isFiltered,
        likeCount: comment.likeCount,
        helpfulUp,
        helpfulDown: comment.helpfulDown,
        userVote,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          id: comment.users.id,
          name: comment.users.name || 'کاربر ناشناس',
          email: comment.users.email,
          username: comment.users.username ?? null,
          image: comment.users.image,
          avatarType: comment.users.avatarType ?? 'DEFAULT',
          avatarId: comment.users.avatarId ?? null,
          avatarStatus: comment.users.avatarStatus ?? null,
          curatorLevel: comment.users.curatorLevel ?? null,
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
        maxCommentLength: globalSettings?.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH,
      },
    });
  } catch (error) {
    logServerError('GET /api/items/[id]/comments', error);
    // Return safe empty data so CommentSection does not break (e.g. missing tables/columns)
    return NextResponse.json({
      success: true,
      data: { comments: [], commentsEnabled: true },
    });
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

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return sessionUserNotFoundResponse();
    }
    const { id: itemId } = await params;

    const commentPermission = await getCommentPermission(userId);
    if (!commentPermission.allowed) {
      return NextResponse.json(
        { success: false, error: commentPermission.reason || 'امکان ثبت کامنت وجود ندارد' },
        { status: 403 }
      );
    }

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

    // Check rate limit (غیرفعال در development — مثل کامنت لیست)
    const rateLimitMinutes =
      globalSettings?.globalRateLimitMinutes ??
      globalSettings?.rateLimitMinutes ??
      5;

    if (process.env.NODE_ENV !== 'development' && rateLimitMinutes > 0) {
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
        const elapsedMs = Date.now() - recentItemComment.createdAt.getTime();
        const retryAfterSeconds = Math.max(1, Math.ceil((rateLimitMs - elapsedMs) / 1000));
        return NextResponse.json(
          {
            success: false,
            error: `لطفاً ${rateLimitMinutes} دقیقه صبر کنید قبل از ارسال کامنت بعدی`,
            retryAfterSeconds,
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
          const globalLimitMs = globalSettings.globalRateLimitMinutes * 60 * 1000;
          const elapsedMs = Date.now() - recentGlobalComment.createdAt.getTime();
          const retryAfterSeconds = Math.max(1, Math.ceil((globalLimitMs - elapsedMs) / 1000));
          return NextResponse.json(
            {
              success: false,
              error: `لطفاً ${globalSettings.globalRateLimitMinutes} دقیقه صبر کنید قبل از ارسال کامنت بعدی`,
              retryAfterSeconds,
            },
            { status: 429 }
          );
        }
      }
    }

    const badWordsList = await getCachedBadWords();

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
        await tx.comment_reports.create({
          data: {
            commentId: newComment.id,
            userId: userId,
            reason: 'کلمه نامناسب',
          },
        });

        await recordBadWordViolation(userId, newComment.id, tx, {
          skipAutoRestrict: true,
        });
      }

        return newComment;
      });
    });

    if (hasBadWord) {
      const totalScore = await getUserPenaltyScore(userId);
      await applyAutoRestrictionAfterPenalty(userId, totalScore);
    }

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

