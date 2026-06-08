import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SERJAFAN Super App",
  description: "Aplikasi layanan SERJAFAN untuk customer, partner, dan admin operasional.",
  manifest: "/manifest.webmanifest",
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
