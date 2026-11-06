import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

function configurationError(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key)
    return "חסרים פרטי חיבור. הוסיפי לקובץ ‎.env את VITE_SUPABASE_URL ואת VITE_SUPABASE_PUBLISHABLE_KEY והפעילי מחדש את האפליקציה.";
  try {
    if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error();
  } catch {
    return "כתובת החיבור אינה תקינה. בדקי את VITE_SUPABASE_URL בקובץ ההגדרות.";
  }
  if (key.startsWith("sb_secret_"))
    return "נדרש מפתח ציבורי. אין להשתמש במפתח סודי באפליקציה.";
  if (key.startsWith("eyJ")) {
    try {
      const part = key.split(".")[1] || "";
      const payload: unknown = JSON.parse(
        atob(part.replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (
        !payload ||
        typeof payload !== "object" ||
        !("role" in payload) ||
        payload.role !== "anon"
      )
        return "נדרש מפתח ציבורי מסוג publishable או anon בלבד.";
    } catch {
      return "המפתח הציבורי אינו תקין. בדקי את הגדרות החיבור.";
    }
  } else if (!key.startsWith("sb_publishable_"))
    return "נדרש מפתח ציבורי מסוג publishable או anon בלבד.";
  return null;
}

export const configError = configurationError();

const timedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const signal = init?.signal;
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
};

export const supabase = configError
  ? null
  : createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: { fetch: timedFetch },
        realtime: { timeout: 10_000 },
      },
    );
