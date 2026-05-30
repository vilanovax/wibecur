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
    <div className="mb-3" id={id}>
      <h2 className="wibe-h3 flex items-center gap-2">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="wibe-small text-wibe-secondary mt-0.5">{subtitle}</p> : null}
    </div>
  );
}
