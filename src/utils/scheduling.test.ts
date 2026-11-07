import { describe, expect, it } from "vitest";
import type { Appointment } from "../types/database";
import {
  availableSlots,
  buildBookingDraft,
  validateBooking,
} from "./scheduling";
import { overlaps, toMinutes } from "./time";

const base: Appointment = {
  id: "a",
  participant_id: "p",
  vendor_id: "v",
  service_type: "makeup",
  start_time: null,
  end_time: null,
  status: "unscheduled",
  participant: {
    id: "p",
    name: "חני",
    arrival_time: "13:30:00",
    ready_by: "18:00:00",
  },
  vendor: { id: "v", name: "מאפרת", service_type: "makeup" },
};
const draft = {
  start_time: "13:30",
  end_time: "14:15",
  status: "proposed" as const,
};
describe("automatic booking state", () => {
  it("saves a regular appointment without a separate confirmation choice", () => {
    expect(buildBookingDraft(base, "13:30", "14:15")).toEqual({
      start_time: "13:30",
      end_time: "14:15",
      status: "confirmed",
    });
  });
  it("keeps a pending service unapproved when its time is saved or cleared", () => {
    const pending = { ...base, status: "pending_confirmation" as const };
    expect(buildBookingDraft(pending, "14:00", "15:00").status).toBe(
      "pending_confirmation",
    );
    expect(buildBookingDraft(pending, null, null).status).toBe(
      "pending_confirmation",
    );
  });
  it("applies an explicit service approval to a timed or still-unscheduled appointment", () => {
    const pending = { ...base, status: "pending_confirmation" as const };
    expect(buildBookingDraft(pending, "14:00", "15:00", true).status).toBe(
      "confirmed",
    );
    expect(buildBookingDraft(pending, null, null, true).status).toBe(
      "unscheduled",
    );
  });
  it("clears an existing regular appointment without removing its service", () => {
    expect(
      buildBookingDraft({ ...base, status: "confirmed" }, null, null),
    ).toEqual({ start_time: null, end_time: null, status: "unscheduled" });
  });
});
describe("time boundaries", () => {
  it("allows consecutive appointments", () =>
    expect(overlaps(600, 660, 660, 720)).toBe(false));
  it("rejects malformed or out of day times", () => {
    for (const time of ["24:00", "12:60", "12:00:60", "", "9:00"])
      expect(toMinutes(time)).toBeNull();
    expect(toMinutes("13:30:00")).toBe(810);
  });
});
describe("booking validation", () => {
  it("accepts start times and durations in five-minute increments", () => {
    expect(
      validateBooking(
        base,
        { ...draft, start_time: "13:35", end_time: "14:10" },
        [],
        15,
        false,
      ).errors,
    ).toEqual([]);
    expect(
      validateBooking(
        base,
        { ...draft, start_time: "13:40", end_time: "13:45" },
        [],
        15,
        false,
      ).errors,
    ).toEqual([]);
  });
  it("accepts arrival and deadline equality", () =>
    expect(
      validateBooking(base, { ...draft, end_time: "18:00" }, [], 15, false)
        .errors,
    ).toEqual([]));
  it("rejects arrival and deadline violations", () => {
    expect(
      validateBooking(base, { ...draft, start_time: "13:15" }, [], 15, false)
        .errors,
    ).toHaveLength(1);
    expect(
      validateBooking(base, { ...draft, end_time: "18:15" }, [], 15, false)
        .errors,
    ).toHaveLength(1);
  });
  it("blocks proposed vendor and participant overlaps but ignores the current appointment", () => {
    const other = {
      ...base,
      ...draft,
      id: "b",
      participant_id: "q",
      status: "proposed" as const,
    };
    expect(
      validateBooking(base, draft, [other], 15, false).errors,
    ).toHaveLength(1);
    expect(
      validateBooking(
        base,
        draft,
        [{ ...other, vendor_id: "other", participant_id: "p" }],
        15,
        false,
      ).errors,
    ).toHaveLength(1);
    expect(
      validateBooking(base, draft, [{ ...base, ...draft }], 15, false).errors,
    ).toEqual([]);
  });
  it("applies the adjustable bride buffer with a hard 14:15 deadline", () => {
    const bride = {
      ...base,
      participant: {
        ...base.participant,
        name: "שקד",
        arrival_time: null,
        ready_by: "14:15",
      },
    };
    expect(validateBooking(bride, draft, [], 15, false).errors).toHaveLength(1);
    expect(validateBooking(bride, draft, [], 0, false).errors).toEqual([]);
    expect(
      validateBooking(bride, { ...draft, end_time: "14:30" }, [], 0, false)
        .errors,
    ).toHaveLength(1);
  });
  it("keeps pending services pending until management explicitly approves", () => {
    const pending = { ...base, status: "pending_confirmation" as const };
    expect(
      validateBooking(pending, { ...draft, status: "confirmed" }, [], 15, false)
        .errors,
    ).toHaveLength(1);
    expect(
      validateBooking(pending, { ...draft, status: "confirmed" }, [], 15, true)
        .errors,
    ).toEqual([]);
    expect(
      validateBooking(pending, { ...draft, status: "proposed" }, [], 15, false)
        .errors,
    ).toHaveLength(1);
  });
  it("requires complete, positive, five-minute intervals", () => {
    for (const end_time of [null, "13:30", "13:15", "13:47"])
      expect(
        validateBooking(base, { ...draft, end_time }, [], 15, false).errors
          .length,
      ).toBeGreaterThan(0);
    expect(
      validateBooking(base, { ...draft, start_time: "13:30:30" }, [], 15, false)
        .errors.length,
    ).toBeGreaterThan(0);
  });
  it("requires unscheduled appointments to have no reserved times", () =>
    expect(
      validateBooking(base, { ...draft, status: "unscheduled" }, [], 15, false)
        .errors.length,
    ).toBeGreaterThan(0));
  it("allows clearing times without approving a pending service", () =>
    expect(
      validateBooking(
        { ...base, status: "pending_confirmation" },
        { start_time: null, end_time: null, status: "pending_confirmation" },
        [],
        15,
        false,
      ).errors,
    ).toEqual([]));
  it("warns outside preparation hours without inventing a morning arrival", () => {
    const morning = {
      ...base,
      participant: { ...base.participant, arrival_time: null, ready_by: null },
    };
    const result = validateBooking(
      morning,
      { ...draft, start_time: "08:00", end_time: "09:00" },
      [],
      15,
      false,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});
describe("availability", () => {
  it("offers five-minute slots while excluding overlaps and respecting consecutive endpoints", () => {
    const other = {
      ...base,
      id: "b",
      participant_id: "other",
      start_time: "13:50",
      end_time: "14:15",
      status: "proposed" as const,
    };
    const slots = availableSlots(base, [other], 10, 15);
    expect(slots).toContain("13:35");
    expect(slots).toContain("13:40");
    expect(slots).not.toContain("13:45");
    expect(slots).not.toContain("14:10");
    expect(slots).toContain("14:15");
    expect(slots).toContain("17:50");
    expect(slots).not.toContain("17:55");
  });
  it("returns only times that fit selected duration, arrival, other proposed booking and deadline", () => {
    const other = {
      ...base,
      ...draft,
      id: "b",
      participant_id: "other",
      start_time: "14:15",
      end_time: "15:00",
    };
    const slots = availableSlots(base, [other], 45, 15);
    expect(slots).toContain("13:30");
    expect(slots).not.toContain("13:15");
    expect(slots).not.toContain("14:00");
    expect(slots).toContain("15:00");
    expect(slots).toContain("17:15");
    expect(slots).not.toContain("17:30");
  });
  it("requires a deliberate positive five-minute duration", () => {
    for (const duration of [0, 7, -5, NaN])
      expect(availableSlots(base, [], duration, 15)).toEqual([]);
  });
});
