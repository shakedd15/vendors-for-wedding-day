import type { ServiceType } from "../types/database";
export const wedding = {
  date: "2026-11-10",
  bride: "שקד",
  readyBy: "14:15",
  start: "09:00",
  end: "18:00",
  defaultBuffer: 15,
} as const;
export const serviceLabels: Record<ServiceType, string> = {
  makeup: "איפור",
  hair: "עיצוב שיער",
};
export const vendorLabels: Record<ServiceType, string> = {
  makeup: "מאפרת",
  hair: "מעצבת שיער",
};
export interface PhotographyEvent {
  id: string;
  start: string;
  end: string | null;
  title: string;
}
export const photography: readonly PhotographyEvent[] = [
  { id: "bride", start: "14:30", end: "15:00", title: "צילומי כלה" },
  { id: "meeting", start: "15:00", end: null, title: "מפגש חתן וכלה" },
  { id: "couple", start: "15:10", end: "17:00", title: "צילומי זוגיות" },
];
