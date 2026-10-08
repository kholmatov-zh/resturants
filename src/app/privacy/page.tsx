import { getPublicDocument } from "@/lib/platform/public-settings";
import { LegalPage } from "@/components/legal/legal-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Maxfiylik siyosati | Dasturxon" };
export default async function PrivacyPage() {
  return (
    <LegalPage kind="privacy" document={await getPublicDocument("privacy")} />
  );
}
