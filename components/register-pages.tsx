"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ImageIcon, ShieldCheck, Sparkles, Upload, UserPlus, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RegisterRole = "customer" | "partner" | "admin";

const initialCustomer = {
  name: "",
  phone: "",
  email: "",
  password: "",
  addressTitle: "",
  addressSubtitle: "Kota Padang, Sumatera Barat",
  profilePhoto: ""
};

const initialPartner = {
  ownerName: "",
  phone: "",
  email: "",
  password: "",
  businessName: "",
  category: "",
  serviceArea: "Kota Padang",
  businessAddress: "",
  priceFrom: "",
  servicePhoto: "",
  selfPhoto: "",
  ktpPhoto: "",
  portfolio: ""
};

const initialAdmin = {
  name: "",
  email: "",
  password: "",
  profilePhoto: ""
};

export function RegisterPage({ role }: { role: RegisterRole }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initialCustomer);
  const [partner, setPartner] = useState(initialPartner);
  const [admin, setAdmin] = useState(initialAdmin);
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message: string }>({ kind: "idle", message: "" });
  const [saving, setSaving] = useState(false);
  const [adminCanRegister, setAdminCanRegister] = useState(role !== "admin");
  const [checkingAdmin, setCheckingAdmin] = useState(role === "admin");
  const isPartner = role === "partner";
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    fetch("/api/register/admin", { cache: "no-store" })
      .then((response) => readResponseJson(response))
      .then((payload) => {
        if (active) setAdminCanRegister(Boolean(payload?.data?.canRegister));
      })
      .catch(() => {
        if (active) setAdminCanRegister(false);
      })
      .finally(() => {
        if (active) setCheckingAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const submit = async () => {
    setSaving(true);
    setStatus({ kind: "idle", message: "" });
    try {
      const response = await fetch(isAdmin ? "/api/register/admin" : isPartner ? "/api/register/partner" : "/api/register/customer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isAdmin ? admin : isPartner ? { ...partner, priceFrom: Number(partner.priceFrom || 0) } : customer)
      });
      const payload = await readResponseJson(response);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Pendaftaran gagal.");
      setStatus({
        kind: "success",
        message: isAdmin
          ? "Akun admin pertama berhasil dibuat. Mengalihkan ke halaman login admin..."
          : isPartner
          ? "Pendaftaran partner terkirim. Admin akan verifikasi dokumen sebelum akun bisa menerima order."
          : "Akun customer berhasil dibuat. Mengalihkan ke halaman login customer..."
      });
      setCustomer(initialCustomer);
      setPartner(initialPartner);
      setAdmin(initialAdmin);
      window.setTimeout(() => router.push(`/login/${role}`), 900);
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Pendaftaran gagal." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="safe-x min-h-dvh bg-cloud py-5 text-slate-950">
      <div className="mx-auto w-full max-w-[760px]">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-extrabold text-navy">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="mb-4 rounded-[18px] bg-navy p-4 text-white shadow-soft sm:p-5">
          <p className="text-xs font-bold text-white/65">{isAdmin ? "PENDAFTARAN ADMIN" : isPartner ? "PENDAFTARAN PARTNER" : "PENDAFTARAN CUSTOMER"}</p>
          <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">{isAdmin ? "Buat admin pertama" : isPartner ? "Gabung sebagai penyedia jasa" : "Buat akun customer"}</h1>
          <p className="mt-2 text-sm text-white/70">
            {isAdmin ? "Hanya satu admin pertama yang bisa dibuat untuk mengelola SERJAFAN." : isPartner ? "Lengkapi data usaha dan dokumen verifikasi." : "Daftar cepat untuk mencari jasa di Kota Padang."}
          </p>
        </div>

        {isAdmin && !checkingAdmin && !adminCanRegister ? (
          <Card className="rounded-[18px] border-slate-100">
            <CardContent className="grid gap-3 p-4 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-flame" />
              <h2 className="text-lg font-extrabold text-navy">Admin sudah ada</h2>
              <p className="text-sm leading-6 text-slate-500">
                SERJAFAN hanya mengizinkan satu akun admin. Pendaftaran admin baru sudah ditutup.
              </p>
              <Link href="/login/admin" className="inline-flex h-11 items-center justify-center rounded-[14px] bg-navy text-sm font-extrabold text-white">
                Kembali ke Login Admin
              </Link>
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
          <Card className="rounded-[18px] border-slate-100">
            <CardContent className="grid gap-3 p-4">
              {isAdmin ? (
                <>
                  <Field label="Nama Admin" value={admin.name} onChange={(value) => setAdmin((current) => ({ ...current, name: value }))} />
                  <Field label="Email Admin" type="email" value={admin.email} onChange={(value) => setAdmin((current) => ({ ...current, email: value }))} />
                  <Field label="Password" type="password" value={admin.password} onChange={(value) => setAdmin((current) => ({ ...current, password: value }))} />
                  <PhotoField label="Foto Profil Admin" value={admin.profilePhoto} onChange={(value) => setAdmin((current) => ({ ...current, profilePhoto: value }))} />
                </>
              ) : isPartner ? (
                <>
                  <Field label="Nama Pemilik" value={partner.ownerName} onChange={(value) => setPartner((current) => ({ ...current, ownerName: value }))} />
                  <Field label="Nomor HP Aktif" value={partner.phone} onChange={(value) => setPartner((current) => ({ ...current, phone: value }))} />
                  <Field label="Email" type="email" value={partner.email} onChange={(value) => setPartner((current) => ({ ...current, email: value }))} />
                  <Field label="Password" type="password" value={partner.password} onChange={(value) => setPartner((current) => ({ ...current, password: value }))} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Nama Usaha/Jasa" value={partner.businessName} onChange={(value) => setPartner((current) => ({ ...current, businessName: value }))} />
                    <Field label="Kategori Jasa" value={partner.category} onChange={(value) => setPartner((current) => ({ ...current, category: value }))} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Area Layanan" value={partner.serviceArea} onChange={(value) => setPartner((current) => ({ ...current, serviceArea: value }))} />
                    <Field label="Harga Mulai" inputMode="numeric" value={partner.priceFrom} onChange={(value) => setPartner((current) => ({ ...current, priceFrom: value }))} />
                  </div>
                  <Field label="Alamat Usaha / Titik Operasional" value={partner.businessAddress} onChange={(value) => setPartner((current) => ({ ...current, businessAddress: value }))} />
                  <PhotoField label="Foto Jasa / Tempat Usaha" value={partner.servicePhoto} required onChange={(value) => setPartner((current) => ({ ...current, servicePhoto: value }))} />
                  <PhotoField label="Foto Diri Pemilik" value={partner.selfPhoto} required onChange={(value) => setPartner((current) => ({ ...current, selfPhoto: value }))} />
                  <PhotoField label="Foto KTP" value={partner.ktpPhoto} required onChange={(value) => setPartner((current) => ({ ...current, ktpPhoto: value }))} />
                  <PhotoField label="Portofolio / Contoh Hasil Kerja" value={partner.portfolio} onChange={(value) => setPartner((current) => ({ ...current, portfolio: value }))} />
                </>
              ) : (
                <>
                  <Field label="Nama Lengkap" value={customer.name} onChange={(value) => setCustomer((current) => ({ ...current, name: value }))} />
                  <Field label="Nomor HP Aktif" value={customer.phone} onChange={(value) => setCustomer((current) => ({ ...current, phone: value }))} />
                  <Field label="Email" type="email" value={customer.email} onChange={(value) => setCustomer((current) => ({ ...current, email: value }))} />
                  <Field label="Password" type="password" value={customer.password} onChange={(value) => setCustomer((current) => ({ ...current, password: value }))} />
                  <Field label="Alamat Utama" value={customer.addressTitle} onChange={(value) => setCustomer((current) => ({ ...current, addressTitle: value }))} />
                  <Field label="Keterangan Alamat" value={customer.addressSubtitle} onChange={(value) => setCustomer((current) => ({ ...current, addressSubtitle: value }))} />
                  <PhotoField label="Foto Profil Customer" value={customer.profilePhoto} onChange={(value) => setCustomer((current) => ({ ...current, profilePhoto: value }))} />
                </>
              )}

              {status.kind !== "idle" && (
                <div className={`rounded-[14px] p-3 text-sm font-bold ${status.kind === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {status.message}
                </div>
              )}

              <Button variant="orange" size="lg" onClick={submit} disabled={saving}>
                <UserPlus className="h-4 w-4" /> {saving ? "Menyimpan..." : isAdmin ? "Buat Admin Pertama" : isPartner ? "Kirim Pendaftaran Partner" : "Buat Akun Customer"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {(isAdmin
              ? [
                  ["Admin tunggal", "Hanya pendaftar admin pertama yang diterima."],
                  ["Login wajib", "Setelah daftar, admin masuk lewat halaman login admin."],
                  ["Akses penuh", "Admin mengatur customer, partner, layanan, promo, dan verifikasi."]
                ]
              : isPartner
              ? [
                  ["Foto jasa/tempat usaha", "Wajib untuk membuktikan layanan."],
                  ["Foto diri pemilik", "Wajib untuk identitas partner."],
                  ["Foto KTP", "Wajib untuk verifikasi admin."],
                  ["Portofolio", "Opsional, membantu admin menilai layanan."]
                ]
              : [
                  ["Data dasar", "Nama, HP, email, dan password."],
                  ["Alamat utama", "Dipakai untuk titik pesanan awal."],
                  ["Tanpa KTP awal", "Customer dibuat mudah seperti aplikasi on-demand."]
                ]
            ).map(([title, body]) => (
              <div key={title} className="rounded-[16px] bg-white p-4 shadow-soft">
                <div className="mb-2 flex items-center gap-2">
                  {isPartner ? <FileText className="h-4 w-4 text-flame" /> : <ShieldCheck className="h-4 w-4 text-flame" />}
                  <p className="text-sm font-extrabold">{title}</p>
                </div>
                <p className="text-xs leading-5 text-slate-500">{body}</p>
              </div>
            ))}
            <Link href={isAdmin ? "/login/admin" : isPartner ? "/login/partner" : "/login/customer"} className="rounded-[16px] bg-white p-4 text-sm font-extrabold text-navy shadow-soft">
              {isPartner ? <Sparkles className="mr-2 inline h-4 w-4" /> : <Wrench className="mr-2 inline h-4 w-4" />}
              Sudah punya akun? Login
            </Link>
          </div>
        </div>
        )}
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
    return {
      error: {
        message: "Server mengirim response tidak valid. Saya sudah cegah error kosong, coba ulangi setelah database production aktif."
      }
    };
  }
}

function fileToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("File harus berupa gambar."));
  if (file.size > 1_500_000) return Promise.reject(new Error("Ukuran foto maksimal 1.5 MB agar aman dikirim."));

  return createImageBitmap(file).then((bitmap) => {
    const canvas = document.createElement("canvas");
    const maxSide = 720;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Foto gagal diproses.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return new Promise<string>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Foto gagal dikompres."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Foto gagal dibaca."));
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.72
      );
    });
  });
}

function PhotoField({
  label,
  value,
  onChange,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [error, setError] = useState("");

  const pickPhoto = async (file?: File) => {
    setError("");
    if (!file) return;
    try {
      onChange(await fileToDataUrl(file));
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Foto gagal dipilih.");
    }
  };

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase text-slate-500">
        {label} {required ? <span className="text-flame">*</span> : null}
      </span>
      <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-3">
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value} alt={label} className="h-20 w-20 rounded-[14px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-800">Foto sudah dipilih</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Ganti foto bila belum jelas atau kurang sesuai.</p>
            </div>
            <Button type="button" size="icon" variant="outline" className="border-2 border-red-600 text-red-600" onClick={() => onChange("")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-orange-50 text-flame">
              <ImageIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-800">Pilih foto langsung</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">JPG/PNG, maksimal 1.5 MB.</p>
            </div>
          </div>
        )}
        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id={`photo-${label.replaceAll(" ", "-").toLowerCase()}`}
            onChange={(event) => void pickPhoto(event.target.files?.[0])}
          />
          <label
            htmlFor={`photo-${label.replaceAll(" ", "-").toLowerCase()}`}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-navy px-4 text-xs font-extrabold text-white"
          >
            <Upload className="h-4 w-4" /> {value ? "Ganti Foto" : "Upload Foto"}
          </label>
        </div>
        {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
      </div>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "search" | "url";
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase text-slate-500">{label}</span>
      <Input value={value} type={type} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
