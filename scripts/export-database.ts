import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('🔄 Exporting database data...');

  try {
    // Export all tables
    const data: any = {};

    // Users (excluding passwords for security, will be set from env or defaults)
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // password excluded for security
      },
    });
    data.users = users;
    console.log(`✅ Exported ${users.length} users`);

    // Categories
    const categories = await prisma.categories.findMany({
      orderBy: { order: 'asc' },
    });
    data.categories = categories;
    console.log(`✅ Exported ${categories.length} categories`);

    // Lists
    const lists = await prisma.lists.findMany({
      orderBy: { createdAt: 'desc' },
    });
    data.lists = lists;
    console.log(`✅ Exported ${lists.length} lists`);

    // Items
    const items = await prisma.items.findMany({
      orderBy: { order: 'asc' },
    });
    data.items = items;
    console.log(`✅ Exported ${items.length} items`);

    // Bookmarks
    const bookmarks = await prisma.bookmarks.findMany();
    data.bookmarks = bookmarks;
    console.log(`✅ Exported ${bookmarks.length} bookmarks`);

    // List Likes
    const listLikes = await prisma.list_likes.findMany();
    data.listLikes = listLikes;
    console.log(`✅ Exported ${listLikes.length} list likes`);

    // Item Votes
    const itemVotes = await prisma.item_votes.findMany();
    data.itemVotes = itemVotes;
    console.log(`✅ Exported ${itemVotes.length} item votes`);

    // Comments (excluding soft-deleted)
    const comments = await prisma.comments.findMany({
      where: {
        deletedAt: null,
      },
    });
    data.comments = comments;
    console.log(`✅ Exported ${comments.length} comments`);

    // Comment Likes
    const commentLikes = await prisma.comment_likes.findMany();
    data.commentLikes = commentLikes;
    console.log(`✅ Exported ${commentLikes.length} comment likes`);

    // Comment Reports
    const commentReports = await prisma.comment_reports.findMany();
    data.commentReports = commentReports;
    console.log(`✅ Exported ${commentReports.length} comment reports`);

    // Comment Penalties
    const commentPenalties = await prisma.comment_penalties.findMany();
    data.commentPenalties = commentPenalties;
    console.log(`✅ Exported ${commentPenalties.length} comment penalties`);

    // Bad Words
    const badWords = await prisma.bad_words.findMany();
    data.badWords = badWords;
    console.log(`✅ Exported ${badWords.length} bad words`);

    // Item Reports
    const itemReports = await prisma.item_reports.findMany();
    data.itemReports = itemReports;
    console.log(`✅ Exported ${itemReports.length} item reports`);

    // User Violations
    const userViolations = await prisma.user_violations.findMany();
    data.userViolations = userViolations;
    console.log(`✅ Exported ${userViolations.length} user violations`);

    // Comment Settings
    try {
      const commentSettings = await prisma.comment_settings.findMany();
      data.commentSettings = commentSettings;
      console.log(`✅ Exported ${commentSettings.length} comment settings`);
    } catch (error) {
      console.warn('⚠️  Could not export comment_settings (table may not exist):', error);
      data.commentSettings = [];
    }

    // Settings (excluding sensitive keys)
    const settings = await prisma.settings.findMany();
    data.settings = settings.map((s) => ({
      ...s,
      // Don't export sensitive keys - they should come from environment
      openaiApiKey: null,
      tmdbApiKey: null,
      liaraAccessKey: null,
      liaraSecretKey: null,
      googleApiKey: null,
    }));
    console.log(`✅ Exported ${settings.length} settings (sensitive keys excluded)`);

    // Suggested Lists
    try {
      const suggestedLists = await prisma.suggested_lists.findMany();
      data.suggestedLists = suggestedLists;
      console.log(`✅ Exported ${suggestedLists.length} suggested lists`);
    } catch (error) {
      console.warn('⚠️  Could not export suggested_lists (table may not exist):', error);
      data.suggestedLists = [];
    }

    // Suggested Items
    try {
      const suggestedItems = await prisma.suggested_items.findMany();
      data.suggestedItems = suggestedItems;
      console.log(`✅ Exported ${suggestedItems.length} suggested items`);
    } catch (error) {
      console.warn('⚠️  Could not export suggested_items (table may not exist):', error);
      data.suggestedItems = [];
    }

    // Notifications
    try {
      const notifications = await prisma.notifications.findMany();
      data.notifications = notifications;
      console.log(`✅ Exported ${notifications.length} notifications`);
    } catch (error) {
      console.warn('⚠️  Could not export notifications (table may not exist):', error);
      data.notifications = [];
    }

    // List Comments
    try {
      const listComments = await prisma.list_comments.findMany({
        where: {
          deletedAt: null,
        },
      });
      data.listComments = listComments;
      console.log(`✅ Exported ${listComments.length} list comments`);
    } catch (error) {
      console.warn('⚠️  Could not export list_comments (table may not exist):', error);
      data.listComments = [];
    }

    // List Comment Likes
    try {
      const listCommentLikes = await prisma.list_comment_likes.findMany();
      data.listCommentLikes = listCommentLikes;
      console.log(`✅ Exported ${listCommentLikes.length} list comment likes`);
    } catch (error) {
      console.warn('⚠️  Could not export list_comment_likes (table may not exist):', error);
      data.listCommentLikes = [];
    }

    // List Comment Reports
    try {
      const listCommentReports = await prisma.list_comment_reports.findMany();
      data.listCommentReports = listCommentReports;
      console.log(`✅ Exported ${listCommentReports.length} list comment reports`);
    } catch (error) {
      console.warn('⚠️  Could not export list_comment_reports (table may not exist):', error);
      data.listCommentReports = [];
    }

    // Write to JSON file
    const exportPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    console.log(`✅ Data exported to ${exportPath}`);

    return data;
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  }
}

exportDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

