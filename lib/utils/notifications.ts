import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  return dbQuery(() =>
    prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    })
  );
}

// Helper function for sending notifications to all users who bookmarked a list
export async function notifyListBookmarkers(
  listId: string,
  itemTitle: string,
  listTitle: string
) {
  try {
    // Get list slug for the link
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { slug: true },
      })
    );

    // Get all users who bookmarked this list
    const bookmarks = await dbQuery(() =>
      prisma.bookmarks.findMany({
        where: { listId },
        select: { userId: true },
      })
    );

    if (bookmarks.length === 0) {
      return;
    }

    // Send notification to each user
    const notifications = bookmarks.map((bookmark) =>
      createNotification(
        bookmark.userId,
        'list_item_added',
        'آیتم جدید به لیست اضافه شد',
        `آیتم جدید به لیست "${listTitle}" که دنبال می‌کنید اضافه شد: ${itemTitle}`,
        list ? `/lists/${list.slug}` : `/lists/${listId}`
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying list bookmarkers:', error);
    // Don't throw error - this is a background operation
  }
}

