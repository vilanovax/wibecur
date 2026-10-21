'use client';

import type { UserPulseSummary as UserPulseSummaryType } from '@/lib/admin/users-types';
import { fa, faNumber } from '@/lib/utils';

export default function UserPulseSummary({ data }: { data: UserPulseSummaryType }) {
  const active = data.activeUsers7d;
  const delta = data.activeUsers7dDelta;
  const sentence =
    active === 0
      ? 'در هفت روز گذشته کسی لیست ذخیره نکرده است.'
      : `در هفت روز گذشته ${faNumber(active)} نفر لیست ذخیره کرده‌اند.`;

  return (
    <p className="mb-4 text-sm text-[var(--color-text-muted)]">
      {sentence}
      {delta != null && (
        <span>
          {' '}
          {delta >= 0 ? '+' : ''}
          {fa(delta)}٪ نسبت به هفت روز قبل.
        </span>
      )}
    </p>
  );
}
