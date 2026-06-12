import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ChevronRight, MapPin, MessageCircle, Navigation, ShieldCheck, Star } from "lucide-react";
import { getServiceSeoItem, serviceSeoItems } from "@/lib/service-seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return serviceSeoItems.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceSeoItem(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.description,
    alternates: {
      canonical: `/layanan/${service.slug}`
    },
    openGraph: {
      title: `${service.title} | SERJAFAN`,
      description: service.description,
      images: [service.image],
      locale: "id_ID",
      type: "website"
    }
  };
}

export default async function ServiceSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceSeoItem(slug);
  if (!service) notFound();

  const related = serviceSeoItems.filter((item) => item.slug !== service.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#061b56] via-[#0d47d9] to-[#003cb5] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,213,74,0.22),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-white/80">
              SERJAFAN <ChevronRight className="h-4 w-4" /> Layanan
            </Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#ffd54a]">
              <MapPin className="h-4 w-4" /> Kota Padang
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-6xl">{service.title}</h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/82">{service.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/customer" className="inline-flex h-12 items-center justify-center rounded-full bg-[#ffd54a] px-6 text-sm font-black text-slate-950">
                Pesan Sekarang
              </Link>
              <Link href="/support" className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 text-sm font-black text-white">
                Hubungi Admin
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-[30px] border border-white/15 bg-white/10 p-3 shadow-[0_26px_70px_rgba(0,0,0,0.25)] backdrop-blur">
            <img src={service.image} alt={service.title} className="h-72 w-full rounded-[24px] bg-white object-cover" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["4.9", "Rating"],
                ["Padang", "Area"],
                [service.price.replace("Mulai dari ", ""), "Estimasi"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-[18px] bg-white/12 p-3 text-center">
                  <p className="text-lg font-black">{value}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8 md:grid-cols-[0.9fr_1.1fr] md:px-6">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Keunggulan</p>
          <h2 className="mt-1 text-2xl font-black">Kenapa lewat SERJAFAN?</h2>
          <div className="mt-5 space-y-3">
            {service.highlights.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[18px] bg-[#f8fbff] p-3">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-black">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">Alur pesanan</p>
          <h2 className="mt-1 text-2xl font-black">Dari cari mitra sampai pekerjaan selesai.</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { Icon: ShieldCheck, title: "Pilih layanan", body: "Customer memilih jasa dan mitra yang tersedia." },
              { Icon: MessageCircle, title: "Chat mitra", body: "Detail pekerjaan bisa dibahas lewat chat." },
              { Icon: Navigation, title: "Tracking", body: "Lokasi dan status pesanan bisa dipantau." },
              { Icon: Star, title: "Ulasan", body: "Customer memberi rating setelah selesai." }
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-[18px] bg-[#f8fbff] p-4">
                <Icon className="h-6 w-6 text-[#0d47d9]" />
                <h3 className="mt-3 text-sm font-black">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 md:px-6">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0d47d9]">FAQ</p>
          <h2 className="mt-1 text-2xl font-black">Pertanyaan tentang {service.shortTitle}</h2>
          <div className="mt-5 space-y-3">
            {service.faq.map((item) => (
              <details key={item.q} className="rounded-[18px] bg-[#f8fbff] p-4">
                <summary className="cursor-pointer list-none text-sm font-black">{item.q}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 md:px-6">
        <div className="rounded-[28px] bg-gradient-to-br from-[#0d47d9] to-[#003cb5] p-5 text-white">
          <h2 className="text-2xl font-black">Layanan lain di SERJAFAN</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link key={item.slug} href={`/layanan/${item.slug}`} className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
