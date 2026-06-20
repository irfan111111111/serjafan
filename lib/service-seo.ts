export type ServiceSeoItem = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string;
  price: string;
  highlights: string[];
  faq: Array<{ q: string; a: string }>;
};

export const serviceSeoItems: ServiceSeoItem[] = [
  {
    slug: "service-ac-padang",
    title: "Service AC Padang",
    shortTitle: "Service AC",
    description:
      "Pesan service AC di Kota Padang untuk cuci AC, AC tidak dingin, bocor, berisik, atau pengecekan rutin. SERJAFAN menerima order dan menugaskan teknisi internal.",
    image: "/service-ac.svg",
    price: "Mulai dari Rp 100.000",
    highlights: ["Teknisi SERJAFAN terseleksi", "Chat support dan tracking pesanan", "Bisa bayar tunai atau transfer manual", "Riwayat pesanan tercatat"],
    faq: [
      { q: "Apakah teknisi bisa datang ke rumah?", a: "Ya, customer memasukkan alamat lengkap lalu SERJAFAN menugaskan teknisi internal ke lokasi." },
      { q: "Apakah bisa chat teknisi?", a: "Customer berkomunikasi dengan SERJAFAN. Tim operasional meneruskan instruksi ke teknisi internal." },
      { q: "Bagaimana pembayaran service AC?", a: "Pembayaran dikelola SERJAFAN melalui transfer ke rekening/DANA resmi SERJAFAN dengan upload bukti, atau bayar di tempat setelah pekerjaan selesai." }
    ]
  },
  {
    slug: "tukang-kunci-padang",
    title: "Tukang Kunci Padang",
    shortTitle: "Tukang Kunci",
    description:
      "Butuh bantuan kunci rumah, kunci kendaraan, atau duplikat kunci di Padang? SERJAFAN menerima permintaan dan menugaskan teknisi kunci internal.",
    image: "/service-locksmith.svg",
    price: "Mulai dari Rp 50.000",
    highlights: ["Cocok untuk kondisi darurat", "SERJAFAN mengatur penugasan", "Lokasi customer terbaca maps", "Customer menghubungi SERJAFAN"],
    faq: [
      { q: "Apakah tukang kunci tersedia untuk panggilan?", a: "Ya, customer membuat pesanan dan SERJAFAN menugaskan teknisi yang tersedia." },
      { q: "Apakah bisa melihat status teknisi?", a: "Aplikasi menyediakan tracking pesanan dan tombol Google Maps sesuai data lokasi order." },
      { q: "Apakah ada rating layanan?", a: "Setelah pekerjaan selesai, customer dapat memberi rating dan ulasan untuk layanan SERJAFAN." }
    ]
  },
  {
    slug: "cuci-sepatu-padang",
    title: "Cuci Sepatu Padang",
    shortTitle: "Cuci Sepatu",
    description:
      "Layanan cuci sepatu Padang untuk sepatu harian, sneakers, dan perawatan ringan dengan pemesanan yang tercatat di SERJAFAN.",
    image: "/service-electrician.svg",
    price: "Mulai dari Rp 25.000",
    highlights: ["Pesanan mudah dari HP", "Catatan kebutuhan bisa ditulis", "Bukti pembayaran dapat diupload", "Admin SERJAFAN memantau order"],
    faq: [
      { q: "Apakah sepatu bisa dijemput?", a: "Alur penjemputan mengikuti pilihan layanan dan arahan operasional SERJAFAN." },
      { q: "Apakah bisa kirim foto sepatu?", a: "Chat aplikasi mendukung lampiran foto untuk memperjelas kebutuhan." },
      { q: "Bagaimana jika hasil belum sesuai?", a: "Customer menghubungi SERJAFAN agar admin membantu memantau dan menyelesaikan kendala." }
    ]
  },
  {
    slug: "cleaning-service-padang",
    title: "Cleaning Service Padang",
    shortTitle: "Cleaning Service",
    description:
      "Pesan cleaning service di Padang untuk rumah, kos, kantor kecil, atau kebutuhan bersih-bersih dengan tim layanan SERJAFAN.",
    image: "/service-electrician.svg",
    price: "Mulai dari Rp 80.000",
    highlights: ["Tim layanan terseleksi", "Order dipantau admin", "Chat customer dengan SERJAFAN", "Rating setelah pekerjaan selesai"],
    faq: [
      { q: "Apakah cleaning bisa datang sesuai alamat?", a: "Ya, customer harus mengisi alamat lengkap agar lokasi bisa dibaca di maps." },
      { q: "Apakah bisa bayar tunai?", a: "Bisa jika metode tunai tersedia untuk pesanan tersebut." },
      { q: "Apakah teknisi diverifikasi?", a: "SERJAFAN menyiapkan alur pendaftaran dan verifikasi teknisi melalui dashboard admin." }
    ]
  }
];

export function getServiceSeoItem(slug: string) {
  return serviceSeoItems.find((item) => item.slug === slug);
}
