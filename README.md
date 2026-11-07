# מתארגנות לחתונה — שקד ואיל

A mobile-first Hebrew / RTL hair and makeup planner for November 10, 2026. React, strict TypeScript, Vite, Tailwind CSS, Lucide and the Supabase JavaScript client. Heebo font files are bundled locally; there are no font-CDN requests.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env
```

Fill in the two public connection settings in `.env`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLIC-PUBLISHABLE-KEY
VITE_BASE_PATH=/
```

```sh
npm run dev
```

Open the localhost URL printed by Vite. Missing or invalid connection configuration produces a Hebrew configuration message; the application never falls back to fake schedules. Restart Vite after changing environment settings.

Use only a Supabase publishable key (`sb_publishable_…`) or the legacy public `anon` JWT. Never use a secret or service-role key. Vite embeds all `VITE_` settings into public browser files. The public URL and key do not secure the application; database RLS policies provide the actual access boundary.

## Existing data

The application reads `vendors`, `participants` and relational `appointments`. It updates appointment times/status and, after the owner enables the optional details field described below, `vendors.additional_details` only. It performs no inserts, deletes, automatic migrations, seed operations, or changes to assignments. It uses IDs returned by the database and does not assume row ordering. Missing service records display as “לא נדרש”.

## Vendor additional details

Each vendor's “הלו״ז שלי” page includes an editable “פירוט נוסף” textarea and an explicit save button. Text is stored per vendor in `public.vendors.additional_details` (`text`, nullable), so it survives page reloads, switching identities and use on another device. Clearing the text and saving removes the details. Notes are never stored in localStorage.

The existing database does not have this field and its anonymous policies previously allowed no vendor updates. **Owner action is required:** review and run [vendor-additional-details.sql](docs/vendor-additional-details.sql) in the existing project's Supabase SQL Editor. This manual script adds only the nullable field, grants anonymous updates to that field, adds the UPDATE RLS policy, and preserves the existing read policies. It does not modify appointments, participant records, names or vendor service types. It runs as a transaction and stops if inherited grants still permit changing other vendor fields. No SQL is executed by the app or by the development checks.

Until the column is available, the notes editor is disabled and scheduling continues normally. A missing update permission produces a friendly save error without losing the draft. Notes load on entry, manual refresh, focus and the existing visible-tab polling interval. An acknowledged save updates local state immediately; competing changes use a comparison with the previous saved text to prevent silent overwrites. Unsaved local edits are kept when background refreshes arrive. Saving notes requires the same anonymous database access model as the existing scheduling functionality.

Vendor identity selection is a local display preference. The “משפחה וחברות” card opens the shared schedule and management view after entering the local plaintext password `111`, configured in `src/config/access.ts`. The password is checked only in the frontend and is never stored in or sent to Supabase. Family access is unlocked only in memory; a reload or return to name selection requires the password again, including for previously saved management identities. This is a simple frontend entry gate, not database authentication or role authorization. Existing anonymous RLS permissions remain unchanged. Vendors can edit their assigned appointments; family management retains editing of all existing appointments and explicit approval of pending services.

Only identity and the bride planning buffer are stored in localStorage. Appointment records remain in Supabase. Blocked localStorage is supported, but preferences then reset on reload.

Every schedule screen includes a Hebrew back button that stays visible at the top while scrolling. It returns through screens visited in the current session, then to name selection. Selecting another identity starts fresh navigation; after reloading, back returns to name selection. Navigation stays inside the static app and does not require server route rewrites.

Both shared and management schedules filter by participant names from the existing `participants` records. The family entry card uses the same card layout as the vendors. The repeated bride deadline banner and the separate bride-planning section are not displayed in the family view; deadline validation and the bride's booking-sheet buffer remain in place.

Family access also includes a “טבלה” shared-schedule view. Actual vendors form the columns, labeled with their hair/makeup service; hourly rows show assigned participants and their exact appointment times. Long appointments appear in each hour they cover, using exclusive end boundaries. Unscheduled/incomplete records stay visible in a separate final row, and participant filtering applies to this view too. Existing out-of-window records extend the grid so they are not hidden. On phones the table scrolls inside its own region with pinned column headers and time labels; the page itself does not overflow. Wedding moments remain a separate section. This view needs no database changes.

“צפייה לרוחב” opens a viewport-filling table viewer. Portrait phones show a prompt to rotate physically; in landscape all five vendor columns fit across the available safe-area width and only vertical scrolling is needed. The browser follows the phone's ordinary orientation setting; the app does not rely on orientation-lock or browser-fullscreen APIs. Close/back restores the normal view and page scrolling, and editing a booking closes the wide viewer before opening its editor.

## Scheduling behavior

- Select a duration deliberately in 5-minute steps, then choose an available start time in 5-minute steps. Existing durations are preserved when editing.
- There is no manual booking-status selector, status badge, or proposed/confirmed dashboard breakdown. Saving a regular appointment records its time directly; the existing database status field is maintained internally without changing the schema or rewriting untouched records.
- Proposed, confirmed and timed pending services all reserve their interval. Endpoints are exclusive, so consecutive appointments are allowed.
- The app checks both participant and vendor overlap, actual arrival times, participant deadlines and Shaked's hard 14:15 deadline.
- Shaked's dressing/touch-up allowance defaults to 15 minutes. It is clearly labeled as an adjustable **per-device planning assumption** because the existing schema has no shared settings record. A change on one device does not change other devices' assumptions. A zero buffer still enforces 14:15.
- The booking form offers only available appointments that start and finish within 07:00–18:30. The shared agenda uses these same bounds and the table ends with a final 18:00–18:30 row. Earlier participant-specific arrival/deadline restrictions still apply. Existing records outside that window remain visible and are flagged for review; editing their time requires choosing a slot within the preparation window.
- A pending service can be timed without approving it. The separate service-joining approval (such as Adi's hair service) remains explicit in management. Approving a timed service saves it directly; approving one without times leaves it ready to schedule.
- “הסרת השעה” clears time fields and returns the existing service to unscheduled (or preserves pending confirmation). It does not delete the appointment.
- Before saving, fresh records are fetched and revalidated. Updates also compare the original time/status/assignment fields; a concurrent change to the same appointment cannot be silently replaced. Existing database exclusion constraints arbitrate concurrent overlapping saves to different appointments. A save succeeds only after Supabase acknowledges it.
- Wedding moments are stored separately from hair/makeup appointments and do not block participants' services. Family management can edit their titles/times and add events; vendors see the saved timeline without editing controls.

## Editable wedding moments

To enable editing “רגעים ששומרים”, the owner must review and run [wedding-events.sql](docs/wedding-events.sql) in Supabase SQL Editor. This creates `public.wedding_events` with `id` (UUID), `title` (text), `start_time` (time), and nullable `end_time` (time). The three existing photography events are inserted only when the table is first created; re-running setup preserves subsequent edits and does not recreate deleted or renamed events. No existing vendors, participants or appointments are changed.

The script enables reading and column-limited creation/updates for the existing anonymous frontend access model, plus Realtime publication when available. The family password gates the UI only; it does not create a database role or backend authentication. There is no event delete operation in this version. All events belong to this wedding date.

Before the table exists, the original configuration remains a read-only fallback. Missing setup disables event editing without breaking appointments. Once configured, both shared views use actual database events, including an intentionally empty event list. Events load on entry/focus/manual refresh, poll every 30 seconds while visible, and subscribe to Realtime independently from appointments. Saving updates local state only after database acknowledgment; concurrent updates compare the original title and times and cannot silently overwrite another edit. Events support 5-minute times, point events with no end, and intervals ending after their start within the same day.

## Realtime and reliability

The app subscribes to `public.appointments`, removes its channel when unmounted, refetches on updates, refetches when the tab regains focus or connectivity, and polls every 30 seconds while visible. Synchronization runs quietly without a persistent connection-status message. Manual refresh remains available; failed data fetches show an error alongside the last successfully loaded data. Requests time out after 15 seconds.

**Owner setup check:** the existing `appointments` table must already be included in the project's Supabase Realtime publication and allow reads under the existing anonymous RLS policies. No database setup is executed by this project. If events are unavailable, periodic/manual refresh remains usable. Realtime channel connection does not by itself prove the table is published; verify an actual cross-device update before wedding-day use.

## Verify

```sh
npm test
npm run build
npm run preview
```

Unit tests exercise pure scheduling rules. Browser tests use synthetic records and intercept all database HTTP/WebSocket traffic; they do not write to the wedding database. The test server overrides connection settings with a localhost fixture address. They cover all five vendor views, management, RTL at 375px/390px, saving, editing, clearing, concurrency failures, pending approval, the bride deadline, and Realtime refresh/disconnection.

With a compatible local Playwright browser installed:

```sh
npm run test:browser
```

For an existing browser binary, set `BROWSER_EXECUTABLE` to its absolute executable path. Browser installation, if needed, is a separate owner-controlled operation (`npx playwright install chromium`). Actual iPhone Safari and real cross-device Supabase writes require owner acceptance testing; no live external systems were accessed during development.

## GitHub Pages

1. Create or use your repository and push this project to `main` yourself.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions → Variables**, create `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using the public values. The workflow fails with a clear message if either is absent.
4. The workflow defaults the Vite base to `/REPOSITORY/`, suitable for `https://USERNAME.github.io/REPOSITORY/`.
5. For a root-domain site or custom domain, set repository variable `VITE_BASE_PATH` to `/`. Configure the custom domain in Pages separately if applicable.
6. A push to `main` (or manual workflow dispatch) runs `npm ci`, unit tests, strict TypeScript checking and a Vite production build, then deploys `dist` with the official Pages actions.

To verify a project subpath locally:

```sh
VITE_BASE_PATH=/REPOSITORY/ npm run build
npm run preview -- --base=/REPOSITORY/
```

Open `/REPOSITORY/` on the preview server. Navigation is entirely in app state, so refreshing never requires server route rewrites. Assets and fonts respect Vite's base path. Reloading restores the selected identity and its default screen.

## Acceptance checks requiring your connection

No live Supabase access, real appointment writes, remote repository access or deployment was performed. With your environment settings, verify the existing 5 vendors, 10 participants and 18 appointments; Shaked's proposed Viki 10:00–12:00 booking; Adi's pending service; the existing RLS update permissions; overlap errors; and propagation between two devices. Verify on an actual iPhone Safari before use. If the existing constraints or policies prohibit a permitted UI action, the app shows a save failure instead of changing the database schema.
