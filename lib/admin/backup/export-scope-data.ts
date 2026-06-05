import { prisma } from '@/lib/prisma';
import type { BackupDataFiles, BackupScope } from './types';
import { normalizeBackupScopes } from './types';
import { sanitizeSettingsRecord } from './sanitize';

type TrashFilter = { deletedAt?: null | { not: null } };

function trashWhere(includeTrash: boolean): TrashFilter {
  return includeTrash ? {} : { deletedAt: null };
}

export async function exportScopeData(
  scopesInput: BackupScope[],
  includeTrash: boolean
): Promise<BackupDataFiles> {
  const scopes = normalizeBackupScopes(scopesInput);
  const tw = trashWhere(includeTrash);
  const files: BackupDataFiles = {};

  const add = (key: string, rows: unknown[]) => {
    if (rows.length > 0) files[key] = rows;
  };

  if (scopes.includes('categories')) {
    add('categories', await prisma.categories.findMany({ where: tw, orderBy: { order: 'asc' } }));
  }

  if (scopes.includes('lists')) {
    add('lists', await prisma.lists.findMany({ where: tw, orderBy: { createdAt: 'desc' } }));
  }

  if (scopes.includes('items')) {
    const itemWhere = includeTrash ? {} : { lists: { deletedAt: null } };
    add('catalog_items', await prisma.catalog_items.findMany({ orderBy: { updatedAt: 'desc' } }));
    add(
      'items',
      await prisma.items.findMany({
        where: itemWhere,
        orderBy: { order: 'asc' },
      })
    );
  }

  if (scopes.includes('engagement')) {
    add('bookmarks', await prisma.bookmarks.findMany());
    add('list_likes', await prisma.list_likes.findMany());
    add('list_reactions', await prisma.list_reactions.findMany());
    add('item_votes', await prisma.item_votes.findMany());
    add(
      'comments',
      await prisma.comments.findMany({
        where: includeTrash ? {} : { deletedAt: null },
      })
    );
    add('comment_likes', await prisma.comment_likes.findMany());
    add('comment_votes', await prisma.comment_votes.findMany());
    add(
      'list_comments',
      await prisma.list_comments.findMany({
        where: includeTrash ? {} : { deletedAt: null },
      })
    );
    add('list_comment_likes', await prisma.list_comment_likes.findMany());
    add('list_comment_votes', await prisma.list_comment_votes.findMany());
    add('follows', await prisma.follows.findMany());
  }

  if (scopes.includes('users')) {
    const users = await prisma.users.findMany({
      where: tw,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        isActive: true,
        reputationScore: true,
        curatorScore: true,
        curatorLevel: true,
        viralListsCount: true,
        totalLikesReceived: true,
        approvedItemsCount: true,
        bio: true,
        username: true,
        avatarType: true,
        avatarId: true,
        avatarStatus: true,
        showBadge: true,
        allowCommentNotifications: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        deletedById: true,
        deleteReason: true,
      },
    });
    add('users', users);
    add('user_category_affinity', await prisma.user_category_affinity.findMany());
    add('creator_rankings', await prisma.creator_rankings.findMany());
    add('user_achievements', await prisma.user_achievements.findMany());
  }

  if (scopes.includes('moderation')) {
    add('bad_words', await prisma.bad_words.findMany());
    add('comment_reports', await prisma.comment_reports.findMany());
    add('item_reports', await prisma.item_reports.findMany());
    add('list_reports', await prisma.list_reports.findMany());
    add('comment_penalties', await prisma.comment_penalties.findMany());
    add('user_violations', await prisma.user_violations.findMany());
    add('list_comment_reports', await prisma.list_comment_reports.findMany());
    add('moderation_cases', await prisma.moderation_case.findMany());
    add('moderation_notes', await prisma.moderation_note.findMany());
    add('item_moderation', await prisma.item_moderation.findMany());
  }

  if (scopes.includes('suggestions')) {
    add('suggested_lists', await prisma.suggested_lists.findMany());
    add('suggested_items', await prisma.suggested_items.findMany());
  }

  if (scopes.includes('settings')) {
    const settings = await prisma.settings.findMany();
    add(
      'settings',
      settings.map((s) => sanitizeSettingsRecord(s as Record<string, unknown>))
    );
    add('comment_settings', await prisma.comment_settings.findMany());
  }

  if (scopes.includes('featured')) {
    add('home_featured_slots', await prisma.home_featured_slot.findMany());
    add('home_featured_events', await prisma.home_featured_event.findMany());
    add('creator_spotlights', await prisma.creator_spotlights.findMany());
  }

  return files;
}
