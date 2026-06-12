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
      "Cari teknisi AC di Kota Padang untuk cuci AC, AC tidak dingin, bocor, berisik, atau butuh pengecekan rutin melalui SERJAFAN.",
    image: "/service-ac.svg",
    price: "Mulai dari Rp 100.000",
    highlights: ["Teknisi lokal Padang", "Chat dan tracking pesanan", "Bisa bayar tunai atau transfer", "Riwayat pesanan tercatat"],
    faq: [
      { q: "Apakah teknisi bisa datang ke rumah?", a: "Ya, customer bisa memasukkan alamat lengkap agar mitra melihat lokasi tujuan." },
      { q: "Apakah bisa chat teknisi?", a: "Bisa. Setelah pesanan dibuat, customer dan mitra dapat saling chat di aplikasi." },
      { q: "Bagaimana pembayaran service AC?", a: "Pembayaran dapat mengikuti metode yang tersedia: saldo SERJAFAN, transfer mitra, transfer admin, atau tunai." }
    ]
  },
  {
    slug: "tukang-kunci-padang",
    title: "Tukang Kunci Padang",
    shortTitle: "Tukang Kunci",
    description:
      "Butuh bantuan kunci rumah, kunci kendaraan, atau duplikat kunci di Padang? SERJAFAN membantu menghubungkan customer dengan mitra kunci lokal.",
    image: "/service-locksmith.svg",
    price: "Mulai dari Rp 50.000",
    highlights: ["Cocok untuk kondisi darurat", "Mitra bisa menerima atau menolak order", "Lokasi customer terbaca maps", "Bisa hubungi mitra langsung"],
    faq: [
      { q: "Apakah tukang kunci tersedia untuk panggilan?", a: "Ya, customer dapat membuat pesanan dan menunggu konfirmasi mitra." },
      { q: "Apakah bisa melihat posisi mitra?", a: "Aplikasi menyediakan tracking pesanan dan tombol Google Maps sesuai data lokasi order." },
      { q: "Apakah ada rating mitra?", a: "Setelah pekerjaan selesai, customer dapat memberi rating dan ulasan." }
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
    highlights: ["Pesanan mudah dari HP", "Catatan kebutuhan bisa ditulis", "Bukti pembayaran dapat diupload", "Admin dapat memantau order"],
    faq: [
      { q: "Apakah sepatu bisa dijemput?", a: "Alur penjemputan mengikuti pilihan layanan dan kesepakatan dengan mitra." },
      { q: "Apakah bisa kirim foto sepatu?", a: "Chat aplikasi mendukung lampiran foto untuk memperjelas kebutuhan." },
      { q: "Bagaimana jika hasil belum sesuai?", a: "Customer dapat menghubungi mitra atau CS agar admin membantu memantau kendala." }
    ]
  },
  {
    slug: "cleaning-service-padang",
    title: "Cleaning Service Padang",
    shortTitle: "Cleaning Service",
    description:
      "Pesan cleaning service di Padang untuk rumah, kos, kantor kecil, atau kebutuhan bersih-bersih dengan mitra lokal SERJAFAN.",
    image: "/service-electrician.svg",
    price: "Mulai dari Rp 80.000",
    highlights: ["Mitra lokal", "Order dapat dipantau admin", "Chat customer dan partner", "Rating setelah pekerjaan selesai"],
    faq: [
      { q: "Apakah cleaning bisa datang sesuai alamat?", a: "Ya, customer harus mengisi alamat lengkap agar lokasi bisa dibaca di maps." },
      { q: "Apakah bisa bayar tunai?", a: "Bisa jika metode tunai tersedia untuk pesanan tersebut." },
      { q: "Apakah mitra diverifikasi?", a: "SERJAFAN menyiapkan alur pendaftaran dan verifikasi mitra melalui dashboard admin." }
    ]
  }
];

export function getServiceSeoItem(slug: string) {
  return serviceSeoItems.find((item) => item.slug === slug);
}
