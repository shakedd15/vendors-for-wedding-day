import { expect, it } from "vitest";
import type { Appointment } from "../types/database";
import { appointmentsInHour, scheduleTableHours } from "./scheduleTable";

const appointment: Appointment = {
  id: "a",
  vendor_id: "v",
  participant_id: "p",
  service_type: "hair",
  status: "proposed",
  start_time: "10:35:00",
  end_time: "12:00:00",
  vendor: { id: "v", name: "ספקית", service_type: "hair" },
  participant: { id: "p", name: "מתארגנת", arrival_time: null, ready_by: null },
};
it("shows long appointments in every covered hour and excludes the exclusive end", () => {
  expect(
    appointmentsInHour([appointment], "v", { start: 600, end: 660 }),
  ).toEqual([appointment]);
  expect(
    appointmentsInHour([appointment], "v", { start: 660, end: 720 }),
  ).toEqual([appointment]);
  expect(
    appointmentsInHour([appointment], "v", { start: 720, end: 780 }),
  ).toEqual([]);
  expect(
    appointmentsInHour([appointment], "other", { start: 600, end: 660 }),
  ).toEqual([]);
});
it("keeps exact five-minute appointments ordered within an hour and leaves unscheduled records out", () => {
  const first = {
    ...appointment,
    id: "first",
    start_time: "10:05",
    end_time: "10:35",
  };
  const missing = {
    ...appointment,
    id: "missing",
    start_time: null,
    end_time: null,
  };
  expect(
    appointmentsInHour([appointment, missing, first], "v", {
      start: 600,
      end: 660,
    }).map((a) => a.id),
  ).toEqual(["first", "a"]);
});
it("includes preparation hours and extends to include existing out-of-window records without inventing times", () => {
  expect(scheduleTableHours([])).toEqual([
    { start: 420, end: 480 },
    { start: 480, end: 540 },
    { start: 540, end: 600 },
    { start: 600, end: 660 },
    { start: 660, end: 720 },
    { start: 720, end: 780 },
    { start: 780, end: 840 },
    { start: 840, end: 900 },
    { start: 900, end: 960 },
    { start: 960, end: 1020 },
    { start: 1020, end: 1080 },
    { start: 1080, end: 1110 },
  ]);
  const hours = scheduleTableHours([
    { ...appointment, start_time: "06:35", end_time: "18:45" },
  ]);
  expect(hours[0]).toEqual({ start: 360, end: 420 });
  expect(hours.at(-1)).toEqual({ start: 1080, end: 1125 });
});
