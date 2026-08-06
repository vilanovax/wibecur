'use client';

import { ListPlus } from 'lucide-react';
import WibeEmptyState from '@/components/shared/WibeEmptyState';

interface MyListsEmptyStateProps {
  message: string;
  showCreate?: boolean;
  onCreate?: () => void;
}

export default function MyListsEmptyState({
  message,
  showCreate = true,
  onCreate,
}: MyListsEmptyStateProps) {
  return (
    <WibeEmptyState
      className="lg:mx-auto lg:max-w-md"
      icon={<ListPlus strokeWidth={1.75} aria-hidden />}
      title={message}
      description="اولین لیستت را بساز و آیتم‌های مورد علاقه‌ات را جمع کن"
      primaryAction={
        showCreate
          ? onCreate
            ? { label: 'ایجاد لیست جدید', onClick: onCreate }
            : { label: 'ایجاد لیست جدید', href: '/explore?openCreate=1' }
          : undefined
      }
      secondaryAction={
        showCreate
          ? {
              label: 'الهام از لیست‌های دیگران',
              href: '/lists',
            }
          : undefined
      }
    />
  );
}
