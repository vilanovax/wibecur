import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  normalizeIranPhone,
  phoneToAuthEmail,
  validateAuthPassword,
  validatePhoneInput,
} from '@/lib/phone-auth';
import { DEFAULT_PACK_AVATARS } from '@/lib/vibe-avatars';
import { checkActionRateLimit } from '@/lib/rate-limit';

const DEFAULT_AVATAR_IDS = new Set(DEFAULT_PACK_AVATARS.map((a) => a.id));

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  try {
    // ضد-اتوماسیون: حداکثر ۵ ثبت‌نام در ساعت به‌ازای هر IP (جلوگیری از ساخت انبوه حساب).
    const ip = getClientIp(request);
    const { success } = await checkActionRateLimit(`register:${ip}`, 5, '1 h');
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کن.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const phoneRaw = String(body?.phone ?? '');
    const password = String(body?.password ?? '');
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const avatarRaw = typeof body?.avatarId === 'string' ? body.avatarId.trim() : 'vibe';
    const avatarId = DEFAULT_AVATAR_IDS.has(avatarRaw) ? avatarRaw : 'vibe';

    const phoneError = validatePhoneInput(phoneRaw);
    if (phoneError) {
      return NextResponse.json({ success: false, error: phoneError }, { status: 400 });
    }

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    const normalizedPhone = normalizeIranPhone(phoneRaw)!;
    const email = phoneToAuthEmail(normalizedPhone);

    const existing = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email },
        select: { id: true },
      })
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این شماره قبلاً ثبت شده — وارد شو' },
        { status: 409 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    const baseUsername = `u${normalizedPhone.slice(-8)}`;

    let username = baseUsername;
    for (let i = 0; i < 5; i++) {
      const taken = await dbQuery(() =>
        prisma.users.findUnique({ where: { username }, select: { id: true } })
      );
      if (!taken) break;
      username = `${baseUsername}${nanoid(4).toLowerCase()}`;
    }

    const user = await dbQuery(() =>
      prisma.users.create({
        data: {
          id: nanoid(),
          name: name || null,
          email,
          username,
          password: hashedPassword,
          role: 'USER',
          avatarType: 'DEFAULT',
          avatarId,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: { id: true, name: true, email: true },
      })
    );

    return NextResponse.json({
      success: true,
      data: { userId: user.id },
    });
  } catch (error: unknown) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت‌نام. دوباره تلاش کن.' },
      { status: 500 }
    );
  }
}
