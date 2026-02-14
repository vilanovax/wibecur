import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { normalizeCommentText, hashCommentContent, validateCommentContent } from '@/lib/comment-utils';
import { checkCommentRateLimit, checkDuplicateComment, shouldShadowBan } from '@/lib/comment-antispan';
import { checkDuplicateSuggestion } from '@/lib/suggestion-utils';

// GET /api/lists/[id]/comments - دریافت کامنت‌های یک لیست
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'newest'; // newest, popular

    const session = await auth();
    const userId = session?.user ? (session.user as { id: string }).id : null;

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

    // Fetch comments: status=active, or hidden+author (show own hidden to author)
    const whereClause = {
      listId,
      parentId: null,
      deletedAt: null,
      OR: [
        { status: 'active' },
        { status: 'review' },
        ...(userId ? [{ status: 'hidden', userId }] : []),
      ],
      NOT: { type: 'suggestion', suggestionStatus: 'rejected' },
    };

    const comments = await dbQuery(() =>
      prisma.list_comments.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              image: true,
              curatorLevel: true,
              avatarType: true,
              avatarId: true,
              avatarStatus: true,
            },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  image: true,
                  curatorLevel: true,
                  avatarType: true,
                  avatarId: true,
                  avatarStatus: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy:
          sort === 'popular' || sort === 'helpful'
            ? [{ weightedScore: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' },
      })
    );

    const allCommentIds = [
      ...comments.map((c) => c.id),
      ...comments.flatMap((c) => c.replies.map((r) => r.id)),
    ];
    const [userLikes, userVotes] = await Promise.all([
      userId && allCommentIds.length > 0
        ? dbQuery(() =>
            prisma.list_comment_likes.findMany({
              where: { userId, commentId: { in: allCommentIds } },
              select: { commentId: true },
            })
          )
        : [],
      userId && allCommentIds.length > 0
        ? dbQuery(() =>
            prisma.list_comment_votes.findMany({
              where: { userId, commentId: { in: allCommentIds } },
              select: { commentId: true, value: true },
            })
          )
        : [],
    ]);
    const likedCommentIds = new Set(userLikes.map((l) => l.commentId));
    const userVoteMap = new Map(userVotes.map((v) => [v.commentId, v.value]));

    const processOne = (c: (typeof comments)[0]) => {
      let processedContent = c.content;
      if (c.isFiltered && badWordsList.length > 0) {
        badWordsList.forEach((badWord) => {
          const regex = new RegExp(badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          processedContent = processedContent.replace(regex, '*'.repeat(badWord.length));
        });
      }
      return {
        id: c.id,
        content: processedContent,
        type: c.type ?? 'comment',
        suggestionStatus: c.suggestionStatus ?? null,
        approvedItemId: c.approvedItemId ?? null,
        status: c.status ?? 'active',
        helpfulUp: c.helpfulUp ?? 0,
        helpfulDown: c.helpfulDown ?? 0,
        weightedScore: c.weightedScore ?? 0,
        isFiltered: c.isFiltered,
        likeCount: c.likeCount || 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        deletedAt: c.deletedAt?.toISOString() || null,
        users: c.users,
        userLiked: userId ? likedCommentIds.has(c.id) : false,
        userVote: userId ? userVoteMap.get(c.id) ?? null : null,
        replies: (c as { replies: (typeof c.replies) & { helpfulUp?: number; helpfulDown?: number; weightedScore?: number }[] }).replies?.map((r) => ({
          id: r.id,
          content: r.content,
          type: r.type ?? 'comment',
          createdAt: r.createdAt.toISOString(),
          users: r.users,
          userLiked: userId ? likedCommentIds.has(r.id) : false,
          likeCount: r.likeCount || 0,
          helpfulUp: r.helpfulUp ?? 0,
          helpfulDown: r.helpfulDown ?? 0,
          userVote: userId ? userVoteMap.get(r.id) ?? null : null,
        })) ?? [],
      };
    };

    const processedComments = comments.map(processOne);

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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const { id: listId } = await params;
    const body = await request.json();
    const { content, type = 'comment', parentId } = body as {
      content?: string;
      type?: 'comment' | 'suggestion' | 'opinion';
      parentId?: string;
    };

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'یه توضیح کوتاه هم بنویس 🙂' },
        { status: 400 }
      );
    }

    const commentType = ['comment', 'suggestion', 'opinion'].includes(type) ? type : 'comment';

    // Content validation: suggestion = فقط عنوان (حداقل ۲ حرف)، بقیه = heuristics کامل
    let validation: { valid: boolean; error?: string; shouldReview?: boolean } = { valid: true };
    if (commentType === 'suggestion') {
      if (content.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'عنوان پیشنهاد خیلی کوتاهه ✨' },
          { status: 400 }
        );
      }
    } else {
      validation = validateCommentContent(content.trim());
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
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

    // For suggestions: check duplicate by normalized title across list (any user)
    if (commentType === 'suggestion') {
      const dup = await checkDuplicateSuggestion(listId, content.trim());
      if (dup.exists) {
        return NextResponse.json({
          success: true,
          alreadySuggested: true,
          suggestionCommentId: dup.suggestionCommentId ?? undefined,
          message: 'این مورد قبلاً پیشنهاد شده 👌',
        });
      }
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
            error: 'این متن کمی بلنده، کوتاه‌تر بنویس ✨',
          },
          { status: 400 }
        );
      }
    }

    // Rate limit: 3/min, 20/day
    const rateResult = await checkCommentRateLimit(userId);
    if (!rateResult.ok) {
      return NextResponse.json(
        { success: false, error: rateResult.message },
        { status: 429 }
      );
    }

    // Duplicate detection (same content within 24h)
    const normalized = normalizeCommentText(content.trim());
    const contentHash = hashCommentContent(normalized);
    const isDuplicate = await checkDuplicateComment(listId, userId, contentHash);
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: 'همین نظر رو قبلاً نوشتی ✨' },
        { status: 400 }
      );
    }

    // Shadow ban: store as hidden for suspicious users
    const shadowBanned = await shouldShadowBan(userId);
    const initialStatus = shadowBanned ? 'hidden' : validation.shouldReview ? 'review' : 'active';

    // Check rate limit (global) - legacy
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
            error: 'چند لحظه بعد دوباره امتحان کن ✨',
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
              error: 'چند لحظه بعد دوباره امتحان کن ✨',
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
            parentId: parentId || null,
            type: commentType,
            content: content.trim(),
            contentHash,
            suggestionStatus: commentType === 'suggestion' ? 'pending' : null,
            status: initialStatus,
            isFiltered: hasBadWord,
            isApproved: !hasBadWord,
            helpfulUp: 0,
            helpfulDown: 0,
            weightedScore: 0.5,
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

    const successMessage =
      commentType === 'suggestion'
        ? 'پیشنهادت ثبت شد 👌 منتظر تایید صاحب لیست هستیم'
        : initialStatus === 'review'
          ? 'نظرت ثبت شد و در حال بررسیه ✨'
          : 'نظرت به لیست اضافه شد ✨';

    return NextResponse.json({
      success: true,
      message: successMessage,
      data: {
        id: comment.id,
        content: comment.content,
        type: commentType,
        suggestionStatus: commentType === 'suggestion' ? 'pending' : null,
        approvedItemId: null,
        status: initialStatus,
        likeCount: 0,
        userLiked: false,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        users: comment.users,
        replies: [],
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

