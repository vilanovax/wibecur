'use client';

import WibeEmptyState from '@/components/shared/WibeEmptyState';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
}

/** سازگاری با call-siteهای قدیمی — ظاهر از WibeEmptyState */
export default function EmptyState({
  icon = '✨',
  title,
  description,
  buttonText = 'کاوش کنید',
  buttonHref = '/lists',
}: EmptyStateProps) {
  return (
    <WibeEmptyState
      icon={icon}
      title={title}
      description={description}
      primaryAction={
        buttonHref
          ? {
              label: buttonText,
              href: buttonHref,
            }
          : undefined
      }
    />
  );
}
