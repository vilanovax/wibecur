import type { MetadataFact } from '@/lib/item-metadata-display';

type Props = {
  facts: MetadataFact[];
  className?: string;
  variant?: 'grid' | 'chips';
};

function FactChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex max-w-full items-baseline gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 wibe-caption leading-snug">
      <span className="shrink-0 font-medium text-foreground/55">{label}</span>
      <span className="min-w-0 font-semibold text-foreground">{value}</span>
    </span>
  );
}

export default function ItemMetadataFacts({ facts, className = '', variant = 'grid' }: Props) {
  if (facts.length === 0) return null;

  if (variant === 'chips') {
    return (
      <div className={`flex flex-wrap justify-start gap-1.5 ${className}`}>
        {facts.map((fact) => (
          <FactChip key={fact.key} label={fact.label} value={fact.value} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {facts.map((fact) => (
        <div
          key={fact.key}
          className={`flex items-start gap-2 rounded-xl px-2.5 py-2 ${
            fact.key === 'actors'
              ? 'col-span-2 bg-gray-50/90'
              : fact.key === 'imdbRating'
                ? 'bg-amber-50/80 ring-1 ring-amber-200/60'
                : 'bg-gray-50/90'
          }`}
        >
          <span className="mt-0.5 text-sm leading-none" aria-hidden>
            {fact.icon}
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="wibe-caption text-foreground/50">{fact.label}</p>
            <p className="mt-0.5 line-clamp-2 wibe-small font-semibold text-foreground leading-snug">
              {fact.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
