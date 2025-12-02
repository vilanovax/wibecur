import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/admin/shared/Pagination';
import ViolationsPageClient from './ViolationsPageClient';

const ITEMS_PER_PAGE = 20;

export default async function ViolationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const [totalCount, violations] = await Promise.all([
    prisma.user_violations.count(),
    prisma.user_violations.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { violationCount: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const serializedViolations = violations.map((v) => ({
    id: v.id,
    userId: v.userId,
    commentId: v.commentId,
    violationType: v.violationType,
    violationCount: v.violationCount,
    totalPenaltyScore: v.totalPenaltyScore || 0,
    lastViolationDate: v.lastViolationDate.toISOString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    user: {
      ...v.users,
      createdAt: v.users.createdAt.toISOString(),
    },
  }));

  return (
    <>
      <ViolationsPageClient violations={serializedViolations} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/comments/violations"
      />
    </>
  );
}

