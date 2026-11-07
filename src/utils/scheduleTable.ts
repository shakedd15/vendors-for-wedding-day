import { wedding } from "../config/wedding";
import type { Appointment } from "../types/database";
import { hasTimes, overlaps, toMinutes } from "./time";
import { sortAppointments } from "./scheduling";

export interface HourRow {
  start: number;
  end: number;
}
export function scheduleTableHours(
  appointments: readonly Appointment[],
): HourRow[] {
  const timed = appointments.filter(hasTimes);
  const start =
    Math.floor(
      Math.min(
        toMinutes(wedding.start)!,
        ...timed.map((a) => toMinutes(a.start_time)!),
      ) / 60,
    ) * 60;
  const end = Math.max(
    toMinutes(wedding.end)!,
    ...timed.map((a) => toMinutes(a.end_time)!),
  );
  return Array.from({ length: Math.ceil((end - start) / 60) }, (_, index) => ({
    start: start + index * 60,
    end: Math.min(start + (index + 1) * 60, end),
  }));
}
export function appointmentsInHour(
  appointments: readonly Appointment[],
  vendorId: string,
  row: HourRow,
): Appointment[] {
  return sortAppointments(
    appointments.filter(
      (a) =>
        a.vendor_id === vendorId &&
        hasTimes(a) &&
        overlaps(
          toMinutes(a.start_time)!,
          toMinutes(a.end_time)!,
          row.start,
          row.end,
        ),
    ),
  );
}
