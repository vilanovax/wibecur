import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const CACHE_SECONDS = 300;

export async function getCachedBadWords(): Promise<string[]> {
  const getCached = unstable_cache(
    async () => {
      const badWords = await dbQuery(() =>
        prisma.bad_words.findMany({ select: { word: true } })
      );
      return badWords.map((bw) => bw.word.toLowerCase());
    },
    ['bad-words-list'],
    { revalidate: CACHE_SECONDS, tags: ['bad-words'] }
  );

  try {
    return await getCached();
  } catch (err) {
    console.warn('Could not fetch bad words:', err);
    return [];
  }
}
