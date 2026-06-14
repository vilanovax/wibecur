'use client';

import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';

interface PublicProfileBreadcrumbProps {
  username: string;
  displayName?: string | null;
  className?: string;
}

export default function PublicProfileBreadcrumb({
  username,
  displayName,
  className = 'px-4 pt-2 lg:px-0',
}: PublicProfileBreadcrumbProps) {
  const handle = `@${username}`;
  const currentLabel = displayName?.trim() ? `${displayName.trim()} (${handle})` : handle;

  const items = [
    { label: 'خانه', href: '/' },
    { label: 'رتبه‌بندی', href: '/leaderboard' },
    { label: currentLabel },
  ];

  return (
    <div className={className}>
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(items)} />
      <PageBreadcrumb items={items} />
    </div>
  );
}
