'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

const DESCRIPTION_TRUNCATE = 180;

type ItemDescriptionBlockProps = {
  bodyText: string | null;
  externalUrl: string | null;
  isLightweight: boolean;
  entryKind: string;
};

export default function ItemDescriptionBlock({
  bodyText,
  externalUrl,
  isLightweight,
  entryKind,
}: ItemDescriptionBlockProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  if (!bodyText) {
    return (
      <p className="py-2 text-start wibe-caption text-wibe-secondary">
        هنوز توضیحی ثبت نشده
      </p>
    );
  }

  const canTruncate = bodyText.length > DESCRIPTION_TRUNCATE;
  const shortDescription =
    canTruncate && !descriptionExpanded
      ? bodyText.slice(0, DESCRIPTION_TRUNCATE) + '…'
      : bodyText;

  return (
    <div className="text-start">
      <h2 className="mb-2.5 wibe-h3 text-foreground">درباره</h2>
      <p className="wibe-body leading-relaxed text-foreground/85 whitespace-pre-line">
        {shortDescription}
      </p>
      <div className="mt-3.5 flex flex-wrap items-center justify-start gap-3">
        {canTruncate && (
          <button
            type="button"
            onClick={() => setDescriptionExpanded((v) => !v)}
            className="wibe-caption font-semibold text-primary transition-colors hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {descriptionExpanded ? 'کمتر' : 'بیشتر بخوان'}
          </button>
        )}
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isLightweight && entryKind === 'link'
                ? 'inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
                : 'inline-flex items-center gap-1 rounded-full border border-wibe bg-wibe-card px-3 py-1.5 wibe-caption font-semibold text-primary transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
            }
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {isLightweight && entryKind === 'link' ? 'باز کردن لینک' : 'منبع خارجی'}
          </a>
        )}
      </div>
    </div>
  );
}
