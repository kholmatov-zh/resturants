import { Landing } from "@/components/marketing/landing";
import { getPublicSettings } from "@/lib/platform/public-settings";
export const dynamic = "force-dynamic";
export default async function Home() {
  return <Landing settings={await getPublicSettings()} />;
}
