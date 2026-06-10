"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginRole = "customer" | "partner" | "admin";

const roleMeta = {
  customer: {
    apiRole: "CUSTOMER",
    title: "Login Customer",
    description: "Masuk untuk pesan jasa, bayar, pesan mitra, dan tracking.",
    home: "/customer",
    register: "/register/customer"
  },
  partner: {
    apiRole: "PARTNER",
    title: "Login Partner",
    description: "Masuk untuk menerima pesanan, pesan customer, dan mengatur akun jasa.",
    home: "/partner",
    register: "/register/partner"
  },
  admin: {
    apiRole: "ADMIN",
    title: "Login Admin",
    description: "Masuk sebagai admin tunggal SERJAFAN.",
    home: "/admin",
    register: "/register/admin"
  }
} as const;

const sessionStorageKey = (role: "CUSTOMER" | "PARTNER" | "ADMIN") => `serjafan-session-${role.toLowerCase()}`;

export function LoginPage({ role }: { role: LoginRole }) {
  const router = useRouter();
  const meta = roleMeta[role];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message: string }>({ kind: "idle", message: "" });
  const [saving, setSaving] = useState(false);
  const [adminCanRegister, setAdminCanRegister] = useState(role !== "admin");

  useEffect(() => {
    if (role !== "admin") return;
    let active = true;
    fetch("/api/register/admin", { cache: "no-store" })
      .then((response) => readResponseJson(response))
      .then((payload) => {
        if (active) setAdminCanRegister(Boolean(payload?.data?.canRegister));
      })
      .catch(() => {
        if (active) setAdminCanRegister(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const submit = async () => {
    setSaving(true);
    setStatus({ kind: "idle", message: "" });
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, role: meta.apiRole })
      });
      const payload = await readResponseJson(response);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Login gagal.");

      const session = payload.data.session;
      window.localStorage.setItem(sessionStorageKey(session.role), JSON.stringify(session));
      setStatus({ kind: "success", message: "Login berhasil. Mengalihkan ke beranda..." });
      window.setTimeout(() => router.push(session.home ?? meta.home), 500);
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Login gagal." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="safe-x min-h-dvh bg-cloud py-5 text-slate-950">
      <div className="mx-auto w-full max-w-[520px]">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-extrabold text-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="mb-4 rounded-[18px] bg-navy p-4 text-white shadow-soft sm:p-5">
          <p className="text-xs font-bold text-white/65">SERJAFAN AKUN</p>
          <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">{meta.title}</h1>
          <p className="mt-2 text-sm text-white/70">{meta.description}</p>
        </div>

        <Card className="rounded-[18px] border-slate-100">
          <CardContent className="grid gap-3 p-4">
            <Field label="ID / Email" type="email" value={email} onChange={setEmail} />
            <Field label="Sandi / Password" type="password" value={password} onChange={setPassword} />

            {status.kind !== "idle" && (
              <div className={`rounded-[14px] p-3 text-sm font-bold ${status.kind === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {status.message}
              </div>
            )}

            <Button variant="orange" size="lg" onClick={submit} disabled={saving}>
              <LogIn className="h-4 w-4" /> {saving ? "Memeriksa..." : "Masuk"}
            </Button>
            {role !== "admin" || adminCanRegister ? (
              <Link href={meta.register} className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border-2 border-navy text-sm font-extrabold text-navy">
                {role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {role === "admin" ? "Daftar admin pertama" : "Belum punya akun? Daftar"}
              </Link>
            ) : (
              <div className="rounded-[14px] bg-slate-50 p-3 text-center text-xs font-bold leading-5 text-slate-500">
                Admin SERJAFAN sudah dibuat. Aplikasi admin hanya memiliki satu akun admin.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

async function readResponseJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: "Server mengirim response tidak valid." } };
  }
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
