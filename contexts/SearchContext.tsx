'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import dynamic from 'next/dynamic';

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

/** ~1k LOC overlay — only load after first open (bundle-dynamic-imports). */
const SearchOverlay = dynamic(
  () => import('@/components/mobile/search/SearchOverlay'),
  { ssr: false }
);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [overlayOptions, setOverlayOptions] = useState<SearchOpenOptions>({});

  const openSearch = useCallback((options?: SearchOpenOptions) => {
    setOverlayOptions(options ?? {});
    setOverlayMounted(true);
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      e.preventDefault();
      openSearch();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      {overlayMounted ? (
        <SearchOverlay
          isOpen={isOpen}
          onClose={closeSearch}
          initialQuery={overlayOptions.query ?? ''}
          onApplyLocally={overlayOptions.applyLocally}
          localActionLabel={overlayOptions.localActionLabel}
        />
      ) : null}
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
