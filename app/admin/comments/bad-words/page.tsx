import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BadWordsPageClient from './BadWordsPageClient';

export default async function BadWordsPage() {
  await requireAdmin();

  const badWords = await prisma.bad_words.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Get count of filtered comments for each word
  const wordsWithCounts = await Promise.all(
    badWords.map(async (word) => {
      let filteredCount = 0;
      try {
        filteredCount = await prisma.comments.count({
          where: {
            isFiltered: true,
            content: {
              contains: word.word,
              mode: 'insensitive',
            },
          },
        });
      } catch (err) {
        // Ignore errors
      }
      return {
        ...word,
        filteredCount,
        createdAt: word.createdAt.toISOString(),
        updatedAt: word.updatedAt.toISOString(),
      };
    })
  );

  return <BadWordsPageClient words={wordsWithCounts} />;
}

