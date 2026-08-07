import Link from 'next/link';
import type { MetadataFact } from '@/lib/item-metadata-display';

type Props = {
  facts: MetadataFact[];
  className?: string;
  variant?: 'grid' | 'chips';
};

function isInternalHref(href: string): boolean {
  return href.startsWith('/');
}

function factCellClass(key: string): string {
  if (key === 'author' || key === 'translator') {
    return 'col-span-2 bg-primary/5 ring-1 ring-primary/10';
  }
  if (key === 'actors') return 'col-span-2 bg-gray-50/90';
  if (key === 'imdbRating') return 'bg-amber-50/80 ring-1 ring-amber-200/60';
  return 'bg-gray-50/90';
}

function FactValueLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    'min-w-0 font-semibold text-primary hover:underline';

  if (isInternalHref(href)) {
    return (
      <Link href={href} className={`line-clamp-2 block wibe-small leading-snug ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith('tel:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      className={`line-clamp-2 block wibe-small leading-snug ${className}`}
    >
      {children}
    </a>
  );
}

function ProfileLinksRow({ links }: { links: NonNullable<MetadataFact['profileLinks']> }) {
  return (
    <p className="mt-0.5 wibe-small font-semibold leading-snug text-foreground">
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? <span className="text-foreground/40"> · </span> : null}
          <Link href={link.href} className="text-primary hover:underline">
            {link.name}
          </Link>
        </span>
      ))}
    </p>
  );
}

function FactChip({
  label,
  value,
  prominent,
  href,
  profileLinks,
}: {
  label: string;
  value: string;
  prominent?: boolean;
  href?: string;
  profileLinks?: MetadataFact['profileLinks'];
}) {
  const className = `inline-flex max-w-full items-baseline gap-1 rounded-lg px-2.5 py-1.5 wibe-caption leading-snug ${
    prominent ? 'bg-primary/8 ring-1 ring-primary/10' : 'bg-gray-100'
  }`;

  if (profileLinks?.length) {
    return (
      <span className={className}>
        <span className="shrink-0 font-medium text-foreground/55">{label}</span>
        <span className="min-w-0 font-semibold text-foreground">
          {profileLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? <span className="text-foreground/40"> · </span> : null}
              <Link href={link.href} className="text-primary hover:underline">
                {link.name}
              </Link>
            </span>
          ))}
        </span>
      </span>
    );
  }

  const content = (
    <>
      <span className="shrink-0 font-medium text-foreground/55">{label}</span>
      <span className={`min-w-0 font-semibold ${href ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </>
  );

  if (href) {
    if (isInternalHref(href)) {
      return (
        <Link href={href} className={className}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} target={href.startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}

export default function ItemMetadataFacts({ facts, className = '', variant = 'grid' }: Props) {
  if (facts.length === 0) return null;

  if (variant === 'chips') {
    return (
      <div className={`flex flex-wrap justify-start gap-1.5 ${className}`}>
        {facts.map((fact) => (
          <FactChip
            key={fact.key}
            label={fact.label}
            value={fact.value}
            href={fact.href}
            profileLinks={fact.profileLinks}
            prominent={fact.key === 'author' || fact.key === 'translator'}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {facts.map((fact) => (
        <div
          key={fact.key}
          className={`flex items-start gap-2 rounded-xl px-2.5 py-2 ${factCellClass(fact.key)}`}
        >
          <span className="mt-0.5 text-sm leading-none" aria-hidden>
            {fact.icon}
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="wibe-caption text-foreground/50">{fact.label}</p>
            {fact.profileLinks?.length ? (
              <ProfileLinksRow links={fact.profileLinks} />
            ) : fact.href ? (
              <FactValueLink href={fact.href}>{fact.value}</FactValueLink>
            ) : (
              <p className="mt-0.5 line-clamp-2 wibe-small font-semibold text-foreground leading-snug">
                {fact.value}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
