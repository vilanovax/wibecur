import { prisma } from '@/lib/prisma';
import type { BackupScope, ContentScope } from './types';
import { CONTENT_SCOPES, normalizeBackupScopes } from './types';

type TrashFilter = { deletedAt?: null | { not: null } };

function trashWhere(includeTrash: boolean): TrashFilter {
  return includeTrash ? {} : { deletedAt: null };
}

export type BackupPreviewStats = {
  categories: number;
  lists: number;
  items: number;
  users: number;
  engagement: number;
  moderation: number;
  suggestions: number;
  settings: number;
  featured: number;
  /** Sum of rows that would export for current scope selection */
  estimatedRows: number;
};

async function countItems(includeTrash: boolean): Promise<number> {
  if (includeTrash) {
    return prisma.items.count();
  }
  return prisma.items.count({
    where: { lists: { deletedAt: null } },
  });
}

async function countEngagement(): Promise<number> {
  const [
    bookmarks,
    listLikes,
    listReactions,
    itemVotes,
    comments,
    commentLikes,
    commentVotes,
    listComments,
    listCommentLikes,
    listCommentVotes,
    follows,
  ] = await Promise.all([
    prisma.bookmarks.count(),
    prisma.list_likes.count(),
    prisma.list_reactions.count(),
    prisma.item_votes.count(),
    prisma.comments.count({ where: { deletedAt: null } }),
    prisma.comment_likes.count(),
    prisma.comment_votes.count(),
    prisma.list_comments.count({ where: { deletedAt: null } }),
    prisma.list_comment_likes.count(),
    prisma.list_comment_votes.count(),
    prisma.follows.count(),
  ]);
  return (
    bookmarks +
    listLikes +
    listReactions +
    itemVotes +
    comments +
    commentLikes +
    commentVotes +
    listComments +
    listCommentLikes +
    listCommentVotes +
    follows
  );
}

export async function getBackupPreviewStats(
  includeTrash: boolean,
  scopeInput?: string[]
): Promise<BackupPreviewStats> {
  const tw = trashWhere(includeTrash);
  const scopes = scopeInput?.length ? normalizeBackupScopes(scopeInput) : [];

  const [
    categories,
    lists,
    items,
    users,
    engagement,
    moderation,
    suggestions,
    settings,
    featured,
  ] = await Promise.all([
    prisma.categories.count({ where: tw }),
    prisma.lists.count({ where: tw }),
    countItems(includeTrash),
    prisma.users.count({ where: tw }),
    countEngagement(),
    Promise.all([
      prisma.bad_words.count(),
      prisma.comment_reports.count(),
      prisma.item_reports.count(),
      prisma.list_reports.count(),
    ]).then((parts) => parts.reduce((a, b) => a + b, 0)),
    Promise.all([
      prisma.suggested_lists.count(),
      prisma.suggested_items.count(),
    ]).then((parts) => parts.reduce((a, b) => a + b, 0)),
    prisma.settings.count(),
    Promise.all([
      prisma.home_featured_slot.count(),
      prisma.home_featured_event.count(),
      prisma.creator_spotlights.count(),
    ]).then((parts) => parts.reduce((a, b) => a + b, 0)),
  ]);

  const all: BackupPreviewStats = {
    categories,
    lists,
    items,
    users,
    engagement,
    moderation,
    suggestions,
    settings,
    featured,
    estimatedRows: 0,
  };

  if (scopes.length === 0) {
    all.estimatedRows = categories + lists + items;
    return all;
  }

  let estimated = 0;
  if (scopes.includes('categories')) estimated += categories;
  if (scopes.includes('lists')) estimated += lists;
  if (scopes.includes('items')) estimated += items;
  if (scopes.includes('users')) estimated += users;
  if (scopes.includes('engagement')) estimated += engagement;
  if (scopes.includes('moderation')) estimated += moderation;
  if (scopes.includes('suggestions')) estimated += suggestions;
  if (scopes.includes('settings')) estimated += settings;
  if (scopes.includes('featured')) estimated += featured;

  all.estimatedRows = estimated;
  return all;
}

export function contentScopesSelected(scopes: BackupScope[]): ContentScope[] {
  return CONTENT_SCOPES.filter((c) => scopes.includes(c));
}
