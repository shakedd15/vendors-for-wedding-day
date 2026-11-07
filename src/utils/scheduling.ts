import { wedding } from "../config/wedding";
import type { Appointment } from "../types/database";
import type { BookingDraft, ValidationResult } from "../types/scheduling";
import { fromMinutes, hasTimes, overlaps, toMinutes } from "./time";

export function buildBookingDraft(
  appointment: Pick<Appointment, "status">,
  start_time: string | null,
  end_time: string | null,
  approvePending = false,
): BookingDraft {
  return {
    start_time,
    end_time,
    status:
      appointment.status === "pending_confirmation" && !approvePending
        ? "pending_confirmation"
        : start_time && end_time
          ? "confirmed"
          : "unscheduled",
  };
}

export function validateBooking(
  appointment: Appointment,
  draft: BookingDraft,
  all: Appointment[],
  buffer: number,
  approvePending: boolean,
): ValidationResult {
  const errors: string[] = [],
    warnings: string[] = [];
  if (
    appointment.status === "pending_confirmation" &&
    draft.status !== "pending_confirmation" &&
    !approvePending
  )
    errors.push("ההצטרפות לשירות עדיין ממתינה לאישור במסך הניהול.");
  if (draft.start_time === null && draft.end_time === null) {
    if (!["unscheduled", "pending_confirmation"].includes(draft.status))
      errors.push("בחרי שעת התחלה ומשך טיפול, או הסירי את השעה שנקבעה.");
    return { errors, warnings };
  }
  const start = toMinutes(draft.start_time),
    end = toMinutes(draft.end_time);
  if (
    start === null ||
    end === null ||
    end <= start ||
    start % 15 !== 0 ||
    end % 15 !== 0
  ) {
    errors.push("בחרי שעת התחלה ומשך חיובי בקפיצות של 15 דקות, בתוך אותו יום.");
    return { errors, warnings };
  }
  if (draft.status === "unscheduled")
    errors.push("השעות לא נשמרו כשיבוץ תקין. פתחי את התור ושמרי שוב.");
  const arrival = toMinutes(appointment.participant.arrival_time);
  if (arrival !== null && start < arrival)
    errors.push("השיבוץ מתחיל לפני שעת ההגעה.");
  let deadline = toMinutes(appointment.participant.ready_by);
  if (appointment.participant.name === wedding.bride) {
    const safeBuffer = Number.isFinite(buffer)
      ? Math.max(0, buffer)
      : wedding.defaultBuffer;
    deadline =
      Math.min(deadline ?? Infinity, toMinutes(wedding.readyBy)!) - safeBuffer;
  }
  if (deadline !== null && end > deadline)
    errors.push(
      appointment.participant.name === wedding.bride
        ? "השיבוץ חורג מהזמן שנותר לפני 14:15, כולל מרווח ההתארגנות."
        : "השיבוץ מסתיים אחרי השעה שבה צריך להיות מוכנה.",
    );
  for (const other of all) {
    if (other.id === appointment.id || !hasTimes(other)) continue;
    if (
      other.vendor_id !== appointment.vendor_id &&
      other.participant_id !== appointment.participant_id
    )
      continue;
    if (
      overlaps(
        start,
        end,
        toMinutes(other.start_time)!,
        toMinutes(other.end_time)!,
      )
    )
      errors.push(
        other.vendor_id === appointment.vendor_id
          ? `כבר יש לך שיבוץ עם ${other.participant.name} בשעה הזו.`
          : `ל${appointment.participant.name} כבר יש טיפול נוסף בשעה הזו.`,
      );
  }
  if (start < toMinutes(wedding.start)! || end > toMinutes(wedding.end)!)
    warnings.push(
      "השיבוץ מחוץ לשעות ההתארגנות 09:00–18:00. כדאי לתאם עם כולם.",
    );
  return { errors: [...new Set(errors)], warnings };
}

export function availableSlots(
  appointment: Appointment,
  all: Appointment[],
  duration: number,
  buffer: number,
): string[] {
  if (!Number.isFinite(duration) || duration <= 0 || duration % 15 !== 0)
    return [];
  const result: string[] = [];
  // Offer the entire day; preparation-window exceptions remain visible as warnings.
  for (let start = 0; start + duration < 24 * 60; start += 15) {
    const draft: BookingDraft = {
      start_time: fromMinutes(start),
      end_time: fromMinutes(start + duration),
      status:
        appointment.status === "pending_confirmation"
          ? "pending_confirmation"
          : "proposed",
    };
    if (!validateBooking(appointment, draft, all, buffer, false).errors.length)
      result.push(draft.start_time!);
  }
  return result;
}

export function sortAppointments(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort(
    (a, b) =>
      (toMinutes(a.start_time) ?? Infinity) -
        (toMinutes(b.start_time) ?? Infinity) ||
      a.participant.name.localeCompare(b.participant.name, "he"),
  );
}

export function scheduleIssues(
  all: Appointment[],
  buffer: number,
): { appointment: Appointment; messages: string[] }[] {
  return all.flatMap((appointment) => {
    const result = validateBooking(
      appointment,
      appointment,
      all,
      buffer,
      false,
    );
    const messages = [...result.errors, ...result.warnings];
    return messages.length ? [{ appointment, messages }] : [];
  });
}
