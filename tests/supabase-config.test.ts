import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseConfiguration } from "../src/lib/supabase/config.ts";
const key = "sb_publishable_test";
test("missing Supabase configuration stays explicitly unavailable", () => {
  assert.equal(getSupabaseConfiguration({}), null);
});
test("publishable keys and legacy anon keys are supported", () => {
  assert.deepEqual(
    getSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    }),
    { url: "https://example.supabase.co", key },
  );
  const jwt =
    "header." +
    Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url") +
    ".signature";
  assert.equal(
    getSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt,
    })?.key,
    jwt,
  );
});
test("server secret and legacy service_role keys are rejected", () => {
  for (const secret of [
    "sb_secret_test",
    "header." +
      Buffer.from(JSON.stringify({ role: "service_role" })).toString(
        "base64url",
      ) +
      ".signature",
  ])
    assert.throws(() =>
      getSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret,
      }),
    );
});
test("insecure remote URLs and embedded credentials are rejected", () => {
  for (const url of ["http://example.com", "https://user:password@example.com"])
    assert.throws(() =>
      getSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      }),
    );
  assert.ok(
    getSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    }),
  );
});
