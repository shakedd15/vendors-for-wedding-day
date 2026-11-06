export function toMinutes(time: string | null): number | null {
  if (!time || !/^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(time)) return null;
  const [hours, minutes, seconds = "0"] = time.split(":");
  const h = Number(hours),
    m = Number(minutes),
    s = Number(seconds);
  return h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60
    ? h * 60 + m + s / 60
    : null;
}
export function fromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function displayTime(time: string | null): string {
  return time?.slice(0, 5) || "—";
}
export function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}
export function hasTimes(value: {
  start_time: string | null;
  end_time: string | null;
}): boolean {
  const start = toMinutes(value.start_time),
    end = toMinutes(value.end_time);
  return start !== null && end !== null && end > start;
}
