import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";
import { getSupabaseConfiguration } from "../src/lib/supabase/config.ts";
nextEnv.loadEnvConfig(process.cwd());
let config;
try {
  config = getSupabaseConfiguration();
} catch {
  console.error(
    "FAIL: используйте корректный URL и публичный publishable/anon key, не secret/service_role.",
  );
  process.exit(1);
}
if (!config) {
  console.error(
    "FAIL: добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY в .env.local и перезапустите приложение.",
  );
  process.exit(1);
}
const client = createClient(config.url, config.key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let failures = 0;
for (const table of ["restaurants", "categories", "menu_items", "platform_settings", "legal_documents"]) {
  const { error } = await client.from(table).select(table === "legal_documents" ? "kind" : "id").limit(1);
  if (error) {
    failures++;
    console.error(
      `FAIL: ${table} — запрос отклонён (код ${error.code || "network"}). Проверьте миграцию, ключ и сеть.`,
    );
  } else console.log(`PASS: ${table} доступна публичному клиенту через RLS.`);
}
const { data, error } = await client.from("admins").select("user_id").limit(1);
if (!error && data?.length) {
  failures++;
  console.error("FAIL: список администраторов раскрыт публично.");
} else if (error?.code === "42501" || (!error && data?.length === 0))
  console.log("PASS: публичный клиент не получает список администраторов.");
else {
  failures++;
  console.error("FAIL: проверка ограничения admins не завершилась.");
}
console.log(
  "Эта проверка не проверяет пароль администратора, вход или Storage API. Значения ключей не выводятся.",
);
process.exitCode = failures ? 1 : 0;
