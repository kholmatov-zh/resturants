import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Dasturxon — restoraningiz uchun onlayn menu",
  description:
    "O‘zbekiston restoranlari uchun individual onlayn menu. QR-kod, taomlar, suratlar va narxlar — mehmoningiz telefonida.",
  openGraph: {
    title: "Dasturxon — onlayn menu",
    description: "Restoraningiz uslubidagi raqamli menu.",
    locale: "uz_UZ",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
