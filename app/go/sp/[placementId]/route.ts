import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-config';
import { trackSponsoredClick } from '@/lib/sponsored-placements';

/** GET /go/sp/[placementId] — log click + redirect */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> }
) {
  try {
    const { placementId } = await params;
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId') ?? undefined;
    const categoryId = searchParams.get('categoryId') ?? undefined;

    const session = await auth();

    const destinationUrl = await trackSponsoredClick(prisma, placementId, {
      userId: session?.user?.id ?? null,
      listId,
      categoryId,
    });

    if (!destinationUrl) {
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    return NextResponse.redirect(destinationUrl, 302);
  } catch (err: unknown) {
    console.error('Sponsored click redirect error:', err);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
