import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import Pagination from '@/components/admin/shared/Pagination';
import ItemReportsPageClient from './ItemReportsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'گزارش‌های آیتم‌ها | پنل مدیریت',
  description: 'مدیریت گزارش‌های ارسال شده برای آیتم‌ها',
};

const ITEMS_PER_PAGE = 20;

export default async function ItemReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string }>;
}) {
  await requireAdmin();

  const { page = '1', resolved } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: any = {};
  if (resolved === 'false') {
    where.resolved = false;
  } else if (resolved === 'true') {
    where.resolved = true;
  }

  const [totalCount, reportsRaw] = await Promise.all([
    dbQuery(() => prisma.item_reports.count({ where })),
    dbQuery(() =>
      prisma.item_reports.findMany({
        where,
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    ),
  ]);

  const reports = reportsRaw.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <ItemReportsPageClient reports={reports} currentResolved={resolved} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/comments/item-reports"
        searchParams={{
          ...(resolved && { resolved }),
        }}
      />
    </>
  );
}

