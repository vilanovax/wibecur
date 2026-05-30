'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import SearchOverlay from '@/components/mobile/search/SearchOverlay';

export type SearchOpenOptions = {
  query?: string;
  applyLocally?: (query: string) => void;
  localActionLabel?: string;
};

type SearchContextValue = {
  openSearch: (options?: SearchOpenOptions) => void;
  closeSearch: () => void;
  isOpen: boolean;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayOptions, setOverlayOptions] = useState<SearchOpenOptions>({});

  const openSearch = useCallback((options?: SearchOpenOptions) => {
    setOverlayOptions(options ?? {});
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setOverlayOptions({});
  }, []);

  const value = useMemo(
    () => ({ openSearch, closeSearch, isOpen }),
    [openSearch, closeSearch, isOpen]
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchOverlay
        isOpen={isOpen}
        onClose={closeSearch}
        initialQuery={overlayOptions.query ?? ''}
        onApplyLocally={overlayOptions.applyLocally}
        localActionLabel={overlayOptions.localActionLabel}
      />
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return ctx;
}

export function useSearchOptional() {
  return useContext(SearchContext);
}
