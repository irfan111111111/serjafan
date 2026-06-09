import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SERJAFAN Customer",
  description: "Aplikasi customer SERJAFAN untuk cari jasa, pesan mitra, bayar, chat, telepon, dan tracking.",
  manifest: "/manifest.customer.webmanifest",
  icons: {
    icon: "/serjafan-logo.png",
    apple: "/serjafan-logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a"
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
