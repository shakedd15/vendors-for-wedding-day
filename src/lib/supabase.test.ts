import { afterEach, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
it("shows a configuration failure and creates no client when settings are absent", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  const { supabase, configError } = await import("./supabase");
  expect(supabase).toBeNull();
  expect(configError).toContain("VITE_SUPABASE_URL");
});
it("refuses a secret key before a client can make requests", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_secret_test");
  const { supabase, configError } = await import("./supabase");
  expect(supabase).toBeNull();
  expect(configError).toBeTruthy();
});
it("refuses a legacy service-role key", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.invalid");
  vi.stubEnv(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role: "service_role" }))}.test`,
  );
  const { supabase } = await import("./supabase");
  expect(supabase).toBeNull();
});
