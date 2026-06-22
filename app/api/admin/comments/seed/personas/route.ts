import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export async function GET() {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const personas = await dbQuery(() =>
    prisma.comment_personas.findMany({
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        isActive: true,
        userId: true,
      },
    })
  );

  return NextResponse.json({ success: true, data: personas });
}
