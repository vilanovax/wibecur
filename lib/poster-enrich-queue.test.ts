import { describe, expect, it, vi } from 'vitest';
import {
  POSTER_ENRICH_MAX_CONCURRENT,
  resetPosterEnrichQueueForTests,
  runPosterEnrichTask,
} from './poster-enrich-queue';

describe('poster-enrich-queue', () => {
  it('limits concurrent poster tasks', async () => {
    resetPosterEnrichQueueForTests();
    let active = 0;
    let maxActive = 0;

    const tasks = Array.from({ length: 6 }, () =>
      runPosterEnrichTask(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 20));
        active -= 1;
      })
    );

    await Promise.all(tasks);
    expect(maxActive).toBeLessThanOrEqual(POSTER_ENRICH_MAX_CONCURRENT);
  });

  it('runs all queued tasks eventually', async () => {
    resetPosterEnrichQueueForTests();
    const spy = vi.fn();

    await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        runPosterEnrichTask(async () => {
          spy(i);
        })
      )
    );

    expect(spy).toHaveBeenCalledTimes(4);
  });
});
