import type { AppointmentStatus } from "./database";
export interface BookingDraft {
  start_time: string | null;
  end_time: string | null;
  status: AppointmentStatus;
}
export interface ValidationResult {
  errors: string[];
  warnings: string[];
}
export type Identity = { kind: "vendor"; id: string } | { kind: "manager" };
export type Screen = "mine" | "shared" | "management";
