'use client';

import PageBreadcrumb from '@/components/shared/PageBreadcrumb';

interface ProfileBreadcrumbProps {
  /** برچسب آخر — پیش‌فرض «پروفایل من» */
  currentLabel?: string;
  className?: string;
}

export default function ProfileBreadcrumb({
  currentLabel = 'پروفایل من',
  className = 'mb-3',
}: ProfileBreadcrumbProps) {
  return (
    <PageBreadcrumb
      className={className}
      items={[
        { label: 'خانه', href: '/' },
        { label: currentLabel },
      ]}
    />
  );
}
