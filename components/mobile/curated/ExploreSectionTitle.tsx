import SectionIcon, { type SectionIconVariant } from '@/components/shared/SectionIcon';

interface ExploreSectionTitleProps {
  title: string;
  subtitle?: string;
  /** @deprecated use iconVariant */
  icon?: string;
  iconVariant?: SectionIconVariant;
  id?: string;
}

export default function ExploreSectionTitle({
  title,
  subtitle,
  icon,
  iconVariant,
  id,
}: ExploreSectionTitleProps) {
  return (
    <div className="mb-3.5 lg:mb-4" id={id}>
      <h2 className="flex items-center gap-2 wibe-h3 text-foreground">
        {iconVariant ? <SectionIcon variant={iconVariant} /> : null}
        {!iconVariant && icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="mt-1 wibe-caption text-wibe-secondary lg:wibe-small">{subtitle}</p> : null}
    </div>
  );
}
