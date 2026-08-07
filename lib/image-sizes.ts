/**
 * Shared next/image `sizes` for consumer surfaces.
 * Pass to ImageWithFallback / ItemCoverImage / LazyItemCoverImage when the
 * parent is `relative` + sized (aspect box or fixed w/h) so fill mode activates
 * and CLS stays reserved.
 */

export const IMAGE_SIZES = {
  /** Full-bleed hero / list detail mobile banner */
  heroBanner: '100vw',
  /** List detail desktop hero panel */
  listDetailHero: '(min-width: 1280px) 18rem, (min-width: 1024px) 17.5rem, 100vw',
  /** Home / explore horizontal trending carousel */
  trendingCarousel: '(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 78vw',
  /** 2–4 column list / rising / category grid covers */
  listGridCard: '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw',
  /** Category hub portrait carousel (~68vw / 240px) */
  hubPortraitCard: '(min-width: 1024px) 240px, 68vw',
  /** Home feed grid card */
  homeGridCard: '(min-width: 1024px) 240px, 160px',
  /** Guided discovery sheet cards */
  guidedCard: '(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, 72vw',
  /** Item discovery / similar poster strip */
  itemDiscovery: '(min-width: 1024px) 20vw, 42vw',
  /** Profile picks poster (~96px) */
  profilePick: '96px',
  /** Compact list / search / for-you row thumb */
  rowThumb: '80px',
  /** Rising / new compact square thumb */
  squareThumb: '64px',
  /** Mood inline thumb */
  inlineThumb: '40px',
  /** Search overlay result thumb */
  searchThumb: '56px',
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;
