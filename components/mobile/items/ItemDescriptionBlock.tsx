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
      <p className="py-2 text-start text-xs text-muted-foreground">
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
      <h2 className="mb-2 wibe-small font-semibold text-foreground">درباره</h2>
      <p className="wibe-small leading-[1.85] text-foreground/80 whitespace-pre-line">
        {shortDescription}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-start gap-3">
        {canTruncate && (
          <button
            type="button"
            onClick={() => setDescriptionExpanded((v) => !v)}
            className="wibe-caption font-semibold text-primary transition-colors hover:text-primary-dark"
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
                ? 'inline-flex min-h-11 items-center gap-1.5 rounded-control bg-primary px-4 wibe-small font-semibold shadow-sm transition-colors hover:bg-primary-dark'
                : 'inline-flex min-h-11 items-center gap-1 wibe-caption font-medium'
            }
          >
            {isLightweight && entryKind === 'link' && (
              <ExternalLink className="h-4 w-4 text-primary-foreground" aria-hidden />
            )}
            <span className={isLightweight && entryKind === 'link' ? 'text-primary-foreground' : 'text-brand'}>
              {isLightweight && entryKind === 'link' ? 'باز کردن لینک' : 'منبع خارجی'}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
