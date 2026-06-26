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
  profileStatus: PersonProfileStatus | null;
};
