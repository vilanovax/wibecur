import { prisma } from '@/lib/prisma';
import type { BackupDataFiles } from './types';
import { sanitizeSettingsRecord } from './sanitize';
import { sortTablesForRestore, getTableMeta } from './table-registry';

export type RestoreMode = 'merge';

export interface TableRestoreResult {
  table: string;
  processed: number;
  upserted: number;
  failed: number;
  errors: string[];
}

export interface RestoreReport {
  mode: RestoreMode;
  tables: TableRestoreResult[];
  totalUpserted: number;
  totalFailed: number;
}

const PRISMA_DELEGATES: Record<string, string> = {
  categories: 'categories',
  lists: 'lists',
  catalog_items: 'catalog_items',
  items: 'items',
  users: 'users',
  bookmarks: 'bookmarks',
  list_likes: 'list_likes',
  list_reactions: 'list_reactions',
  item_votes: 'item_votes',
  comments: 'comments',
  comment_likes: 'comment_likes',
  comment_votes: 'comment_votes',
  list_comments: 'list_comments',
  list_comment_likes: 'list_comment_likes',
  list_comment_votes: 'list_comment_votes',
  follows: 'follows',
  user_category_affinity: 'user_category_affinity',
  creator_rankings: 'creator_rankings',
  user_achievements: 'user_achievements',
  bad_words: 'bad_words',
  comment_reports: 'comment_reports',
  item_reports: 'item_reports',
  list_reports: 'list_reports',
  comment_penalties: 'comment_penalties',
  user_violations: 'user_violations',
  list_comment_reports: 'list_comment_reports',
  moderation_cases: 'moderation_case',
  moderation_case: 'moderation_case',
  moderation_notes: 'moderation_note',
  moderation_note: 'moderation_note',
  item_moderation: 'item_moderation',
  suggested_lists: 'suggested_lists',
  suggested_items: 'suggested_items',
  settings: 'settings',
  comment_settings: 'comment_settings',
  home_featured_slots: 'home_featured_slot',
  home_featured_events: 'home_featured_event',
  creator_spotlights: 'creator_spotlights',
};

function coerceRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) out[k] = d;
    }
  }
  if ('password' in out) delete out.password;
  return out;
}

function prepareRow(table: string, row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null;
  let data = coerceRow(row as Record<string, unknown>);
  if (typeof data.id !== 'string' || !data.id) return null;
  if (table === 'settings') {
    data = sanitizeSettingsRecord(data);
  }
  return data;
}

async function upsertRow(
  delegate: { upsert: (args: { where: { id: string }; create: unknown; update: unknown }) => Promise<unknown> },
  data: Record<string, unknown>
): Promise<void> {
  const id = data.id as string;
  await delegate.upsert({
    where: { id },
    create: data,
    update: data,
  });
}

export async function restoreBackupTables(
  data: BackupDataFiles,
  selectedTables: string[],
  _mode: RestoreMode = 'merge'
): Promise<RestoreReport> {
  const ordered = sortTablesForRestore(selectedTables);
  const results: TableRestoreResult[] = [];

  for (const table of ordered) {
    const meta = getTableMeta(table);
    const delegateKey = PRISMA_DELEGATES[table];
    const rows = data[table];

    const result: TableRestoreResult = {
      table,
      processed: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    if (!meta?.restorable) {
      result.errors.push('بازیابی این جدول پشتیبانی نمی‌شود');
      results.push(result);
      continue;
    }

    if (!delegateKey || !Array.isArray(rows) || rows.length === 0) {
      results.push(result);
      continue;
    }

    const delegate = (prisma as unknown as Record<string, unknown>)[delegateKey] as {
      upsert: (args: {
        where: { id: string };
        create: unknown;
        update: unknown;
      }) => Promise<unknown>;
    };

    if (!delegate?.upsert) {
      result.errors.push('مدل Prisma یافت نشد');
      results.push(result);
      continue;
    }

    for (const raw of rows) {
      result.processed += 1;
      const dataRow = prepareRow(table, raw);
      if (!dataRow) {
        result.failed += 1;
        if (result.errors.length < 5) result.errors.push('ردیف بدون id');
        continue;
      }
      try {
        await upsertRow(delegate, dataRow);
        result.upserted += 1;
      } catch (err) {
        result.failed += 1;
        if (result.errors.length < 5) {
          result.errors.push(err instanceof Error ? err.message : 'خطای upsert');
        }
      }
    }

    results.push(result);
  }

  return {
    mode: 'merge',
    tables: results,
    totalUpserted: results.reduce((s, r) => s + r.upserted, 0),
    totalFailed: results.reduce((s, r) => s + r.failed, 0),
  };
}
