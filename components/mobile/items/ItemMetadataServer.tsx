import { Heart, Bookmark } from 'lucide-react';
import ItemMetadataFacts from '@/components/shared/ItemMetadataFacts';
import ItemTipCard from '@/components/shared/ItemTipCard';
import ItemDescriptionBlock from '@/components/mobile/items/ItemDescriptionBlock';
import {
  buildItemMetadataFacts,
  buildLightweightDisplayBody,
  extractItemTip,
  parseTipAsMetadataFact,
} from '@/lib/item-metadata-display';
import {
  isLifestyleCategory,
  isLightweightListItem,
  resolveEntryKind,
  sourceCategorySlugFromItem,
} from '@/lib/list-entry';
import type { ItemHeroServerItem } from '@/components/mobile/items/ItemHeroServer';

export type ItemMetadataServerItem = ItemHeroServerItem & {
  description: string | null;
  listNote?: string | null;
  externalUrl: string | null;
  personalSaveCount: number;
};

type ItemMetadataServerProps = {
  item: ItemMetadataServerItem;
};

export default function ItemMetadataServer({ item }: ItemMetadataServerProps) {
  const listCategorySlug = item.lists.categories?.slug ?? null;
  const itemCategorySlug =
    sourceCategorySlugFromItem({
      metadata: item.metadata,
      catalogItemId: item.catalogItemId,
    }) ?? listCategorySlug;
  const isLightweight = isLightweightListItem(item);
  const isLifestyle = isLifestyleCategory(listCategorySlug);
  const entryKind = resolveEntryKind(item);
  const meta = (item.metadata || {}) as Record<string, string | number>;
  const likeCount = item.voteCount ?? 0;

  const baseMetadataFacts = isLightweight
    ? []
    : buildItemMetadataFacts(item.metadata, itemCategorySlug, {
        fallbackImdbRating: meta.imdbRating ?? item.rating,
      });
  const itemTip = extractItemTip(item.metadata);
  const tipAsFact = parseTipAsMetadataFact(itemTip);
  const displayMetadataFacts = (tipAsFact
    ? baseMetadataFacts.some((f) => f.key === 'translator')
      ? baseMetadataFacts
      : [...baseMetadataFacts, tipAsFact]
    : baseMetadataFacts
  ).filter((f) => f.key !== 'imdbRating');

  const displayTip = tipAsFact ? null : itemTip;
  const listNote = item.listNote?.trim() || null;
  const bodyText = isLightweight
    ? buildLightweightDisplayBody(item, { lifestyleMode: isLifestyle }) || null
    : item.description?.trim() || null;

  const hasSocialProof = likeCount > 0 || item.personalSaveCount > 0;

  return (
    <section className="space-y-4 lg:rounded-2xl lg:border lg:border-wibe/60 lg:bg-wibe-card lg:p-5 lg:shadow-sm">
      {hasSocialProof && (
        <div className="flex flex-wrap justify-start gap-1.5 lg:hidden">
          {likeCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
              <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden />
              {likeCount.toLocaleString('fa-IR')} پسند
            </span>
          )}
          {item.personalSaveCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
              <Bookmark className="h-3.5 w-3.5 text-primary" aria-hidden />
              {item.personalSaveCount.toLocaleString('fa-IR')} ذخیره
            </span>
          )}
        </div>
      )}

      {displayMetadataFacts.length > 0 && (
        <>
          <div className="lg:hidden">
            <ItemMetadataFacts facts={displayMetadataFacts} variant="chips" />
          </div>
          <div className="hidden lg:block">
            <ItemMetadataFacts facts={displayMetadataFacts} variant="grid" />
          </div>
        </>
      )}

      {displayTip && !isLightweight && (
        <ItemTipCard tip={displayTip} variant="highlight" />
      )}
      {listNote && listNote !== bodyText && !(isLightweight && isLifestyle) && (
        <ItemTipCard tip={listNote} variant="note" />
      )}

      <ItemDescriptionBlock
        bodyText={bodyText}
        externalUrl={item.externalUrl}
        isLightweight={isLightweight}
        entryKind={entryKind}
      />
    </section>
  );
}
