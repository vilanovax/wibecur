export type {
  DiscoveryDimension,
  DiscoveryPlaceCard,
  DiscoveryTopicBrowseResult,
  DiscoveryTopicChip,
  DiscoveryTopicDefinition,
  ListTopicMatchLevel,
} from '@/lib/category-discovery/types';

export {
  CAFE_DISCOVERY_TOPICS,
  getCafeTopicBySlug,
  resolveCafeTopic,
} from '@/lib/category-discovery/cafe-catalog';

export {
  itemMatchesTopic,
  listTopicMatchLevel,
  extractItemDiscoveryFields,
  DISCOVERY_MATCH_THRESHOLDS,
} from '@/lib/category-discovery/match';

export {
  selectDiscoveryChips,
  DISCOVERY_CHIP_MAX,
  DISCOVERY_CHIP_MIN_PLACES,
  DISCOVERY_CHIP_MIN_STRONG_LISTS,
} from '@/lib/category-discovery/select-chips';

export {
  getCategoryDiscoveryChips,
  browseCategoryDiscoveryTopic,
} from '@/lib/category-discovery/from-db';

export { supportsCategoryDiscovery } from '@/lib/category-discovery/supports';

export {
  discoveryTopicResultsHref,
  resolveExactCafeDiscoveryTopic,
} from '@/lib/category-discovery/topic-search-route';

export {
  buildAreaFacets,
  extractPlaceAreaLabel,
} from '@/lib/category-discovery/place-area';
