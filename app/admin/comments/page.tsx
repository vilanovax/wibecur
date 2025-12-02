import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/admin/shared/Pagination';
import CommentsPageClient from './CommentsPageClient';

const ITEMS_PER_PAGE = 20;

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; search?: string }>;
}) {
  await requireAdmin();

  const { page = '1', filter = 'all', search = '' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build where clause
  const where: any = {
    deletedAt: null, // Always exclude soft-deleted comments
  };
  if (filter === 'approved') {
    where.isApproved = true;
  } else if (filter === 'filtered') {
    // Only show comments with bad words (isFiltered = true)
    where.isFiltered = true;
  } else if (filter === 'reported') {
    // Only show comments that are reported (regardless of isFiltered)
    where.comment_reports = { some: { resolved: false } };
  }

  if (search) {
    where.content = { contains: search, mode: 'insensitive' };
  }

  // Get bad words for filtering
  const badWords = await prisma.bad_words.findMany({
    select: { word: true },
  });
  const badWordsList = badWords.map((bw) => bw.word.toLowerCase());

  const [totalCount, comments] = await Promise.all([
    prisma.comments.count({ where }),
    prisma.comments.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            comment_reports: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Serialize dates
  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
  }));

  return (
    <>
      <CommentsPageClient
        comments={serializedComments}
        currentFilter={filter}
        currentSearch={search}
        badWords={badWordsList}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/comments"
        searchParams={
          filter !== 'all' || search
            ? { ...(filter !== 'all' && { filter }), ...(search && { search }) }
            : {}
        }
      />
    </>
  );
}

