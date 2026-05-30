const MAX_CONCURRENT = 3;

let activeCount = 0;
const waitQueue: Array<() => void> = [];

function drainQueue() {
  while (activeCount < MAX_CONCURRENT && waitQueue.length > 0) {
    const next = waitQueue.shift();
    next?.();
  }
}

/** محدودیت همزمانی برای واکشی poster از API */
export function runPosterEnrichTask<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      activeCount += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          activeCount -= 1;
          drainQueue();
        });
    };

    if (activeCount < MAX_CONCURRENT) execute();
    else waitQueue.push(execute);
  });
}

export async function fetchItemPosterUrl(
  itemId: string,
  options?: { forceEnrich?: boolean }
): Promise<string | null> {
  const query = options?.forceEnrich ? '?enrich=1' : '';
  const res = await fetch(`/api/items/${itemId}/poster${query}`);
  const json = (await res.json()) as {
    success?: boolean;
    data?: { posterUrl?: string | null };
  };
  if (!json?.success || !json.data?.posterUrl) return null;
  return json.data.posterUrl;
}

/** برای تست */
export function resetPosterEnrichQueueForTests() {
  activeCount = 0;
  waitQueue.length = 0;
}

export const POSTER_ENRICH_MAX_CONCURRENT = MAX_CONCURRENT;
