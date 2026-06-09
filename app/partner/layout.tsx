import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SERJAFAN Partner",
  description: "Aplikasi partner SERJAFAN untuk menerima pesanan, mengatur status, top up deposit, chat, dan navigasi customer.",
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
