import type { ActivityLog } from "./types";
import { addDays, dateKey } from "./date";

export function isDayActive(activity: ActivityLog, key: string): boolean {
  const day = activity[key];
  if (!day) return false;
  return day.steps > 0 || day.workoutDone || day.waterGlasses > 0;
}

/**
 * Consecutive active days ending today. If today has no activity yet the
 * streak is not broken — it counts back from yesterday.
 */
export function currentStreak(activity: ActivityLog, now: Date = new Date()): number {
  let streak = 0;
  let cursor = new Date(now);
  if (!isDayActive(activity, dateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (isDayActive(activity, dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(activity: ActivityLog, now: Date = new Date()): number {
  const keys = Object.keys(activity)
    .filter((k) => isDayActive(activity, k))
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    const [y, m, d] = key.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    if (prev && dateKey(addDays(prev, 1)) === key) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export function activeDaysThisMonth(activity: ActivityLog, now: Date = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth();
  let count = 0;
  for (const key of Object.keys(activity)) {
    const [ky, km] = key.split("-").map(Number);
    if (ky === y && km - 1 === m && isDayActive(activity, key)) count += 1;
  }
  return count;
}
