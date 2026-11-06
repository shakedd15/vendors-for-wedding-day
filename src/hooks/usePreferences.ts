import { useState } from "react";
import { wedding } from "../config/wedding";
import type { Identity } from "../types/scheduling";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* Private browsing can disable persistence. */
  }
}
function savedIdentity(): Identity | null {
  try {
    const parsed: unknown = JSON.parse(read("wedding.identity") || "null");
    if (parsed && typeof parsed === "object" && "kind" in parsed) {
      if (parsed.kind === "manager") return { kind: "manager" };
      if (
        parsed.kind === "vendor" &&
        "id" in parsed &&
        typeof parsed.id === "string"
      )
        return { kind: "vendor", id: parsed.id };
    }
  } catch {
    /* Discard invalid preference. */
  }
  return null;
}
export function usePreferences() {
  const [identity, setIdentity] = useState<Identity | null>(savedIdentity);
  const [buffer, setBuffer] = useState(() => {
    const saved = read("wedding.buffer");
    const n = saved === null ? wedding.defaultBuffer : Number(saved);
    return Number.isInteger(n) && n >= 0 && n <= 120 && n % 15 === 0
      ? n
      : wedding.defaultBuffer;
  });
  return {
    identity,
    buffer,
    selectIdentity: (next: Identity | null) => {
      setIdentity(next);
      write("wedding.identity", JSON.stringify(next));
    },
    changeBuffer: (next: number) => {
      setBuffer(next);
      write("wedding.buffer", String(next));
    },
  };
}
