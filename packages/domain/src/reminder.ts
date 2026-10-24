export type ReminderTime = { hour: number; minute: number };

const DAY = 24 * 60 * 60 * 1000;

// The next instant of each chosen weekday (0 = Sunday, as Date.getDay) at the reminder's
// local wall-clock time, strictly after now, in time order. A time already past (or at) now
// today moves today's instant to next week. Built with local Date setters, so the device
// timezone applies.
export function nextReminderTriggers(time: ReminderTime, weekdays: ReadonlySet<number>, now: Date): Date[] {
  const triggers: Date[] = [];
  for (let offset = 0; offset <= 7; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, time.hour, time.minute);
    if (d > now && weekdays.has(d.getDay()) && !triggers.some((t) => t.getDay() === d.getDay())) triggers.push(d);
  }
  return triggers;
}
