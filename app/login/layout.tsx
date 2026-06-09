import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login SERJAFAN",
  description: "Masuk ke aplikasi SERJAFAN sesuai peran akun.",
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
