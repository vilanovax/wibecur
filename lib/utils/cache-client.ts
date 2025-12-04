/**
 * Client-side cache utility using localStorage
 * Used for caching API responses in the browser
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const CACHE_PREFIX = 'wibecur_cache_';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Get cache key from URL
 */
function getCacheKey(url: string, params?: Record<string, string>): string {
  const urlObj = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }
  return `${CACHE_PREFIX}${urlObj.pathname}${urlObj.search}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  const now = Date.now();
  return (now - entry.timestamp) < entry.ttl;
}

/**
 * Get data from cache
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (isCacheValid(entry)) {
      return entry.data;
    }

    // Remove expired cache
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set data in cache
 */
export function setCachedData<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If storage is full, try to clear old entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearExpiredCache();
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl,
        }));
      } catch (retryError) {
        console.error('Failed to cache after cleanup:', retryError);
      }
    }
  }
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          if (entry.timestamp && (now - entry.timestamp) >= entry.ttl) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache entries`);
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Clear all cache entries (useful for manual refresh)
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCacheKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache key:', error);
  }
}

/**
 * Fetch with cache
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  ttl: number = DEFAULT_TTL,
  params?: Record<string, string>
): Promise<T> {
  const cacheKey = getCacheKey(url, params);

  // Try to get from cache first
  const cached = getCachedData<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const fullUrl = params
    ? `${url}?${new URLSearchParams(params).toString()}`
    : url;
  
  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: T = await response.json();

  // Cache the response
  if (data) {
    setCachedData(cacheKey, data, ttl);
  }

  return data;
}

/**
 * Invalidate cache for a specific URL pattern
 */
export function invalidateCache(pattern: string): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

// Clean up expired cache on load
if (typeof window !== 'undefined') {
  clearExpiredCache();
  // Also clean up periodically (every hour)
  setInterval(clearExpiredCache, 60 * 60 * 1000);
}

