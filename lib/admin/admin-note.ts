export const ADMIN_NOTE_MAX = 500;

export type ParsedAdminNote =
  | { ok: true; note: string | null }
  | { ok: false; error: string };

/** undefined یعنی فیلد در بدنه نبوده و نباید عوض شود. */
export function parseAdminNote(raw: unknown): ParsedAdminNote | null {
  if (raw === undefined) return null;
  if (raw === null) return { ok: true, note: null };
  if (typeof raw !== 'string') return { ok: false, error: 'توضیحات نامعتبر است' };

  const note = raw.trim();
  if (note.length > ADMIN_NOTE_MAX) {
    return { ok: false, error: 'توضیحات نباید بیشتر از ۵۰۰ نویسه باشد' };
  }
  return { ok: true, note: note || null };
}
