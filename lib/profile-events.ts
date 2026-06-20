export const LISTS_UPDATED_EVENT = 'lists-updated';
export const PROFILE_UPDATED_EVENT = 'profile-updated';
export const PROFILE_PICKS_UPDATED_EVENT = 'profile-picks-updated';

export type ListsUpdatedDetail = {
  listId?: string;
  title?: string;
};

export function dispatchListsUpdated(detail?: ListsUpdatedDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LISTS_UPDATED_EVENT, { detail }));
}

export function dispatchProfilePicksUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROFILE_PICKS_UPDATED_EVENT));
}
