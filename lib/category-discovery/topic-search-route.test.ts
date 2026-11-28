import { describe, expect, it } from 'vitest';
import {
  discoveryTopicResultsHref,
  resolveExactCafeDiscoveryTopic,
} from '@/lib/category-discovery/topic-search-route';

describe('resolveExactCafeDiscoveryTopic', () => {
  it('matches exact label and alias', () => {
    expect(resolveExactCafeDiscoveryTopic('سوخاری')?.slug).toBe('sokhari');
    expect(resolveExactCafeDiscoveryTopic('فضای باز')?.slug).toBe('outdoor');
    expect(resolveExactCafeDiscoveryTopic('sokhari')?.slug).toBe('sokhari');
  });

  it('does not soft-match longer queries', () => {
    expect(resolveExactCafeDiscoveryTopic('سوخاری امیرآباد')).toBeNull();
    expect(resolveExactCafeDiscoveryTopic('کافه روباز شمال')).toBeNull();
  });
});

describe('discoveryTopicResultsHref', () => {
  it('routes cafe exact topics to discover', () => {
    expect(discoveryTopicResultsHref('cafe', 'سوخاری')).toBe(
      '/categories/cafe/discover?topic=sokhari'
    );
  });

  it('skips non-cafe categories and non-topics', () => {
    expect(discoveryTopicResultsHref('movies', 'سوخاری')).toBeNull();
    expect(discoveryTopicResultsHref('cafe', 'ولیعصر')).toBeNull();
  });
});
