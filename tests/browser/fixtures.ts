import { expect, type Page, type WebSocketRoute } from "@playwright/test";
import type {
  AppointmentRow,
  Participant,
  Vendor,
} from "../../src/types/database";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const vendors: Vendor[] = [
  { id: id(1), name: "איילת שילוני", service_type: "makeup" },
  { id: id(2), name: "נועם יצחקי", service_type: "makeup" },
  { id: id(3), name: "מעין סעדון", service_type: "makeup" },
  { id: id(4), name: "ויקי שאולוב", service_type: "hair" },
  { id: id(5), name: "חן שקד", service_type: "hair" },
];
export const participants: Participant[] = [
  "שקד",
  "אגם",
  "איילי",
  "ענבר",
  "ליבי",
  "תמר",
  "חני",
  "עדית",
  "שלומית",
  "עדי",
].map((name, i) => ({
  id: id(100 + i),
  name,
  arrival_time: i >= 6 ? (i === 9 ? "14:00:00" : "13:30:00") : null,
  ready_by: i === 0 ? "14:15:00" : i >= 6 ? "18:00:00" : null,
}));
// Synthetic assignments exist only in tests. They are never bundled into the app.
export function fixtureRows(): AppointmentRow[] {
  const rows: AppointmentRow[] = [];
  for (const [i, p] of participants.entries()) {
    for (const type of ["makeup", "hair"] as const) {
      if ((i === 8 && type === "hair") || (i === 9 && type === "makeup"))
        continue;
      const vendor =
        type === "makeup"
          ? vendors[[0, 0, 1, 2, 1, 2, 0, 1, 2, 0][i]!]!
          : vendors[i === 9 ? 4 : i % 2 === 0 ? 3 : 4]!;
      rows.push({
        id: id(200 + rows.length),
        participant_id: p.id,
        vendor_id: vendor.id,
        service_type: type,
        start_time: i === 0 && type === "hair" ? "10:00:00" : null,
        end_time: i === 0 && type === "hair" ? "12:00:00" : null,
        status:
          i === 9
            ? "pending_confirmation"
            : i === 0 && type === "hair"
              ? "proposed"
              : "unscheduled",
      });
    }
  }
  return rows;
}
export async function mockWedding(page: Page) {
  const state = {
    rows: fixtureRows(),
    failSave: false,
    failReads: false,
    stale: false,
    holdNextRead: false,
    readHeld: false,
    releaseRead: null as (() => void) | null,
    subscriptionReady: false,
    sockets: [] as WebSocketRoute[],
  };
  const joined = () =>
    state.rows.map((row) => ({
      ...row,
      participant: participants.find((p) => p.id === row.participant_id)!,
      vendor: vendors.find((v) => v.id === row.vendor_id)!,
    }));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") return route.continue();
    if (url.origin !== "http://127.0.0.1:54321") return route.abort();
    if (state.failReads && route.request().method() === "GET")
      return route.fulfill({ status: 503, json: { message: "unavailable" } });
    const table = url.pathname.split("/").pop();
    if (route.request().method() === "PATCH") {
      if (state.failSave)
        return route.fulfill({
          status: 409,
          json: { code: "23P01", message: "overlap" },
        });
      if (state.stale) return route.fulfill({ status: 200, json: null });
      const row = state.rows.find(
        (row) => `eq.${row.id}` === url.searchParams.get("id"),
      );
      expect(row).toBeTruthy();
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual([
        "end_time",
        "start_time",
        "status",
      ]);
      expect(url.searchParams.get("status")).toBe(`eq.${row!.status}`);
      expect(url.searchParams.get("start_time")).toBe(
        row!.start_time === null ? "is.null" : `eq.${row!.start_time}`,
      );
      Object.assign(row!, body);
      return route.fulfill({ json: joined().find((a) => a.id === row!.id) });
    }
    const response =
      table === "vendors"
        ? [...vendors].reverse()
        : table === "participants"
          ? [...participants].reverse()
          : joined().reverse();
    if (table === "appointments" && state.holdNextRead) {
      state.holdNextRead = false;
      state.readHeld = true;
      await new Promise<void>((resolve) => {
        state.releaseRead = resolve;
      });
    }
    return route.fulfill({ json: response });
  });
  await page.routeWebSocket("ws://127.0.0.1:54321/**", (socket) => {
    state.sockets.push(socket);
    socket.onMessage((message) => {
      if (typeof message !== "string") return;
      const [joinRef, ref, topic, event] = JSON.parse(message) as [
        string | null,
        string,
        string,
        string,
        unknown,
      ];
      if (event === "phx_join") {
        socket.send(
          JSON.stringify([
            joinRef,
            ref,
            topic,
            "phx_reply",
            {
              status: "ok",
              response: {
                postgres_changes: [
                  {
                    id: 42,
                    event: "*",
                    schema: "public",
                    table: "appointments",
                  },
                ],
              },
            },
          ]),
        );
        state.subscriptionReady = true;
      }
      if (event === "heartbeat")
        socket.send(
          JSON.stringify([
            null,
            ref,
            "phoenix",
            "phx_reply",
            { status: "ok", response: {} },
          ]),
        );
    });
  });
  return state;
}

export async function enterFamily(page: Page) {
  await page.getByRole("button", { name: "משפחה וחברות", exact: true }).click();
  await page.getByLabel("סיסמה", { exact: true }).fill("111");
  await page.getByRole("button", { name: "כניסה", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
