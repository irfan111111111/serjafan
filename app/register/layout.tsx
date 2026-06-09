import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar SERJAFAN",
  description: "Pendaftaran customer, partner, dan admin SERJAFAN.",
  robots: {
    index: false,
    follow: false
  }
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
