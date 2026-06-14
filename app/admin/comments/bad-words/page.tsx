import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { buildCommentsNavStats } from '@/lib/admin/comments-nav-stats';
import BadWordsPageClient from './BadWordsPageClient';

async function countFilteredWithWord(word: string): Promise<number> {
  const where = {
    isFiltered: true,
    deletedAt: null,
    content: {
      contains: word,
      mode: 'insensitive' as const,
    },
  };

  const [itemComments, listComments] = await Promise.all([
    prisma.comments.count({ where }),
    prisma.list_comments.count({ where }),
  ]);

  return itemComments + listComments;
}

export default async function BadWordsPage() {
  await requireAdmin();
  const hubStats = await getCachedCommentsHubStats();

  const [badWords, itemFiltered, listFiltered] = await Promise.all([
    prisma.bad_words.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comments.count({ where: { isFiltered: true, deletedAt: null } }),
    prisma.list_comments.count({ where: { isFiltered: true, deletedAt: null } }),
  ]);

  const totalFiltered = itemFiltered + listFiltered;

  const wordsWithCounts = await Promise.all(
    badWords.map(async (word) => {
      let filteredCount = 0;
      try {
        filteredCount = await countFilteredWithWord(word.word);
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
      navStats={buildCommentsNavStats(hubStats)}
    />
  );
}
