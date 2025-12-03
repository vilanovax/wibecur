import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Try to load exported data
  const seedDataPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
  let exportedData: any = null;

  try {
    if (fs.existsSync(seedDataPath)) {
      const fileContent = fs.readFileSync(seedDataPath, 'utf-8');
      exportedData = JSON.parse(fileContent);
      console.log('✅ Loaded exported seed data');
    } else {
      console.log('ℹ️  No seed-data.json found, using default data');
    }
  } catch (error) {
    console.warn('⚠️  Could not load seed-data.json, using default data:', error);
  }

  // Seed Users
  if (exportedData?.users && exportedData.users.length > 0) {
    console.log(`📦 Seeding ${exportedData.users.length} users...`);
    for (const user of exportedData.users) {
      // If it's admin user, set default password
      const password = user.email === 'admin@wibecur.com' || user.email === 'admin@listhub.ir'
        ? await bcrypt.hash('admin123', 10)
        : user.password
        ? user.password
        : null;

      await prisma.users.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          role: user.role,
          updatedAt: new Date(user.updatedAt),
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          password: password,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log('✅ Users seeded');
  } else {
    // Default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.users.upsert({
      where: { email: 'admin@wibecur.com' },
      update: {},
      create: {
        id: 'admin-user-id', // Prisma will generate if using @default(cuid())
        email: 'admin@wibecur.com',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Default admin user created');
  }

  // Seed Categories
  if (exportedData?.categories && exportedData.categories.length > 0) {
    console.log(`📦 Seeding ${exportedData.categories.length} categories...`);
    for (const category of exportedData.categories) {
      await prisma.categories.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
          commentsEnabled: category.commentsEnabled !== undefined ? category.commentsEnabled : true,
          updatedAt: new Date(category.updatedAt),
        },
        create: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
          commentsEnabled: category.commentsEnabled !== undefined ? category.commentsEnabled : true,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        },
      });
    }
    console.log('✅ Categories seeded');
  } else {
    // Default categories
    const categories = [
      { name: 'فیلم و سریال', slug: 'movie', icon: '🎬', color: '#8B5CF6', order: 1 },
      { name: 'کتاب', slug: 'book', icon: '📚', color: '#F97316', order: 2 },
      { name: 'کافه و رستوران', slug: 'cafe', icon: '☕', color: '#D97706', order: 3 },
      { name: 'پادکست', slug: 'podcast', icon: '🎧', color: '#EC4899', order: 4 },
      { name: 'لایف‌استایل', slug: 'lifestyle', icon: '🌱', color: '#10B981', order: 5 },
      { name: 'ماشین و تکنولوژی', slug: 'tech', icon: '🚗', color: '#EF4444', order: 6 },
    ];

    for (const cat of categories) {
      await prisma.categories.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          ...cat,
          id: `cat-${cat.slug}`, // Prisma will generate if using @default(cuid())
          commentsEnabled: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log('✅ Default categories created');
  }

  // Seed Lists
  if (exportedData?.lists && exportedData.lists.length > 0) {
    console.log(`📦 Seeding ${exportedData.lists.length} lists...`);
    for (const list of exportedData.lists) {
      await prisma.lists.upsert({
        where: { id: list.id },
        update: {
          title: list.title,
          slug: list.slug,
          description: list.description,
          coverImage: list.coverImage,
          categoryId: list.categoryId,
          userId: list.userId,
          badge: list.badge,
          isPublic: list.isPublic,
          isFeatured: list.isFeatured,
          viewCount: list.viewCount,
          likeCount: list.likeCount,
          saveCount: list.saveCount,
          itemCount: list.itemCount,
          isActive: list.isActive,
          updatedAt: new Date(list.updatedAt),
        },
        create: {
          id: list.id,
          title: list.title,
          slug: list.slug,
          description: list.description,
          coverImage: list.coverImage,
          categoryId: list.categoryId,
          userId: list.userId,
          badge: list.badge,
          isPublic: list.isPublic,
          isFeatured: list.isFeatured,
          viewCount: list.viewCount,
          likeCount: list.likeCount,
          saveCount: list.saveCount,
          itemCount: list.itemCount,
          isActive: list.isActive,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
        },
      });
    }
    console.log('✅ Lists seeded');
  }

  // Seed Items
  if (exportedData?.items && exportedData.items.length > 0) {
    console.log(`📦 Seeding ${exportedData.items.length} items...`);
    for (const item of exportedData.items) {
      await prisma.items.upsert({
        where: { id: item.id },
        update: {
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          externalUrl: item.externalUrl,
          listId: item.listId,
          order: item.order,
          metadata: item.metadata,
          voteCount: item.voteCount,
          rating: item.rating,
          commentsEnabled: item.commentsEnabled !== undefined ? item.commentsEnabled : true,
          maxComments: item.maxComments !== undefined ? item.maxComments : null,
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          externalUrl: item.externalUrl,
          listId: item.listId,
          order: item.order,
          metadata: item.metadata,
          voteCount: item.voteCount,
          rating: item.rating,
          commentsEnabled: item.commentsEnabled !== undefined ? item.commentsEnabled : true,
          maxComments: item.maxComments !== undefined ? item.maxComments : null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }
    console.log('✅ Items seeded');
  }

  // Seed Bookmarks
  if (exportedData?.bookmarks && exportedData.bookmarks.length > 0) {
    console.log(`📦 Seeding ${exportedData.bookmarks.length} bookmarks...`);
    for (const bookmark of exportedData.bookmarks) {
      await prisma.bookmarks.upsert({
        where: { id: bookmark.id },
        update: {},
        create: {
          id: bookmark.id,
          userId: bookmark.userId,
          listId: bookmark.listId,
          createdAt: new Date(bookmark.createdAt),
        },
      });
    }
    console.log('✅ Bookmarks seeded');
  }

  // Seed List Likes
  if (exportedData?.listLikes && exportedData.listLikes.length > 0) {
    console.log(`📦 Seeding ${exportedData.listLikes.length} list likes...`);
    for (const like of exportedData.listLikes) {
      await prisma.list_likes.upsert({
        where: { id: like.id },
        update: {},
        create: {
          id: like.id,
          userId: like.userId,
          listId: like.listId,
          createdAt: new Date(like.createdAt),
        },
      });
    }
    console.log('✅ List likes seeded');
  }

  // Seed Item Votes
  if (exportedData?.itemVotes && exportedData.itemVotes.length > 0) {
    console.log(`📦 Seeding ${exportedData.itemVotes.length} item votes...`);
    for (const vote of exportedData.itemVotes) {
      await prisma.item_votes.upsert({
        where: { id: vote.id },
        update: {},
        create: {
          id: vote.id,
          userId: vote.userId,
          itemId: vote.itemId,
          value: vote.value,
          createdAt: new Date(vote.createdAt),
        },
      });
    }
    console.log('✅ Item votes seeded');
  }

  // Seed Comments
  if (exportedData?.comments && exportedData.comments.length > 0) {
    console.log(`📦 Seeding ${exportedData.comments.length} comments...`);
    for (const comment of exportedData.comments) {
      await prisma.comments.upsert({
        where: { id: comment.id },
        update: {
          itemId: comment.itemId,
          userId: comment.userId,
          content: comment.content,
          isFiltered: comment.isFiltered,
          isApproved: comment.isApproved,
          likeCount: comment.likeCount,
          updatedAt: new Date(comment.updatedAt),
          deletedAt: comment.deletedAt ? new Date(comment.deletedAt) : null,
        },
        create: {
          id: comment.id,
          itemId: comment.itemId,
          userId: comment.userId,
          content: comment.content,
          isFiltered: comment.isFiltered,
          isApproved: comment.isApproved,
          likeCount: comment.likeCount,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt),
          deletedAt: comment.deletedAt ? new Date(comment.deletedAt) : null,
        },
      });
    }
    console.log('✅ Comments seeded');
  }

  // Seed Comment Likes
  if (exportedData?.commentLikes && exportedData.commentLikes.length > 0) {
    console.log(`📦 Seeding ${exportedData.commentLikes.length} comment likes...`);
    for (const like of exportedData.commentLikes) {
      await prisma.comment_likes.upsert({
        where: { id: like.id },
        update: {},
        create: {
          id: like.id,
          commentId: like.commentId,
          userId: like.userId,
          createdAt: new Date(like.createdAt),
        },
      });
    }
    console.log('✅ Comment likes seeded');
  }

  // Seed Comment Reports
  if (exportedData?.commentReports && exportedData.commentReports.length > 0) {
    console.log(`📦 Seeding ${exportedData.commentReports.length} comment reports...`);
    for (const report of exportedData.commentReports) {
      await prisma.comment_reports.upsert({
        where: { id: report.id },
        update: {
          commentId: report.commentId,
          userId: report.userId,
          reason: report.reason,
          resolved: report.resolved,
          penaltyScore: report.penaltyScore,
        },
        create: {
          id: report.id,
          commentId: report.commentId,
          userId: report.userId,
          reason: report.reason,
          resolved: report.resolved,
          penaltyScore: report.penaltyScore,
          createdAt: new Date(report.createdAt),
        },
      });
    }
    console.log('✅ Comment reports seeded');
  }

  // Seed Comment Penalties
  if (exportedData?.commentPenalties && exportedData.commentPenalties.length > 0) {
    console.log(`📦 Seeding ${exportedData.commentPenalties.length} comment penalties...`);
    for (const penalty of exportedData.commentPenalties) {
      await prisma.comment_penalties.upsert({
        where: { id: penalty.id },
        update: {
          commentId: penalty.commentId,
          userId: penalty.userId,
          adminId: penalty.adminId,
          penaltyScore: penalty.penaltyScore,
          action: penalty.action,
        },
        create: {
          id: penalty.id,
          commentId: penalty.commentId,
          userId: penalty.userId,
          adminId: penalty.adminId,
          penaltyScore: penalty.penaltyScore,
          action: penalty.action,
          createdAt: new Date(penalty.createdAt),
        },
      });
    }
    console.log('✅ Comment penalties seeded');
  }

  // Seed Bad Words
  if (exportedData?.badWords && exportedData.badWords.length > 0) {
    console.log(`📦 Seeding ${exportedData.badWords.length} bad words...`);
    for (const badWord of exportedData.badWords) {
      await prisma.bad_words.upsert({
        where: { id: badWord.id },
        update: {
          word: badWord.word,
          updatedAt: new Date(badWord.updatedAt),
        },
        create: {
          id: badWord.id,
          word: badWord.word,
          createdAt: new Date(badWord.createdAt),
          updatedAt: new Date(badWord.updatedAt),
        },
      });
    }
    console.log('✅ Bad words seeded');
  }

  // Seed Item Reports
  if (exportedData?.itemReports && exportedData.itemReports.length > 0) {
    console.log(`📦 Seeding ${exportedData.itemReports.length} item reports...`);
    for (const report of exportedData.itemReports) {
      await prisma.item_reports.upsert({
        where: { id: report.id },
        update: {
          itemId: report.itemId,
          userId: report.userId,
          reason: report.reason,
          description: report.description,
          resolved: report.resolved,
          penaltyScore: report.penaltyScore,
        },
        create: {
          id: report.id,
          itemId: report.itemId,
          userId: report.userId,
          reason: report.reason,
          description: report.description,
          resolved: report.resolved,
          penaltyScore: report.penaltyScore,
          createdAt: new Date(report.createdAt),
        },
      });
    }
    console.log('✅ Item reports seeded');
  }

  // Seed User Violations
  if (exportedData?.userViolations && exportedData.userViolations.length > 0) {
    console.log(`📦 Seeding ${exportedData.userViolations.length} user violations...`);
    for (const violation of exportedData.userViolations) {
      await prisma.user_violations.upsert({
        where: { id: violation.id },
        update: {
          userId: violation.userId,
          commentId: violation.commentId,
          violationType: violation.violationType,
          violationCount: violation.violationCount,
          lastViolationDate: new Date(violation.lastViolationDate),
          totalPenaltyScore: violation.totalPenaltyScore,
          updatedAt: new Date(violation.updatedAt),
        },
        create: {
          id: violation.id,
          userId: violation.userId,
          commentId: violation.commentId,
          violationType: violation.violationType,
          violationCount: violation.violationCount,
          lastViolationDate: new Date(violation.lastViolationDate),
          totalPenaltyScore: violation.totalPenaltyScore,
          createdAt: new Date(violation.createdAt),
          updatedAt: new Date(violation.updatedAt),
        },
      });
    }
    console.log('✅ User violations seeded');
  }

  // Seed Settings (only non-sensitive fields)
  if (exportedData?.settings && exportedData.settings.length > 0) {
    console.log(`📦 Seeding ${exportedData.settings.length} settings...`);
    for (const setting of exportedData.settings) {
      await prisma.settings.upsert({
        where: { id: setting.id },
        update: {
          liaraBucketName: setting.liaraBucketName,
          liaraEndpoint: setting.liaraEndpoint,
          googleSearchEngineId: setting.googleSearchEngineId,
          updatedAt: new Date(setting.updatedAt),
        },
        create: {
          id: setting.id,
          liaraBucketName: setting.liaraBucketName,
          liaraEndpoint: setting.liaraEndpoint,
          googleSearchEngineId: setting.googleSearchEngineId,
          createdAt: new Date(setting.createdAt),
          updatedAt: new Date(setting.updatedAt),
        },
      });
    }
    console.log('✅ Settings seeded (sensitive keys excluded)');
  }

  // Seed Comment Settings
  if (exportedData?.commentSettings && exportedData.commentSettings.length > 0) {
    console.log(`📦 Seeding ${exportedData.commentSettings.length} comment settings...`);
    for (const commentSetting of exportedData.commentSettings) {
      try {
        await prisma.comment_settings.upsert({
          where: { id: commentSetting.id },
          update: {
            defaultMaxComments: commentSetting.defaultMaxComments,
            defaultCommentsEnabled: commentSetting.defaultCommentsEnabled,
            maxCommentLength: commentSetting.maxCommentLength,
            rateLimitMinutes: commentSetting.rateLimitMinutes,
            globalRateLimitMinutes: commentSetting.globalRateLimitMinutes,
            updatedAt: new Date(commentSetting.updatedAt),
          },
          create: {
            id: commentSetting.id,
            defaultMaxComments: commentSetting.defaultMaxComments,
            defaultCommentsEnabled: commentSetting.defaultCommentsEnabled,
            maxCommentLength: commentSetting.maxCommentLength,
            rateLimitMinutes: commentSetting.rateLimitMinutes,
            globalRateLimitMinutes: commentSetting.globalRateLimitMinutes,
            createdAt: new Date(commentSetting.createdAt),
            updatedAt: new Date(commentSetting.updatedAt),
          },
        });
      } catch (error) {
        console.warn('⚠️  Could not seed comment_settings:', error);
      }
    }
    console.log('✅ Comment settings seeded');
  }

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
