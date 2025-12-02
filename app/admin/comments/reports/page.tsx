import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/admin/shared/Pagination';
import ReportsPageClient from './ReportsPageClient';

const ITEMS_PER_PAGE = 20;

export default async function ReportsPage({
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
    prisma.comment_reports.count({ where }),
    prisma.comment_reports.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              select: {
                id: true,
                title: true,
              },
            },
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
    }),
  ]);

  // Group reports by commentId
  const reportsByComment = new Map();
  reportsRaw.forEach((report) => {
    const commentId = report.commentId;
    if (!reportsByComment.has(commentId)) {
      reportsByComment.set(commentId, {
        comment: report.comments,
        reports: [],
        reportCount: 0,
      });
    }
    reportsByComment.get(commentId).reports.push(report);
    reportsByComment.get(commentId).reportCount += 1;
  });

  const reports = Array.from(reportsByComment.values()).map((r) => ({
    ...r,
    comment: {
      ...r.comment,
      createdAt: r.comment.createdAt.toISOString(),
      updatedAt: r.comment.updatedAt.toISOString(),
    },
    reports: r.reports.map((rep: any) => ({
      ...rep,
      createdAt: rep.createdAt.toISOString(),
    })),
  }));

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <ReportsPageClient
        reports={reports}
        currentResolved={resolved}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/comments/reports"
        searchParams={resolved ? { resolved } : {}}
      />
    </>
  );
}

