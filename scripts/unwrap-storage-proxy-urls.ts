/**
 * لینک‌های پروکسی اپ را در دیتابیس به URL مستقیم استوریج برمی‌گرداند.
 *
 * Usage: npx tsx scripts/unwrap-storage-proxy-urls.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { normalizeImageUrlForStorage } from '../lib/image-url-sanitize';

const prisma = new PrismaClient();

const TEXT_COLUMNS: { table: string; column: string }[] = [
  { table: 'items', column: 'imageUrl' },
  { table: 'catalog_items', column: 'imageUrl' },
  { table: 'lists', column: 'coverImage' },
  { table: 'lists', column: 'horizontalImage' },
  { table: 'categories', column: 'heroImage' },
  { table: 'users', column: 'image' },
  { table: 'person_profiles', column: 'imageUrl' },
  { table: 'suggested_items', column: 'imageUrl' },
  { table: 'suggested_lists', column: 'coverImage' },
  { table: 'comment_personas', column: 'avatarUrl' },
  { table: 'settings', column: 'siteLogoUrl' },
];

const JSON_COLUMNS: { table: string; column: string }[] = [
  { table: 'items', column: 'metadata' },
  { table: 'catalog_items', column: 'metadata' },
  { table: 'suggested_items', column: 'metadata' },
];

function containsImageProxy(value: string): boolean {
  return value.includes('liara-image') || value.includes('storage-image');
}

function rewriteProxyString(value: string): string | null {
  if (!containsImageProxy(value)) return null;
  const next = normalizeImageUrlForStorage(value);
  if (!next || next === value || containsImageProxy(next)) return null;
  return next;
}

function rewriteJson(value: unknown): { next: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const next = rewriteProxyString(value);
    return next ? { next, changed: true } : { next: value, changed: false };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const rewritten = rewriteJson(item);
      if (rewritten.changed) changed = true;
      return rewritten.next;
    });
    return { next, changed };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const rewritten = rewriteJson(child);
      if (rewritten.changed) changed = true;
      next[key] = rewritten.next;
    }
    return { next, changed };
  }
  return { next: value, changed: false };
}

async function rewriteTextColumn(table: string, column: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; value: string }>>(
    `SELECT id, "${column}" AS value FROM "${table}"
     WHERE "${column}" LIKE '%liara-image%'
        OR "${column}" LIKE '%storage-image%'`
  );

  let updated = 0;
  for (const row of rows) {
    const next = rewriteProxyString(row.value);
    if (!next) continue;
    await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "${column}" = $1, "updatedAt" = NOW() WHERE id = $2`,
      next,
      row.id
    );
    updated += 1;
  }
  return updated;
}

async function rewriteJsonColumn(table: string, column: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; value: unknown }>>(
    `SELECT id, "${column}" AS value FROM "${table}"
     WHERE "${column}"::text LIKE '%liara-image%'
        OR "${column}"::text LIKE '%storage-image%'`
  );

  let updated = 0;
  for (const row of rows) {
    const rewritten = rewriteJson(row.value);
    if (!rewritten.changed) continue;
    await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "${column}" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2`,
      JSON.stringify(rewritten.next),
      row.id
    );
    updated += 1;
  }
  return updated;
}

async function main() {
  let total = 0;

  for (const target of TEXT_COLUMNS) {
    const updated = await rewriteTextColumn(target.table, target.column);
    total += updated;
    console.log(`${target.table}.${target.column}: ${updated}`);
  }

  for (const target of JSON_COLUMNS) {
    const updated = await rewriteJsonColumn(target.table, target.column);
    total += updated;
    console.log(`${target.table}.${target.column}: ${updated}`);
  }

  console.log(`done: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
