export const HOME_CREATE_SHEET_EVENT = 'wibe:open-create-sheet';

export function openHomeCreateSheet(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HOME_CREATE_SHEET_EVENT));
}
