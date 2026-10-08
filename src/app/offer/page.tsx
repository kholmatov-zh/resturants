import { getPublicDocument } from "@/lib/platform/public-settings";
import { LegalPage } from "@/components/legal/legal-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ommaviy oferta | Dasturxon" };
export default async function OfferPage() {
  return <LegalPage kind="offer" document={await getPublicDocument("offer")} />;
}
