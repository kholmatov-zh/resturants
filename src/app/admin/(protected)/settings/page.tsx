import { requireAdmin } from "@/lib/auth/admin";
import {
  SettingsEditor,
  type SettingsRecord,
  type LegalRecord,
} from "@/components/admin/settings-editor";
export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [settings, documents] = await Promise.all([
    supabase.from("platform_settings").select("*").eq("id", true).single(),
    supabase.from("legal_documents").select("*").order("kind"),
  ]);
  if (settings.error || documents.error)
    throw new Error("Settings unavailable. Apply migration 202610090002.");
  return (
    <>
      <p className="eyebrow">НАСТРОЙКИ САЙТА</p>
      <h1>Контакты и документы</h1>
      <SettingsEditor
        settings={settings.data as SettingsRecord}
        documents={documents.data as LegalRecord[]}
      />
    </>
  );
}
