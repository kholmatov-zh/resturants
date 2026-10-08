import { NextResponse } from "next/server";
import { uuid } from "@/lib/restaurant/validation";
import { getSupabaseConfiguration } from "@/lib/supabase/config";
import { serverSupabase } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string; filename: string }> },
) {
  const { restaurantId, filename } = await params;
  if (
    !uuid.safeParse(restaurantId).success ||
    !/^[-a-f0-9]{36}\.webp$/.test(filename) ||
    !getSupabaseConfiguration()
  )
    return new NextResponse(null, { status: 404 });
  const client = await serverSupabase();
  const { data, error } = await client.storage
    .from("restaurant-images")
    .download(`${restaurantId}/${filename}`);
  if (error || !data)
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  return new NextResponse(data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
