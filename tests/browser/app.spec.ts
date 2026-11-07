import { expect, test } from "@playwright/test";
import { enterFamily, mockWedding, vendors } from "./fixtures";

test("family access requires the local password and filters schedules by participant", async ({
  page,
}) => {
  await mockWedding(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "משפחה וחברות", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /איל — ניהול/ })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "משפחה וחברות", exact: true }).click();
  await page.getByLabel("סיסמה", { exact: true }).fill("999");
  await page.getByRole("button", { name: "כניסה", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("הסיסמה שגויה");
  await page.getByLabel("סיסמה", { exact: true }).fill("111");
  await page.getByRole("button", { name: "כניסה", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "מתארגנות ביחד" }),
  ).toBeVisible();
  await expect(page.getByText("הרגע של שקד", { exact: true })).toHaveCount(0);
  const sharedFilter = page.getByRole("combobox", {
    name: "מתארגנת",
    exact: true,
  });
  await sharedFilter.selectOption({ label: "חני" });
  await expect(page.locator(".participant-card")).toHaveCount(1);
  await expect(page.locator(".participant-card")).toContainText("חני");
  await page.getByRole("button", { name: "ניהול", exact: true }).click();
  const participantFilter = page.getByRole("combobox", {
    name: "מתארגנת",
    exact: true,
  });
  await expect(participantFilter.locator("option")).toHaveCount(11);
  await participantFilter.selectOption({ label: "חני" });
  await expect(page.locator(".appointment-card")).toHaveCount(2);
  for (const heading of await page
    .locator(".appointment-card h3")
    .allTextContents())
    expect(heading).toBe("חני");
  await participantFilter.selectOption({ label: "שלומית" });
  await expect(page.locator(".appointment-card")).toHaveCount(1);
  await participantFilter.selectOption("all");
  await expect(page.locator(".appointment-card")).toHaveCount(18);
  await page.reload();
  await expect(page.getByRole("heading", { name: "היי אהובה!" })).toBeVisible();
  await enterFamily(page);
  await expect(
    page.getByRole("heading", { name: "מתארגנות ביחד" }),
  ).toBeVisible();
});

test("back navigation returns through visited screens and then to name selection", async ({
  page,
}) => {
  await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /איילת שילוני/ }).click();
  await page.getByRole("button", { name: "הלו״ז שלי", exact: true }).click();
  await page.getByRole("button", { name: "לו״ז משותף", exact: true }).click();
  await page.getByRole("button", { name: "לו״ז משותף", exact: true }).click();
  await page.getByRole("button", { name: "חזרה", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "הלו״ז שלי", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "חזרה", exact: true }).click();
  await expect(page.getByRole("heading", { name: "היי אהובה!" })).toBeVisible();
  await enterFamily(page);
  await page.getByRole("button", { name: "ניהול", exact: true }).click();
  await page.getByRole("button", { name: "חזרה", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "מתארגנות ביחד" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "חזרה", exact: true }).click();
  await expect(page.getByRole("heading", { name: "היי אהובה!" })).toBeVisible();
  await page.getByRole("button", { name: /חן שקד/ }).click();
  await page.reload();
  await page.getByRole("button", { name: "חזרה", exact: true }).click();
  await expect(page.getByRole("heading", { name: "היי אהובה!" })).toBeVisible();
});

test("welcome is RTL and every vendor sees her real assignments at both phone widths", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await mockWedding(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "היי אהובה!" })).toBeVisible();
  await page.screenshot({
    path: "test-results/welcome-375.png",
    fullPage: true,
  });
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const vendor of vendors) {
      await page.getByRole("button", { name: new RegExp(vendor.name) }).click();
      await expect(
        page.getByRole("heading", { name: "הלו״ז שלי", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".appointment-card")).not.toHaveCount(0);
      if (width === 375 && vendor.name === "חן שקד")
        await page.screenshot({
          path: "test-results/schedule-375.png",
          fullPage: true,
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "הלו״ז שלי", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "החלפת משתמשת" }).click();
    }
  }
});

test("saves, edits and clears an appointment without changing its assignment", async ({
  page,
}) => {
  const state = await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /איילת שילוני/ }).click();
  await page
    .getByRole("button", { name: "קביעת שעה עבור חני", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "שמירת השיבוץ" }),
  ).toBeDisabled();
  await page.getByLabel("משך הטיפול").fill("45");
  await expect(
    page.getByLabel("שעת התחלה").locator('option[value="13:15"]'),
  ).toHaveCount(0);
  await page.getByLabel("שעת התחלה").selectOption("13:30");
  await page.screenshot({
    path: "test-results/booking-375.png",
    fullPage: true,
  });
  await expect(page.locator(".calculated-end")).toContainText("14:15");
  await expect(page.getByLabel("סטטוס השיבוץ")).toHaveCount(0);
  await page.getByRole("button", { name: "שמירת השיבוץ" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "השיבוץ נשמר בהצלחה" }),
  ).toBeVisible();
  expect(
    state.rows.find(
      (a) =>
        a.participant_id.endsWith("000000000106") &&
        a.service_type === "makeup",
    )?.status,
  ).toBe("confirmed");
  await page
    .getByRole("button", { name: "עריכת שעה עבור חני", exact: true })
    .click();
  await page.getByLabel("משך הטיפול").fill("60");
  await page.getByRole("button", { name: "שמירת השיבוץ" }).click();
  await page
    .getByRole("button", { name: "עריכת שעה עבור חני", exact: true })
    .click();
  await page.getByRole("button", { name: "הסרת השעה שנקבעה" }).click();
  await page.getByRole("button", { name: "כן, הסרת שעה" }).click();
  await expect(
    page.getByRole("button", { name: "קביעת שעה עבור חני", exact: true }),
  ).toBeVisible();
});

test("database conflict and concurrent same-appointment edits leave the sheet recoverable", async ({
  page,
}) => {
  const state = await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /איילת שילוני/ }).click();
  await page
    .getByRole("button", { name: "קביעת שעה עבור חני", exact: true })
    .click();
  await page.getByLabel("משך הטיפול").fill("45");
  await page.getByLabel("שעת התחלה").selectOption("13:30");
  state.failSave = true;
  await page.getByRole("button", { name: "שמירת השיבוץ" }).click();
  await expect(page.getByRole("alert")).toContainText("השעה הזו כבר נתפסה");
  await expect(
    page.getByRole("button", { name: "שמירת השיבוץ" }),
  ).toBeEnabled();
  state.failSave = false;
  state.stale = true;
  await page.getByRole("button", { name: "שמירת השיבוץ" }).click();
  await expect(page.getByRole("alert")).toContainText("השיבוץ השתנה");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("pending services stay pending for vendors and can be explicitly approved in management", async ({
  page,
}) => {
  const state = await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /חן שקד/ }).click();
  await page
    .getByRole("button", { name: "קביעת שעה עבור עדי", exact: true })
    .click();
  await expect(page.getByLabel("סטטוס השיבוץ")).toHaveCount(0);
  await expect(page.getByLabel("אני מאשר/ת את הצטרפותה לשירות")).toHaveCount(0);
  await page.getByLabel("משך הטיפול").fill("60");
  await expect(
    page.getByLabel("שעת התחלה").locator('option[value="13:45"]'),
  ).toHaveCount(0);
  await page.getByLabel("שעת התחלה").selectOption("14:00");
  await page.getByRole("button", { name: "שמירת השיבוץ" }).click();
  await expect(
    page
      .locator(".appointment-card")
      .filter({ has: page.getByRole("heading", { name: "עדי", exact: true }) }),
  ).toContainText("ההצטרפות לשירות ממתינה לאישור");
  expect(
    state.rows.find((a) => a.participant_id.endsWith("000000000109"))?.status,
  ).toBe("pending_confirmation");
  await page.getByRole("button", { name: "החלפת משתמשת" }).click();
  await enterFamily(page);
  await page.getByRole("button", { name: "ניהול", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "ניהול ההתארגנות" }),
  ).toBeVisible();
  await expect(page.locator(".appointment-card")).toHaveCount(18);
  await page
    .getByRole("button", { name: "עריכת שעה עבור עדי", exact: true })
    .click();
  await page.getByLabel("אני מאשר/ת את הצטרפותה לשירות").check();
  await expect(page.getByLabel("סטטוס השיבוץ")).toHaveCount(0);
  await page.getByRole("button", { name: "שמירת השיבוץ" }).click();
  await expect(
    page
      .locator(".appointment-card")
      .filter({ has: page.getByRole("heading", { name: "עדי", exact: true }) }),
  ).not.toContainText("ההצטרפות לשירות ממתינה לאישור");
  expect(
    state.rows.find((a) => a.participant_id.endsWith("000000000109"))?.status,
  ).toBe("confirmed");
  await page.getByRole("button", { name: "לו״ז משותף", exact: true }).click();
  await expect(
    page
      .locator(".participant-card")
      .filter({ has: page.getByRole("heading", { name: "עדי", exact: true }) }),
  ).not.toContainText("עדיין ממתינה לאישור");
});

test("shared participant and agenda views show booked times without manual status labels", async ({
  page,
}) => {
  await mockWedding(page);
  await page.goto("/");
  await enterFamily(page);
  await expect(page.locator(".participant-card")).toHaveCount(10);
  const shlomit = page.locator(".participant-card").filter({
    has: page.getByRole("heading", { name: "שלומית", exact: true }),
  });
  await expect(shlomit).toContainText("לא נדרש");
  await page.getByRole("button", { name: "לפי שעות", exact: true }).click();
  await expect(
    page.locator(".agenda-item").filter({ hasText: "שקד" }).first(),
  ).toContainText("10:00");
  await expect(page.getByText("בתכנון", { exact: true })).toHaveCount(0);
  await expect(page.getByText("מאושר", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "צילומי כלה" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("bride buffer changes availability and can be adjusted without altering the hard deadline", async ({
  page,
}) => {
  await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /איילת שילוני/ }).click();
  await page
    .getByRole("button", { name: "קביעת שעה עבור שקד", exact: true })
    .click();
  await page.getByLabel("משך הטיפול").fill("60");
  await expect(
    page.getByLabel("שעת התחלה").locator('option[value="13:15"]'),
  ).toHaveCount(0);
  await page.getByLabel("מרווח לשמלה ולטאצ׳ אפ").selectOption("0");
  await expect(
    page.getByLabel("שעת התחלה").locator('option[value="13:15"]'),
  ).toHaveCount(1);
  await expect(
    page.getByLabel("שעת התחלה").locator('option[value="13:30"]'),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("שעת התחלה").locator('option[value="10:00"]'),
  ).toHaveCount(0);
});

test("realtime updates refresh the schedule and manual refresh works after disconnection", async ({
  page,
}) => {
  const state = await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /איילת שילוני/ }).click();
  await expect.poll(() => state.subscriptionReady).toBe(true);
  const row = state.rows.find(
    (a) =>
      a.participant_id.endsWith("000000000106") && a.service_type === "makeup",
  )!;
  Object.assign(row, {
    start_time: "13:30:00",
    end_time: "14:15:00",
    status: "proposed",
  });
  for (const socket of state.sockets) {
    socket.send(
      JSON.stringify([
        null,
        null,
        "realtime:wedding-appointments",
        "postgres_changes",
        {
          ids: [42],
          data: {
            schema: "public",
            table: "appointments",
            type: "UPDATE",
            commit_timestamp: new Date().toISOString(),
            columns: [],
            record: row,
            old_record: {},
          },
        },
      ]),
    );
  }
  await expect(
    page.getByRole("button", { name: "עריכת שעה עבור חני", exact: true }),
  ).toBeVisible();
  for (const socket of state.sockets) socket.close();
  row.end_time = "14:30:00";
  await page.getByRole("button", { name: "רענון הלו״ז" }).click();
  await expect(
    page
      .locator(".appointment-card")
      .filter({ has: page.getByRole("heading", { name: "חני", exact: true }) }),
  ).toContainText("14:30");
});

test("a realtime change arriving during a refresh is not dropped", async ({
  page,
}) => {
  const state = await mockWedding(page);
  await page.goto("/");
  await page.getByRole("button", { name: /איילת שילוני/ }).click();
  await expect.poll(() => state.subscriptionReady).toBe(true);
  await expect(page.getByRole("button", { name: "רענון הלו״ז" })).toBeEnabled();
  state.holdNextRead = true;
  await page.getByRole("button", { name: "רענון הלו״ז" }).click();
  await expect.poll(() => state.readHeld).toBe(true);
  const row = state.rows.find(
    (a) =>
      a.participant_id.endsWith("000000000106") && a.service_type === "makeup",
  )!;
  Object.assign(row, {
    start_time: "13:30:00",
    end_time: "14:15:00",
    status: "proposed",
  });
  for (const socket of state.sockets)
    socket.send(
      JSON.stringify([
        null,
        null,
        "realtime:wedding-appointments",
        "postgres_changes",
        {
          ids: [42],
          data: {
            schema: "public",
            table: "appointments",
            type: "UPDATE",
            commit_timestamp: new Date().toISOString(),
            columns: [],
            record: row,
            old_record: {},
          },
        },
      ]),
    );
  // Let the browser handle the WebSocket message while the old HTTP snapshot is held.
  await page.waitForTimeout(100);
  state.releaseRead?.();
  await expect(
    page.getByRole("button", { name: "עריכת שעה עבור חני", exact: true }),
  ).toBeVisible();
});
