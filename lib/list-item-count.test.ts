import { describe, expect, it } from 'vitest';
import { displayedItemCount } from './list-item-count';

describe('displayedItemCount', () => {
  it('uses the loaded rows when the first page is not full', () => {
    expect(displayedItemCount(10, 36, 24)).toBe(10);
    expect(displayedItemCount(0, 36, 15)).toBe(0);
  });

  it('uses the live total once the first page is full', () => {
    expect(displayedItemCount(36, 36, 40)).toBe(40);
    expect(displayedItemCount(36, 36, 36)).toBe(36);
  });
});
