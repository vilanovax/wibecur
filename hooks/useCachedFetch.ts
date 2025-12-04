import { useState, useEffect, useCallback } from 'react';
import { fetchWithCache, invalidateCache } from '@/lib/utils/cache-client';

interface UseCachedFetchOptions {
  ttl?: number; // Time to live in milliseconds
  params?: Record<string, string>;
  enabled?: boolean; // Whether to fetch immediately
}

interface UseCachedFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Custom hook for fetching data with automatic caching
 */
export function useCachedFetch<T>(
  url: string,
  options?: UseCachedFetchOptions
): UseCachedFetchResult<T> {
  const { ttl = 30 * 60 * 1000, params, enabled = true } = options || {};
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithCache<T>(url, {}, ttl, params);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [url, ttl, params]);

  const invalidate = useCallback(() => {
    invalidateCache(url);
    setData(null);
  }, [url]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidate,
  };
}

