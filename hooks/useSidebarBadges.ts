'use client';

import { useEffect, useState } from 'react';

export type SidebarBadges = {
  commentsPending: number;
  commentReportsOpen: number;
  commentsAction: number;
  itemReportsOpen: number;
  suggestionsPending: number;
  trashTotal: number;
};

const EMPTY: SidebarBadges = {
  commentsPending: 0,
  commentReportsOpen: 0,
  commentsAction: 0,
  itemReportsOpen: 0,
  suggestionsPending: 0,
  trashTotal: 0,
};

export function useSidebarBadges(enabled = true) {
  const [badges, setBadges] = useState<SidebarBadges>(EMPTY);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = () => {
      fetch('/api/admin/sidebar-badges')
        .then((r) => r.json())
        .then((json) => {
          if (cancelled || !json.success || !json.data) return;
          setBadges(json.data);
        })
        .catch(() => {});
    };

    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [enabled]);

  return badges;
}
