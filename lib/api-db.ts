import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { prisma } from './prisma';
import { dbQuery } from './db';
import { shouldGracefulDbFallback } from './db-errors';

/** پاسخ 200 با دادهٔ fallback وقتی DB تحت فشار است */
export function apiDbOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

/** پاسخ خطا — 503 برای DB down، 500 برای بقیه */
export function apiDbFail(
  error: unknown,
  message = 'خطا در اتصال به سرور',
  logLabel?: string
) {
  const err = error as Error;
  if (logLabel) {
    console.error(`${logLabel}:`, err?.message ?? error);
  }
  const status = shouldGracefulDbFallback(error) ? 503 : 500;
  return NextResponse.json(
    { success: false, error: err?.message ?? message },
    { status }
  );
}

/** اگر DB در دسترس نیست fallback برگردان، وگرنه null */
export function tryApiDbFallback<T>(
  error: unknown,
  data: T,
  logLabel?: string
): NextResponse | null {
  if (!shouldGracefulDbFallback(error)) return null;
  if (logLabel) {
    console.warn(`${logLabel} DB fallback:`, (error as Error)?.message);
  }
  return apiDbOk(data);
}

export const SESSION_USER_NOT_FOUND_CODE = 'SESSION_USER_NOT_FOUND';

export function sessionUserNotFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'نشست نامعتبر است؛ لطفاً دوباره وارد شوید',
      code: SESSION_USER_NOT_FOUND_CODE,
    },
    { status: 401 }
  );
}

/** userId از session — با اعتبارسنجی DB و fallback ایمیل */
export async function resolveSessionUserId(session: Session): Promise<string | null> {
  const select = { id: true, deletedAt: true } as const;

  const directId = session.user?.id;
  if (directId) {
    try {
      const byId = await dbQuery(() =>
        prisma.users.findUnique({
          where: { id: String(directId) },
          select,
        })
      );
      if (byId && !byId.deletedAt) return byId.id;
    } catch {
      /* fallback to email */
    }
  }

  const email = session.user?.email;
  if (!email) return null;

  try {
    const byEmail = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email },
        select,
      })
    );
    return byEmail && !byEmail.deletedAt ? byEmail.id : null;
  } catch {
    return null;
  }
}

/** پروفایل حداقلی از session — وقتی DB timeout شده */
export function buildSessionProfileFallback(session: Session) {
  const u = session.user;
  if (!u?.id) return null;

  const email = typeof u.email === 'string' ? u.email : '';
  return {
    id: u.id,
    name: u.name ?? null,
    email,
    image: u.image ?? null,
    role: (u as { role?: string }).role ?? 'USER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    username:
      (u as { username?: string }).username ??
      (email.includes('@') ? email.split('@')[0] : 'user'),
    bio: null,
    avatarType: 'DEFAULT',
    avatarId: null,
    avatarStatus: null,
    showBadge: true,
    allowCommentNotifications: true,
    stats: { listsCreated: 0, bookmarks: 0, likes: 0, itemLikes: 0 },
    creatorStats: {
      viralListsCount: 0,
      popularListsCount: 0,
      totalLikesReceived: 0,
      profileViews: 0,
      totalItemsCurated: 0,
    },
    expertise: [] as { name: string; slug: string; icon: string; count: number }[],
    curatorLevel: 'EXPLORER',
    curatorScore: 0,
    curatorNextLevelLabel: null,
    curatorPointsToNext: null,
  };
}
