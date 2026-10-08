export type SupabaseConfiguration = { url: string; key: string };
export function getSupabaseConfiguration(
  env: Record<string, string | undefined> = process.env,
): SupabaseConfiguration | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !key) return null;
  const parsed = new URL(url);
  if (
    parsed.username ||
    parsed.password ||
    (parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname)
      ))
  )
    throw new Error("Supabase URL must use HTTPS (except local development).");
  if (key.startsWith("sb_secret_"))
    throw new Error("Use a public publishable key, never a secret key.");
  if (!key.startsWith("sb_publishable_")) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      );
      if (payload.role !== "anon") throw new Error();
    } catch {
      throw new Error("Use a publishable key or legacy anon key.");
    }
  }
  return { url: parsed.origin, key };
}
