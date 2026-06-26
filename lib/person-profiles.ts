import type { PersonRole } from '@/lib/people';

export type PersonProfileStatus = 'draft' | 'published';

export type PersonProfileRecord = {
  id: string;
  role: PersonRole;
  slug: string;
  displayName: string;
  bio: string | null;
  imageUrl: string | null;
  tmdbId: number | null;
  externalUrl: string | null;
  status: PersonProfileStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type DiscoveredPerson = {
  role: PersonRole;
  slug: string;
  displayName: string;
  itemCount: number;
  hasProfile: boolean;
  hasBio: boolean;
  profileStatus: PersonProfileStatus | null;
};

export type DiscoverPeopleStats = {
  total: number;
  withBio: number;
  withProfile: number;
  missingBio: number;
};

export type DiscoverPeoplePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DiscoverPeopleResult = {
  people: DiscoveredPerson[];
  stats: DiscoverPeopleStats;
  pagination: DiscoverPeoplePagination;
};
