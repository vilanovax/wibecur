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

