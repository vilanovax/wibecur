import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { AvatarType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { isDbUnavailableError } from '@/lib/db-errors';
import {
  buildSessionProfileFallback,
  resolveSessionUserId,
  tryApiDbFallback,
} from '@/lib/api-db';
import { normalizeUsername, validateUsernameFormat } from '@/lib/username';
import { fetchApiProfileUser } from '@/lib/profile-server';

// GET /api/user/profile - دریافت پروفایل کاربر
export async function GET(_request: NextRequest) {
  let session = null;
  try {
    session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID not found' }, { status: 401 });
    }

    const user = await fetchApiProfileUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          avatarType: String(user.avatarType ?? 'DEFAULT'),
          avatarStatus: user.avatarStatus != null ? String(user.avatarStatus) : null,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching user profile:', message);

    if (session?.user) {
      const fallbackUser = buildSessionProfileFallback(session);
      if (fallbackUser) {
        const fb = tryApiDbFallback(error, { user: fallbackUser }, 'Profile GET');
        if (fb) return fb;
        return NextResponse.json({ success: true, data: { user: fallbackUser } });
      }
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/user/profile - ویرایش پروفایل کاربر
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      name,
      email,
      username,
      bio,
      showBadge,
      allowCommentNotifications,
      avatarType,
      avatarId,
    } = body;

    try {
      if (email) {
        const existingUser = await dbQuery(() =>
          prisma.users.findUnique({ where: { email } })
        );
        if (existingUser && existingUser.id !== userId) {
          return NextResponse.json(
            { success: false, error: 'این ایمیل قبلاً استفاده شده است' },
            { status: 400 }
          );
        }
      }

      if (username !== undefined && username !== null && username !== '') {
        const clean = normalizeUsername(String(username));
        const format = validateUsernameFormat(clean);
        if (!format.valid) {
          return NextResponse.json(
            { success: false, error: format.error },
            { status: 400 }
          );
        }
        const existing = await dbQuery(() =>
          prisma.users.findUnique({ where: { username: clean } })
        );
        if (existing && existing.id !== userId) {
          return NextResponse.json(
            { success: false, error: 'این نام کاربری قبلاً استفاده شده است' },
            { status: 400 }
          );
        }
      }
    } catch {
      // اگر جدول/ستون نبود، چک تکراری را نادیده می‌گیریم و مستقیم آپدیت می‌کنیم
    }

    const updateData: {
      name?: string;
      email?: string;
      username?: string | null;
      bio?: string | null;
      showBadge?: boolean;
      allowCommentNotifications?: boolean;
      avatarType?: 'DEFAULT' | 'UPLOADED';
      avatarId?: string | null;
      avatarStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username === '' ? null : String(username).trim().toLowerCase();
    if (bio !== undefined) updateData.bio = bio === '' ? null : String(bio).slice(0, 160);
    if (typeof showBadge === 'boolean') updateData.showBadge = showBadge;
    if (typeof allowCommentNotifications === 'boolean') updateData.allowCommentNotifications = allowCommentNotifications;
    const wantVibeAvatar = (String(avatarType ?? '').toUpperCase() === 'DEFAULT' && avatarId && String(avatarId).trim());
    const avatarIdVal = wantVibeAvatar ? String(avatarId).trim() : null;

    // آپدیت آواتار در یک فراخوانی جدا تا حتماً در دیتابیس ذخیره شود
    if (avatarIdVal) {
      try {
        await dbQuery(() =>
          prisma.users.update({
            where: { id: userId },
            data: {
              avatarType: AvatarType.DEFAULT,
              avatarId: avatarIdVal,
              avatarStatus: null,
              updatedAt: new Date(),
            },
          })
        );
      } catch (avatarErr) {
        console.error('Profile PUT: avatar update failed', avatarErr);
      }
    }

    if (wantVibeAvatar) {
      updateData.avatarType = AvatarType.DEFAULT;
      updateData.avatarId = avatarIdVal;
      updateData.avatarStatus = null;
    }

    const baseSelect = {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    };

    try {
      const updatedUser = await dbQuery(() =>
        prisma.users.update({
          where: { id: userId },
          data: updateData,
          select: {
            ...baseSelect,
            bio: true,
            username: true,
            avatarType: true,
            avatarId: true,
            avatarStatus: true,
            showBadge: true,
            allowCommentNotifications: true,
          },
        })
      );
      return NextResponse.json({
        success: true,
        data: { user: updatedUser },
      });
    } catch (updateErr: unknown) {
      const msg = updateErr instanceof Error ? updateErr.message : '';
      const isUnknownField = (updateErr as { name?: string }).name === 'PrismaClientValidationError' || msg.includes('Unknown field') || msg.includes('column');
      // وقتی کلاینت Prisma با اسکیما همگام نیست (مثلاً prisma generate نشده)، فقط فیلدهای پایه آپدیت می‌شوند
      if (isUnknownField) {
        const safeData: { name?: string; email?: string; updatedAt: Date } = { updatedAt: new Date() };
        if (name !== undefined) safeData.name = name;
        if (email !== undefined) safeData.email = email;
        try {
          const updatedUser = await dbQuery(() =>
            prisma.users.update({
              where: { id: userId },
              data: safeData,
              select: baseSelect,
            })
          );
          return NextResponse.json({
            success: true,
            data: {
              user: {
                ...updatedUser,
                bio: null,
                username: null,
                avatarType: 'DEFAULT',
                avatarId: avatarIdVal ?? null,
                avatarStatus: null,
                showBadge: true,
                allowCommentNotifications: true,
              },
            },
          });
        } catch (safeErr) {
          const nameOnly = { updatedAt: new Date() as Date, ...(name !== undefined && { name }) };
          try {
            const updatedUser = await dbQuery(() =>
              prisma.users.update({
                where: { id: userId },
                data: nameOnly,
                select: baseSelect,
              })
            );
            return NextResponse.json({
              success: true,
              data: {
                user: {
                  ...updatedUser,
                  bio: null,
                  username: null,
                  avatarType: 'DEFAULT',
                  avatarId: avatarIdVal ?? null,
                  avatarStatus: null,
                  showBadge: true,
                  allowCommentNotifications: true,
                },
              },
            });
          } catch {
            throw safeErr;
          }
        }
      }
      throw updateErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error updating user profile:', error);
    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        { success: false, error: 'اتصال به دیتابیس برقرار نیست. چند ثانیه بعد دوباره تلاش کنید.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: message });
  }
}

