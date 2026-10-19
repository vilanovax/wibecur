/**
 * Priority queue for comments hub dashboard.
 * Perf: start penalty thresholds in parallel with list fetches (async-parallel).
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getPenaltyThresholds } from '@/lib/comment-permission';

export type HubPriorityItem = {
  id: string;
  type: 'comment_pending' | 'comment_report' | 'item_report' | 'user_penalty';
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

export async function getCommentsHubPriorityItems(
  limit = 5
): Promise<HubPriorityItem[]> {
  const [
    pendingComments,
    openCommentReports,
    openItemReports,
    highPenaltyUsers,
  ] = await Promise.all([
    dbQuery(() =>
      prisma.comments.findMany({
        where: { deletedAt: null, isApproved: false },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          content: true,
          createdAt: true,
          users: { select: { name: true, email: true } },
          items: { select: { title: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.comment_reports.findMany({
        where: { resolved: false, comments: { deletedAt: null } },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          reason: true,
          createdAt: true,
          comments: {
            select: {
              id: true,
              content: true,
              items: { select: { title: true } },
            },
          },
          users: { select: { name: true, email: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.item_reports.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          reason: true,
          createdAt: true,
          items: { select: { title: true } },
          users: { select: { name: true, email: true } },
        },
      })
    ),
    // Thresholds resolved inside this branch — runs parallel with the three finds
    (async () => {
      const thresholds = await getPenaltyThresholds();
      return dbQuery(() =>
        prisma.user_violations.findMany({
          where: {
            totalPenaltyScore: { gte: thresholds.restrict },
            users: { isActive: true },
          },
          orderBy: [
            { totalPenaltyScore: 'desc' },
            { lastViolationDate: 'desc' },
          ],
          take: 2,
          select: {
            id: true,
            totalPenaltyScore: true,
            lastViolationDate: true,
            users: {
              select: { id: true, name: true, email: true },
            },
          },
        })
      );
    })(),
  ]);

  const items: HubPriorityItem[] = [
    ...pendingComments.map((c) => ({
      id: `cp-${c.id}`,
      type: 'comment_pending' as const,
      title: c.content.slice(0, 72) + (c.content.length > 72 ? '…' : ''),
      subtitle: `${c.users.name ?? c.users.email} · ${c.items.title}`,
      href: `/admin/comments/all?filter=pending`,
      createdAt: c.createdAt.toISOString(),
    })),
    ...openCommentReports.map((r) => ({
      id: `cr-${r.id}`,
      type: 'comment_report' as const,
      title:
        r.comments.content.slice(0, 72) +
        (r.comments.content.length > 72 ? '…' : ''),
      subtitle: `ریپورت: ${r.reason ?? '—'} · ${r.comments.items.title}`,
      href: '/admin/comments/reports?resolved=false',
      createdAt: r.createdAt.toISOString(),
    })),
    ...openItemReports.map((r) => ({
      id: `ir-${r.id}`,
      type: 'item_report' as const,
      title: r.items.title,
      subtitle: `ریپورت آیتم · ${r.reason ?? '—'}`,
      href: '/admin/comments/item-reports?resolved=false',
      createdAt: r.createdAt.toISOString(),
    })),
    ...highPenaltyUsers.map((v) => ({
      id: `vp-${v.id}`,
      type: 'user_penalty' as const,
      title: v.users.name ?? v.users.email,
      subtitle: `امتیاز منفی ${(v.totalPenaltyScore ?? 0).toLocaleString('fa-IR')} — نیاز به بررسی`,
      href: `/admin/comments/violations?search=${encodeURIComponent(v.users.email)}`,
      createdAt: v.lastViolationDate.toISOString(),
    })),
  ];

  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, limit);
}
