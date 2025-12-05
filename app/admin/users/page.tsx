import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import Pagination from '@/components/admin/shared/Pagination';
import UsersPageClient from './UsersPageClient';

const ITEMS_PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  await requireAdmin();

  const { page = '1', search = '' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build where clause
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [totalCount, users] = await Promise.all([
    dbQuery(() =>
      prisma.users.count({ where })
    ),
    dbQuery(() =>
      prisma.users.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          isActive: true,
          _count: {
            select: {
              lists: true,
              list_likes: true,
              bookmarks: true,
            },
          },
        },
      })
    ),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Serialize dates
  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: null, // Not needed
  }));

  return (
    <UsersPageClient
      users={serializedUsers}
      currentSearch={search}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
