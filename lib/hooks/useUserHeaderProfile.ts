'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type UserHeaderProfile = {
  image: string | null;
  avatarType: string | null;
  avatarId: string | null;
  avatarStatus: string | null;
};

export const USER_HEADER_PROFILE_KEY = ['user', 'header-profile'] as const;

async function fetchUserHeaderProfile(): Promise<UserHeaderProfile | null> {
  const res = await fetch('/api/user/profile');
  const data = await res.json();
  if (!data?.success || !data?.data?.user) return null;
  const u = data.data.user;
  return {
    image: u.image ?? null,
    avatarType: u.avatarType ?? null,
    avatarId: u.avatarId ?? null,
    avatarStatus: u.avatarStatus ?? null,
  };
}

/** Shared RQ key for Header + DesktopTopNav avatar (client-swr-dedup). */
export function useUserHeaderProfile() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...USER_HEADER_PROFILE_KEY, userId ?? 'anon'],
    queryFn: fetchUserHeaderProfile,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const onProfileUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: USER_HEADER_PROFILE_KEY });
    };
    window.addEventListener('profile-updated', onProfileUpdated);
    return () => window.removeEventListener('profile-updated', onProfileUpdated);
  }, [queryClient]);

  return {
    session,
    profile: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
