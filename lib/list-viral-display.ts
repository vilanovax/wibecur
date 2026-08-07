const VIRAL_SAVE_GOAL = 100;
const VIRAL_PROGRESS_MIN_SAVES = 10;

export function calcViralProgress(saveCount: number): number {
  return Math.min(100, (saveCount / VIRAL_SAVE_GOAL) * 100);
}

/** نوار پیشرفت وایرال فقط وقتی معنادار است — نه ۱٪ خالی */
export function shouldShowViralProgress(saveCount: number): boolean {
  return saveCount >= VIRAL_PROGRESS_MIN_SAVES && saveCount < VIRAL_SAVE_GOAL;
}
