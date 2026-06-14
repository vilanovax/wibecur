'use client';

import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
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
      <div className="rounded-xl border border-wibe bg-wibe-card px-4 py-10 text-center">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-wibe-secondary/60" aria-hidden />
        <p className="wibe-body font-medium text-foreground">موقعیت مکانی ثبت نشده</p>
        <p className="mt-1 wibe-caption text-wibe-secondary">
          برای نمایش نقشه، آدرس یا لینک نقشه به آیتم‌ها اضافه کن
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-stretch">
      <div className="relative aspect-[4/3] min-h-[220px] bg-gray-100 lg:aspect-auto lg:min-h-[320px]">
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
          <div className="flex h-full items-center justify-center wibe-caption text-wibe-secondary">
            نقشه در دسترس نیست
          </div>
        )}
      </div>

      <div className="max-h-[280px] overflow-y-auto border-t border-wibe lg:max-h-none lg:border-t-0 lg:border-r">
        <p className="sticky top-0 z-10 border-b border-wibe/60 bg-wibe-card px-3 py-2 wibe-caption font-medium text-wibe-secondary">
          {mappableEntries.length.toLocaleString('fa-IR')} مکان
        </p>
        <ul className="divide-y divide-wibe/60">
          {mappableEntries.map(({ item, originalIndex }) => {
            const isSelected = item.id === (selectedEntry?.item.id ?? null);
            const address =
              typeof item.metadata?.address === 'string' ? item.metadata.address.trim() : null;
            const quickActions = buildListItemQuickActions(item.metadata, categorySlug);

            return (
              <li key={item.id}>
                <div
                  className={`flex items-stretch gap-2 px-2 py-2 transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="min-w-0 flex-1 text-right"
                  >
                    <span className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full wibe-caption font-semibold tabular-nums ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-wibe-secondary'
                        }`}
                      >
                        {(originalIndex + 1).toLocaleString('fa-IR')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 wibe-small font-semibold text-foreground">
                          {item.title}
                        </span>
                        {address && (
                          <span className="mt-0.5 line-clamp-2 wibe-caption text-wibe-secondary">
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
    </div>
  );
}
