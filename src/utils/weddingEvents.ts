import { wedding, type PhotographyEvent } from "../config/wedding";
import type { WeddingEventRow } from "../types/database";
import { toMinutes } from "./time";

export type WeddingEventDraft = Pick<
  WeddingEventRow,
  "title" | "start_time" | "end_time"
>;
export function validateWeddingEvent(draft: WeddingEventDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("יש להזין שם לאירוע.");
  const start = toMinutes(draft.start_time),
    end = toMinutes(draft.end_time);
  if (start === null || start % wedding.slotMinutes !== 0)
    errors.push("בחרי שעת התחלה בקפיצות של 5 דקות.");
  if (
    draft.end_time !== null &&
    (end === null ||
      end % wedding.slotMinutes !== 0 ||
      (start !== null && end <= start))
  )
    errors.push("שעת הסיום צריכה להיות אחרי שעת ההתחלה, בקפיצות של 5 דקות.");
  return errors;
}
export function fromEventRow(row: WeddingEventRow): PhotographyEvent {
  return {
    id: row.id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
  };
}
export function sortWeddingEvents(
  events: readonly PhotographyEvent[],
): PhotographyEvent[] {
  return [...events].sort(
    (a, b) =>
      (toMinutes(a.start) ?? Infinity) - (toMinutes(b.start) ?? Infinity) ||
      a.title.localeCompare(b.title, "he"),
  );
}
