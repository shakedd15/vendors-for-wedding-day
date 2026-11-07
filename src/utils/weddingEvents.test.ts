import { expect, it } from "vitest";
import { validateWeddingEvent } from "./weddingEvents";
it("accepts an event without an end and five-minute time changes", () => {
  expect(
    validateWeddingEvent({
      title: "מפגש",
      start_time: "15:05",
      end_time: null,
    }),
  ).toEqual([]);
  expect(
    validateWeddingEvent({
      title: "צילומים",
      start_time: "14:35",
      end_time: "15:05",
    }),
  ).toEqual([]);
});
it("rejects blank names, missing starts, non-five-minute times and reversed ends", () => {
  for (const draft of [
    { title: " ", start_time: "15:00", end_time: null },
    { title: "מפגש", start_time: "", end_time: null },
    { title: "מפגש", start_time: "15:02", end_time: null },
    { title: "מפגש", start_time: "15:00", end_time: "15:00" },
    { title: "מפגש", start_time: "15:00", end_time: "14:55" },
    { title: "מפגש", start_time: "15:00", end_time: "15:07" },
  ])
    expect(validateWeddingEvent(draft).length).toBeGreaterThan(0);
});
