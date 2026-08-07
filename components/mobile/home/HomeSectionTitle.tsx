'use client';

import WibeSection from '@/components/ui/WibeSection';
import type { SectionIconVariant } from '@/components/shared/SectionIcon';
import { trackHomeSectionClick, type HomeSectionId } from '@/lib/analytics';

interface HomeSectionTitleProps {
  title: string;
  subtitle?: string;
  /** @deprecated use iconVariant */
  icon?: string;
  iconVariant?: SectionIconVariant;
  id?: string;
  actionHref?: string;
  actionLabel?: string;
  /** برای analytics — کلیک «همه» */
  analyticsSection?: HomeSectionId;
}

/** عنوان یکسان بخش‌های Home — Wibe Design System */
export default function HomeSectionTitle({
  title,
  subtitle,
  icon,
  iconVariant,
  id,
  actionHref,
  actionLabel = 'همه',
  analyticsSection,
}: HomeSectionTitleProps) {
  return (
    <WibeSection
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconVariant={iconVariant}
      id={id}
      actionHref={actionHref}
      actionLabel={actionLabel}
      onActionClick={() => {
        if (analyticsSection) {
          trackHomeSectionClick(analyticsSection, { target: 'see_all' });
        }
      }}
    />
  );
}
