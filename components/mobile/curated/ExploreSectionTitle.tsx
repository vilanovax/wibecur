interface ExploreSectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
  id?: string;
}

export default function ExploreSectionTitle({
  title,
  subtitle,
  icon,
  id,
}: ExploreSectionTitleProps) {
  return (
    <div className="mb-3 lg:mb-4" id={id}>
      <h2 className="flex items-center gap-2 wibe-h3 lg:text-xl">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="wibe-small text-wibe-secondary mt-0.5">{subtitle}</p> : null}
    </div>
  );
}
