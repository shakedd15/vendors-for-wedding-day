import { useCallback, useEffect, useRef, useState } from "react";
import { photography, type PhotographyEvent } from "../config/wedding";
import { supabase } from "../lib/supabase";
import { fetchWeddingEvents } from "../services/weddingEventService";
import { sortWeddingEvents } from "../utils/weddingEvents";

export function useWeddingEvents() {
  const [events, setEvents] = useState<PhotographyEvent[]>(() => [
    ...photography,
  ]);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(false),
    queued = useRef(false),
    revision = useRef(0);
  const pending = useRef<Promise<void> | null>(null);
  const refresh: () => Promise<void> = useCallback(() => {
    if (!supabase) return Promise.resolve();
    if (pending.current) {
      queued.current = true;
      return pending.current;
    }
    const version = revision.current;
    setRefreshing(true);
    pending.current = (async () => {
      try {
        const latest = await fetchWeddingEvents();
        if (alive.current && version === revision.current) {
          if (latest !== null) setEvents(latest);
          setAvailable(latest !== null);
          setError(null);
        }
      } catch {
        if (alive.current)
          setError(
            "לא הצלחנו לעדכן את האירועים. מוצגים הפרטים האחרונים שהתקבלו.",
          );
      } finally {
        pending.current = null;
        if (alive.current) setRefreshing(false);
        if (alive.current && queued.current) {
          queued.current = false;
          queueMicrotask(() => {
            if (alive.current) void refresh();
          });
        }
      }
    })();
    return pending.current;
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const visibleRefresh = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(visibleRefresh, 30_000);
    window.addEventListener("focus", visibleRefresh);
    window.addEventListener("online", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => {
      alive.current = false;
      clearInterval(interval);
      window.removeEventListener("focus", visibleRefresh);
      window.removeEventListener("online", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
    };
  }, [refresh]);
  useEffect(() => {
    if (!available || !supabase) return;
    let active = true;
    const channel = supabase
      .channel("wedding-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wedding_events" },
        () => {
          if (active) void refresh();
        },
      )
      .subscribe((status) => {
        if (active && status === "SUBSCRIBED") void refresh();
      });
    return () => {
      active = false;
      void supabase?.removeChannel(channel);
    };
  }, [available, refresh]);
  const acceptEvent = useCallback((event: PhotographyEvent) => {
    revision.current += 1;
    setEvents((previous) =>
      sortWeddingEvents([
        ...previous.filter((current) => current.id !== event.id),
        event,
      ]),
    );
  }, []);
  return { events, available, error, refreshing, refresh, acceptEvent };
}
