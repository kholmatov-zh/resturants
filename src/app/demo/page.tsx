import type { Metadata } from "next";
import { DemoCatalogue } from "@/components/restaurant/demo-catalogue";
export const metadata: Metadata = {
  title: "Demo menyular | Dasturxon",
  robots: { index: false, follow: false },
};
export default function DemoPage() {
  return <DemoCatalogue />;
}
