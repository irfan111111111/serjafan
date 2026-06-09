import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SERJAFAN Admin",
  description: "Dashboard admin SERJAFAN untuk operasional, verifikasi mitra, audit, wallet, maps, promo, dan konfigurasi.",
  manifest: "/manifest.admin.webmanifest",
  icons: {
    icon: "/serjafan-logo.png",
    apple: "/serjafan-logo.png"
  },
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a"
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
