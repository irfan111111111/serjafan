import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SERJAFAN Super App",
  description: "Frontend prototype for the SERJAFAN customer, partner, and admin apps."
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
