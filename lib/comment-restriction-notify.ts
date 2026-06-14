import { createNotification } from '@/lib/utils/notifications';

type RestrictionKind = 'temporary' | 'permanent' | 'lifted';

function formatUntil(until: Date): string {
  return until.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** اعلان به کاربر هنگام محدود/رفع محدودیت کامنت */
export async function notifyCommentRestriction(
  userId: string,
  kind: RestrictionKind,
  options?: { until?: Date | null; reason?: string | null }
): Promise<void> {
  try {
    if (kind === 'lifted') {
      await createNotification(
        userId,
        'comment_unrestricted',
        'محدودیت کامنت برداشته شد',
        'اکنون می‌توانی دوباره کامنت بگذاری.',
        '/profile'
      );
      return;
    }

    if (kind === 'permanent') {
      await createNotification(
        userId,
        'comment_banned',
        'کامنت‌گذاری غیرفعال شد',
        options?.reason ||
          'به‌خاطر تخلفات مکرر، امکان ثبت کامنت برای حسابت غیرفعال شده است.',
        '/profile'
      );
      return;
    }

    const untilText =
      options?.until && options.until.getTime() < Date.parse('2090-01-01')
        ? ` تا ${formatUntil(options.until)}`
        : '';

    await createNotification(
      userId,
      'comment_restricted',
      'محدودیت موقت کامنت',
      options?.reason ||
        `به‌خاطر تخلف، فعلاً امکان ثبت کامنت نداری${untilText}.`,
      '/profile'
    );
  } catch (error) {
    console.error('Failed to notify comment restriction:', error);
  }
}
