import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfiguration } from "./config";
/** Public routes never inherit an administrator's session. */
export function publicSupabase() {
  const config = getSupabaseConfiguration();
  return config
    ? createClient(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;
}
