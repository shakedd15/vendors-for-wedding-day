import { supabase } from "../lib/supabase";
import type { PhotographyEvent } from "../config/wedding";
import {
  fromEventRow,
  sortWeddingEvents,
  validateWeddingEvent,
  type WeddingEventDraft,
} from "../utils/weddingEvents";

export async function fetchWeddingEvents(): Promise<PhotographyEvent[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("wedding_events")
    .select("*")
    .order("start_time");
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return null;
    throw new Error("לא הצלחנו לעדכן את האירועים.");
  }
  return sortWeddingEvents(data.map(fromEventRow));
}
export async function saveWeddingEvent(
  original: PhotographyEvent | null,
  draft: WeddingEventDraft,
): Promise<PhotographyEvent> {
  if (!supabase) throw new Error("לא ניתן לשמור את האירוע כרגע.");
  const errors = validateWeddingEvent(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const payload = { ...draft, title: draft.title.trim() };
  if (!original) {
    const { data, error } = await supabase
      .from("wedding_events")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(eventSaveError(error.code));
    return fromEventRow(data);
  }
  let query = supabase
    .from("wedding_events")
    .update(payload)
    .eq("id", original.id)
    .eq("title", original.title)
    .eq("start_time", original.start);
  query =
    original.end === null
      ? query.is("end_time", null)
      : query.eq("end_time", original.end);
  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw new Error(eventSaveError(error.code));
  if (!data)
    throw new Error(
      "האירוע השתנה במכשיר אחר. סגרי את החלון, רענני ופתחי אותו שוב.",
    );
  return fromEventRow(data);
}
function eventSaveError(code: string): string {
  if (["42P01", "PGRST205"].includes(code))
    return "שמירת האירועים עדיין אינה זמינה.";
  if (code === "42501") return "אין כרגע הרשאה לשמור אירועים. פני למארגנת.";
  return "לא הצלחנו לשמור את האירוע. נסי שוב.";
}
