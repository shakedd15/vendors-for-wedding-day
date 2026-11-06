import { supabase } from "../lib/supabase";
import type { Appointment, AppointmentRow } from "../types/database";
import type { BookingDraft } from "../types/scheduling";
import { validateBooking } from "../utils/scheduling";

function client() {
  if (!supabase) throw new Error("פרטי החיבור חסרים.");
  return supabase;
}
const relation =
  "*, participant:participants!participant_id(*), vendor:vendors!vendor_id(*)";

export async function fetchVendors() {
  const { data, error } = await client()
    .from("vendors")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}
export async function fetchParticipants() {
  const { data, error } = await client()
    .from("participants")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}
export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await client()
    .from("appointments")
    .select(relation)
    .returns<Appointment[]>();
  if (error) throw error;
  if (
    data.some(
      (a) =>
        !a.participant ||
        !a.vendor ||
        !["makeup", "hair"].includes(a.service_type) ||
        ![
          "unscheduled",
          "proposed",
          "confirmed",
          "pending_confirmation",
        ].includes(a.status),
    )
  )
    throw new Error("נתוני השיבוצים אינם זמינים במלואם.");
  return data;
}
export function sameVersion(a: AppointmentRow, b: AppointmentRow): boolean {
  return (
    a.start_time === b.start_time &&
    a.end_time === b.end_time &&
    a.status === b.status &&
    a.vendor_id === b.vendor_id &&
    a.participant_id === b.participant_id
  );
}
export async function updateAppointment(
  original: Appointment,
  draft: BookingDraft,
  buffer: number,
  approvePending: boolean,
): Promise<Appointment> {
  const latest = await fetchAppointments();
  const current = latest.find((a) => a.id === original.id);
  if (!current || !sameVersion(original, current))
    throw new Error(
      "השיבוץ השתנה במכשיר אחר. סגרי את החלון, רענני ופתחי אותו שוב.",
    );
  const validation = validateBooking(
    current,
    draft,
    latest,
    buffer,
    approvePending,
  );
  if (validation.errors.length) throw new Error(validation.errors.join(" "));
  // Compare all editable fields to avoid silently replacing a concurrent edit.
  let query = client()
    .from("appointments")
    .update({
      start_time: draft.start_time,
      end_time: draft.end_time,
      status: draft.status,
    })
    .eq("id", original.id)
    .eq("status", original.status)
    .eq("vendor_id", original.vendor_id)
    .eq("participant_id", original.participant_id);
  query =
    original.start_time === null
      ? query.is("start_time", null)
      : query.eq("start_time", original.start_time);
  query =
    original.end_time === null
      ? query.is("end_time", null)
      : query.eq("end_time", original.end_time);
  const { data, error } = await query
    .select(relation)
    .returns<Appointment[]>()
    .maybeSingle();
  if (error) throw new Error(saveError(error));
  if (!data)
    throw new Error("השיבוץ השתנה או שאין הרשאה לשמור אותו. רענני ובדקי שוב.");
  return data;
}
export async function updateAppointmentTimes(
  original: Appointment,
  draft: BookingDraft,
  buffer: number,
  approvePending = false,
) {
  return updateAppointment(original, draft, buffer, approvePending);
}
export async function updateAppointmentStatus(
  original: Appointment,
  status: Appointment["status"],
  buffer: number,
  approvePending = false,
) {
  return updateAppointment(
    original,
    { start_time: original.start_time, end_time: original.end_time, status },
    buffer,
    approvePending,
  );
}
export function saveError(error: { code?: string }): string {
  if (["23P01", "23505"].includes(error.code || ""))
    return "אופס! השעה הזו כבר נתפסה. בחרי שעה אחרת.";
  if (error.code === "23514")
    return "השיבוץ לא עומד בכללי התכנון. בדקי את השעות והסטטוס.";
  if (error.code === "42501")
    return "אין הרשאה לשמור את השינוי. בדקי את הגדרות החיבור.";
  return "לא הצלחנו לשמור את השיבוץ. נסי שוב.";
}
