/**
 * پر کردن metadata.mediaType برای کاتالوگ فیلم/سریال از OMDb Type.
 *
 * npx tsx scripts/backfill-catalog-media-type.ts --dry-run
 * npx tsx scripts/backfill-catalog-media-type.ts
 * npx tsx scripts/backfill-catalog-media-type.ts --limit=50
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { extractCatalogImdbId } from '../lib/missing-image-utils';
import { resolveOmdbApiKey } from '../lib/movie-api-keys';

const MOVIE_SLUGS = ['movies', 'movie', 'film', 'series', 'cinema'] as const;
const DELAY_MS = 250;

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function flagValue(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function asMeta(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function mapOmdbType(raw: string | undefined): 'movie' | 'series' | null {
  const t = (raw ?? '').trim().toLowerCase();
  if (t === 'movie') return 'movie';
  if (t === 'series' || t === 'episode') return 'series';
  return null;
}

async function fetchOmdbType(
  imdbId: string,
  apiKey: string
): Promise<'movie' | 'series' | null | 'error'> {
  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(imdbId)}&plot=short`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      console.warn(`OMDb HTTP ${res.status} برای ${imdbId}`);
      return 'error';
    }
    const data = (await res.json()) as { Response?: string; Type?: string; Error?: string };
    if (data.Response === 'False') {
      console.warn(`OMDb False برای ${imdbId}: ${data.Error ?? ''}`);
      return null;
    }
    const mapped = mapOmdbType(data.Type);
    if (!mapped) {
      console.warn(`OMDb Type ناشناخته برای ${imdbId}: ${data.Type ?? ''}`);
    }
    return mapped;
  } catch (err) {
    console.warn(`OMDb exception برای ${imdbId}:`, err instanceof Error ? err.message : err);
    return 'error';
  }
}

async function main() {
  const dryRun = flag('dry-run');
  const limitRaw = flagValue('limit');
  const limit = limitRaw ? Math.max(1, parseInt(limitRaw, 10) || 0) : null;

  const apiKey = await resolveOmdbApiKey();
  if (!apiKey) {
    console.error('کلید OMDb پیدا نشد (settings.omdbApiKey یا OMDB_API_KEY).');
    process.exit(1);
  }

  const rows = await prisma.catalog_items.findMany({
    where: {
      OR: [
        { categorySlug: { in: [...MOVIE_SLUGS] } },
        { categorySlug: { contains: 'movie' } },
        { categorySlug: { contains: 'film' } },
        { categorySlug: { contains: 'cinema' } },
        { categorySlug: { contains: 'series' } },
      ],
    },
    select: {
      id: true,
      title: true,
      categorySlug: true,
      externalKey: true,
      externalUrl: true,
      metadata: true,
    },
    orderBy: { updatedAt: 'asc' },
  });

  const candidates = rows.filter((row) => {
    const meta = asMeta(row.metadata);
    const existing = meta.mediaType;
    if (existing === 'movie' || existing === 'series') return false;
    return !!extractCatalogImdbId(row);
  });

  const work = limit ? candidates.slice(0, limit) : candidates;

  console.log(
    JSON.stringify(
      {
        dryRun,
        totalInMovieishCategories: rows.length,
        needingMediaType: candidates.length,
        willProcess: work.length,
      },
      null,
      2
    )
  );

  let series = 0;
  let movie = 0;
  let skipped = 0;
  let errors = 0;
  let updated = 0;

  for (const row of work) {
    const imdbId = extractCatalogImdbId(row);
    if (!imdbId) {
      skipped++;
      continue;
    }

    const omdbType = await fetchOmdbType(imdbId, apiKey);
    await sleep(DELAY_MS);

    if (omdbType === 'error') {
      errors++;
      console.warn(`خطا OMDb: ${row.title} (${imdbId})`);
      continue;
    }
    if (!omdbType) {
      skipped++;
      console.warn(`نوع ناشناخته: ${row.title} (${imdbId})`);
      continue;
    }

    if (omdbType === 'series') series++;
    else movie++;

    console.log(`${dryRun ? '[dry-run] ' : ''}${omdbType}\t${imdbId}\t${row.title}`);

    if (dryRun) continue;

    const meta = asMeta(row.metadata);
    meta.mediaType = omdbType;
    await prisma.catalog_items.update({
      where: { id: row.id },
      data: {
        metadata: meta as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
    updated++;
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        series,
        movie,
        skipped,
        errors,
        updated,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
