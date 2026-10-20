import { afterEach, describe, expect, it, vi } from 'vitest';
import { bufferedViewCount, recordListView, resetListViewsForTests } from './list-view';

afterEach(() => {
  resetListViewsForTests();
  vi.useRealTimers();
});

describe('recordListView', () => {
  it('counts one view per list and address for thirty minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    expect(recordListView('list-1', '198.51.100.8')).toBe(true);
    expect(recordListView('list-1', '198.51.100.8')).toBe(false);
    expect(bufferedViewCount('list-1')).toBe(1);

    expect(recordListView('list-1', '198.51.100.9')).toBe(true);
    expect(bufferedViewCount('list-1')).toBe(2);

    expect(recordListView('list-2', '198.51.100.8')).toBe(true);
    expect(bufferedViewCount('list-2')).toBe(1);

    vi.setSystemTime(new Date('2026-01-01T00:30:00Z'));
    expect(recordListView('list-1', '198.51.100.8')).toBe(true);
    expect(bufferedViewCount('list-1')).toBe(3);
  });

  it('shares one bucket when the address is missing', () => {
    expect(recordListView('list-1', 'unknown')).toBe(true);
    expect(recordListView('list-1', '')).toBe(false);
    expect(bufferedViewCount('list-1')).toBe(1);
  });
});
