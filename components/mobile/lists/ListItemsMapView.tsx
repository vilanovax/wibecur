'use client';

import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ListItemQuickActions from '@/components/mobile/lists/ListItemQuickActions';
import {
  buildListItemQuickActions,
  mapsUrlToEmbedUrl,
  resolveItemMapsUrl,
} from '@/lib/list-item-quick-actions';

type MapViewItem = {
  id: string;
  title: string;
  metadata?: Record<string, unknown> | null;
};

type MapViewEntry = {
  item: MapViewItem;
  originalIndex: number;
};

interface ListItemsMapViewProps {
  entries: MapViewEntry[];
  categorySlug?: string | null;
}

export default function ListItemsMapView({
  entries,
  categorySlug,
}: ListItemsMapViewProps) {
  const mappableEntries = useMemo(
    () =>
      entries.filter(({ item }) =>
        Boolean(resolveItemMapsUrl(item.metadata))
      ),
    [entries]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    () => mappableEntries[0]?.item.id ?? null
  );

  const selectedEntry =
    mappableEntries.find(({ item }) => item.id === selectedId) ?? mappableEntries[0] ?? null;

  const embedUrl = useMemo(() => {
    if (!selectedEntry) return null;
    const mapsUrl = resolveItemMapsUrl(selectedEntry.item.metadata);
    return mapsUrl ? mapsUrlToEmbedUrl(mapsUrl) : null;
  }, [selectedEntry]);

  if (mappableEntries.length === 0) {
    return (
      <Card className="bg-popover px-4 py-10 text-center">
        <MapPin className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden />
        <p className="text-base font-medium text-foreground">موقعیت مکانی ثبت نشده</p>
        <p className="mt-1 text-sm text-muted-foreground">
          برای نمایش نقشه، آدرس یا لینک نقشه به آیتم‌ها اضافه کن
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-popover p-0 lg:grid lg:grid-cols-4 lg:items-stretch">
      <div className="relative aspect-[4/3] min-h-56 bg-muted lg:col-span-3 lg:aspect-auto lg:min-h-80">
        {embedUrl ? (
          <iframe
            title={`نقشه — ${selectedEntry?.item.title ?? ''}`}
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center wibe-caption text-muted-foreground">
            نقشه در دسترس نیست
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto border-t border-border lg:max-h-none lg:border-s lg:border-t-0">
        <p className="sticky top-0 z-10 border-b border-border bg-popover px-3 py-2 text-sm font-medium text-muted-foreground">
          {mappableEntries.length.toLocaleString('fa-IR')} مکان
        </p>
        <ul className="divide-y divide-border">
          {mappableEntries.map(({ item, originalIndex }) => {
            const isSelected = item.id === (selectedEntry?.item.id ?? null);
            const address =
              typeof item.metadata?.address === 'string' ? item.metadata.address.trim() : null;
            const quickActions = buildListItemQuickActions(item.metadata, categorySlug);

            return (
              <li key={item.id}>
                <div
                  className={`flex items-stretch gap-2 px-2 py-1 ${
                    isSelected ? 'bg-brand/5' : 'hover:bg-muted'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="min-h-12 min-w-0 flex-1 text-start"
                  >
                    <span className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isSelected
                            ? 'bg-brand text-brand-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {(originalIndex + 1).toLocaleString('fa-IR')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 wibe-small font-semibold text-foreground">
                          {item.title}
                        </span>
                        {address && (
                          <span className="mt-0.5 line-clamp-2 wibe-caption text-muted-foreground">
                            {address}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  {quickActions.length > 0 && (
                    <div className="flex shrink-0 items-center">
                      <ListItemQuickActions actions={quickActions} layout="vertical" size="sm" />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
