import { useCallback, useEffect, useRef, useState } from "react";
import { configError, supabase } from "../lib/supabase";
import {
  fetchAppointments,
  fetchParticipants,
  fetchVendors,
} from "../services/appointmentService";
import type { Appointment, Participant, Vendor } from "../types/database";

export type Connection = "connecting" | "connected" | "disconnected";
export function useWeddingData() {
  const [data, setData] = useState<{
    vendors: Vendor[];
    participants: Participant[];
    appointments: Appointment[];
  }>({ vendors: [], participants: [], appointments: [] });
  const [loading, setLoading] = useState(!configError);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const alive = useRef(false);
  const pending = useRef<Promise<boolean> | null>(null);
  const refreshQueued = useRef(false);
  const dataRevision = useRef(0);
  const refresh: () => Promise<boolean> = useCallback((): Promise<boolean> => {
    if (!supabase) return Promise.resolve(false);
    if (pending.current) {
      refreshQueued.current = true;
      return pending.current;
    }
    const requestedRevision = dataRevision.current;
    setRefreshing(true);
    pending.current = (async () => {
      try {
        const [vendors, participants, appointments] = await Promise.all([
          fetchVendors(),
          fetchParticipants(),
          fetchAppointments(),
        ]);
        if (alive.current && requestedRevision === dataRevision.current) {
          setData({ vendors, participants, appointments });
          setError(null);
        }
        return true;
      } catch {
        if (alive.current)
          setError("לא הצלחנו לעדכן את הלו״ז. בדקי את החיבור ונסי לרענן.");
        return false;
      } finally {
        if (alive.current) {
          setLoading(false);
          setRefreshing(false);
        }
        pending.current = null;
        if (alive.current && refreshQueued.current) {
          refreshQueued.current = false;
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
    if (!supabase)
      return () => {
        alive.current = false;
      };
    let active = true;
    void refresh();
    const channel = supabase
      .channel("wedding-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          if (active) void refresh();
        },
      )
      .subscribe((status) => {
        if (active)
          setConnection(status === "SUBSCRIBED" ? "connected" : "disconnected");
        if (active && status === "SUBSCRIBED") void refresh();
      });
    const visibleRefresh = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const offline = () => setConnection("disconnected");
    const online = () => {
      void refresh();
    };
    const interval = window.setInterval(visibleRefresh, 30_000);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => {
      active = false;
      alive.current = false;
      void supabase?.removeChannel(channel);
      window.clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
    };
  }, [refresh]);
  const acceptUpdate = useCallback((appointment: Appointment) => {
    dataRevision.current += 1;
    setData((previous) => ({
      ...previous,
      appointments: previous.appointments.map((a) =>
        a.id === appointment.id ? appointment : a,
      ),
    }));
  }, []);
  return {
    ...data,
    loading,
    refreshing,
    error,
    connection,
    refresh,
    acceptUpdate,
  };
}
