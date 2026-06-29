import SectionIcon, { type SectionIconVariant } from '@/components/shared/SectionIcon';

interface CategorySectionTitleProps {
  title: string;
  subtitle?: string;
  /** @deprecated ترجیحاً iconVariant — emoji فقط برای fallback */
  icon?: string;
  iconVariant?: SectionIconVariant;
  id?: string;
  className?: string;
}

/** عنوان یکسان بخش‌های Category — Wibe Design System */
export default function CategorySectionTitle({
  title,
  subtitle,
  icon,
  iconVariant,
  id,
  className = '',
}: CategorySectionTitleProps) {
  return (
    <div className={`mb-3 ${className}`} id={id}>
      <h2 className="flex items-center gap-2 wibe-h3">
        {iconVariant ? <SectionIcon variant={iconVariant} /> : null}
        {!iconVariant && icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="mt-0.5 wibe-small text-wibe-secondary">{subtitle}</p> : null}
    </div>
  );
}
