import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://serjafan.my.id"),
  title: {
    default: "SERJAFAN | Layanan Jasa Profesional Padang",
    template: "%s | SERJAFAN"
  },
  description: "SERJAFAN adalah perusahaan layanan jasa Kota Padang untuk service AC, tukang kunci, cleaning service, cuci sepatu, dan kebutuhan harian lainnya dengan teknisi internal yang ditugaskan SERJAFAN.",
  keywords: ["SERJAFAN", "jasa Padang", "service AC Padang", "tukang kunci Padang", "cleaning service Padang", "cuci sepatu Padang"],
  applicationName: "SERJAFAN",
  authors: [{ name: "SERJAFAN" }],
  creator: "SERJAFAN",
  publisher: "SERJAFAN",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "SERJAFAN | Layanan Jasa Profesional Padang",
    description: "Pesan jasa harian di Kota Padang. SERJAFAN menerima order, menugaskan teknisi internal, mengelola pembayaran, tracking, dan bantuan customer.",
    url: "https://serjafan.my.id",
    siteName: "SERJAFAN",
    images: ["/serjafan-logo.png"],
    locale: "id_ID",
    type: "website"
  },
  icons: {
    icon: "/serjafan-logo.png",
    apple: "/serjafan-logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
