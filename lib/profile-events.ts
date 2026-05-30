export const LISTS_UPDATED_EVENT = 'lists-updated';
export const PROFILE_UPDATED_EVENT = 'profile-updated';

export type ListsUpdatedDetail = {
  listId?: string;
  title?: string;
};

export function dispatchListsUpdated(detail?: ListsUpdatedDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LISTS_UPDATED_EVENT, { detail }));
}
