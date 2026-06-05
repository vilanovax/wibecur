import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import BadWordsPageClient from './BadWordsPageClient';

export default async function BadWordsPage() {
  await requireAdmin();
  const hubStats = await getCachedCommentsHubStats();

  const [badWords, totalFiltered] = await Promise.all([
    prisma.bad_words.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comments.count({ where: { isFiltered: true, deletedAt: null } }),
  ]);

  const wordsWithCounts = await Promise.all(
    badWords.map(async (word) => {
      let filteredCount = 0;
      try {
        filteredCount = await prisma.comments.count({
          where: {
            isFiltered: true,
            deletedAt: null,
            content: {
              contains: word.word,
              mode: 'insensitive',
            },
          },
        });
      } catch {
        /* ignore */
      }
      return {
        ...word,
        filteredCount,
        createdAt: word.createdAt.toISOString(),
        updatedAt: word.updatedAt.toISOString(),
      };
    })
  );

  const activeWords = wordsWithCounts.filter((w) => w.filteredCount > 0).length;

  return (
    <BadWordsPageClient
      words={wordsWithCounts}
      stats={{
        totalWords: wordsWithCounts.length,
        activeWords,
        totalFiltered,
      }}
      navStats={{
        pending: hubStats.comments.pending,
        commentReportsOpen: hubStats.commentReports.open,
        itemReportsOpen: hubStats.itemReportsOpen,
      }}
    />
  );
}
