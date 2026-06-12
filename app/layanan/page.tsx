import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, MapPin, Search, ShieldCheck, Star } from "lucide-react";
import { serviceSeoItems } from "@/lib/service-seo";

export const metadata: Metadata = {
  title: "Layanan Jasa Padang",
  description: "Daftar layanan jasa SERJAFAN di Kota Padang: service AC, tukang kunci, cuci sepatu, cleaning service, dan jasa harian lainnya.",
  alternates: {
    canonical: "/layanan"
  }
};

export default function ServicesIndexPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <section className="bg-gradient-to-br from-[#061b56] via-[#0d47d9] to-[#003cb5] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-white/80">
            SERJAFAN <ChevronRight className="h-4 w-4" /> Layanan Padang
          </Link>
          <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight md:text-5xl">Layanan jasa lokal SERJAFAN di Kota Padang</h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/78 md:text-base">
            Temukan layanan harian untuk rumah, kantor, kendaraan, dan kebutuhan mendadak dengan alur pemesanan yang rapi.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-8 md:grid-cols-2">
        {serviceSeoItems.map((service) => (
          <Link key={service.slug} href={`/layanan/${service.slug}`} className="group overflow-hidden rounded-[24px] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100 transition hover:-translate-y-0.5">
            <img src={service.image} alt={service.title} className="h-44 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">{service.title}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.9
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-black text-[#0d47d9]">
                  <MapPin className="h-3.5 w-3.5" /> Kota Padang
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Mitra lokal
                </span>
              </div>
              <span className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0d47d9] px-5 text-sm font-black text-white">
                Lihat Detail <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eef4ff] text-[#0d47d9]">
              <Search className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-black">Tidak menemukan jasa yang dicari?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Buka aplikasi customer dan gunakan pencarian layanan. Admin dapat menambah menu jasa baru dari dashboard admin.</p>
              <Link href="/customer" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#ffd54a] px-5 text-sm font-black text-slate-950">
                Buka Customer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
