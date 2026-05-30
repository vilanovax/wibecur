interface HomeSectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
  id?: string;
}

/** عنوان یکسان بخش‌های Home — Wibe Design System */
export default function HomeSectionTitle({ title, subtitle, icon, id }: HomeSectionTitleProps) {
  return (
    <div className="px-4 mb-3" id={id}>
      <h2 className="wibe-h3 flex items-center gap-2">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="wibe-small text-wibe-secondary mt-0.5">{subtitle}</p> : null}
    </div>
  );
}
