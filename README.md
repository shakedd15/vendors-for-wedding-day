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

The application only reads `vendors`, `participants` and relational `appointments`, and updates `appointments.start_time`, `end_time` and `status`. It performs no inserts, deletes, migrations, seed operations, or changes to assignments. It uses IDs returned by the database and does not assume row ordering. Missing service records display as “לא נדרש”.

Identity selection is a local display preference, not authentication. Eyal's view is a predefined frontend management interface and is not secured by a role. Other vendors can see the shared timeline; their own view offers edits to their assignments. Management allows editing all existing appointments and explicitly approving pending services. These frontend controls are not authorization controls; do not publish a schedule that requires private, authenticated access under the current anonymous policy model.

Only identity and the bride planning buffer are stored in localStorage. Appointment records remain in Supabase. Blocked localStorage is supported, but preferences then reset on reload.

## Scheduling behavior

- Select a duration deliberately in 15-minute steps, then choose an available start time. Existing durations are preserved when editing.
- Proposed, confirmed and timed pending services all reserve their interval. Endpoints are exclusive, so consecutive appointments are allowed.
- The app checks both participant and vendor overlap, actual arrival times, participant deadlines and Shaked's hard 14:15 deadline.
- Shaked's dressing/touch-up allowance defaults to 15 minutes. It is clearly labeled as an adjustable **per-device planning assumption** because the existing schema has no shared settings record. A change on one device does not change other devices' assumptions. A zero buffer still enforces 14:15.
- Normal preparation hours are 09:00–18:00. An explicit option exposes other available hours with a warning. Bookings must end before midnight on the same day.
- A pending service can be timed without approving it. Management must explicitly check the service-approval box before changing it to a planned, confirmed or approved-but-unscheduled service.
- “הסרת השעה” clears time fields and returns the existing service to unscheduled (or preserves pending confirmation). It does not delete the appointment.
- Before saving, fresh records are fetched and revalidated. Updates also compare the original time/status/assignment fields; a concurrent change to the same appointment cannot be silently replaced. Existing database exclusion constraints arbitrate concurrent overlapping saves to different appointments. A save succeeds only after Supabase acknowledges it.
- Photography events are typed read-only frontend configuration in `src/config/wedding.ts`; they do not block other participants' services.

## Realtime and reliability

The app subscribes to `public.appointments`, removes its channel when unmounted, refetches on updates, refetches when the tab regains focus or connectivity, and polls every 30 seconds while visible. It also provides manual refresh and shows connection failure separately from the last successfully loaded data. Requests time out after 15 seconds.

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
