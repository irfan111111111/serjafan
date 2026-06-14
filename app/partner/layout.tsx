import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SERJAFAN Teknisi",
  description: "Aplikasi teknisi jaringan SERJAFAN untuk menerima tugas operasional, mengatur status, top up deposit, chat operasional, dan navigasi customer.",
  manifest: "/manifest.partner.webmanifest",
  icons: {
    icon: "/serjafan-logo.png",
    apple: "/serjafan-logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a"
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
