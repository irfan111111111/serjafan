import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat dan Ketentuan"
      updatedAt="7 Juni 2026"
      intro="Dokumen ini mengatur penggunaan aplikasi SERJAFAN oleh customer dan admin operasional SERJAFAN."
      sections={[
        {
          title: "Akun dan akses",
          body: [
            "Pengguna wajib memberikan data yang benar saat mengisi profil atau membuat pesanan. Customer menggunakan aplikasi untuk memesan jasa kepada SERJAFAN.",
            "Admin SERJAFAN mengelola order, menghubungi customer, menugaskan teknisi lapangan, memantau kualitas layanan, dan mengatur konfigurasi aplikasi."
          ]
        },
        {
          title: "Pesanan dan penyelesaian jasa",
          body: [
            "Setiap pesanan diterima oleh SERJAFAN untuk diperiksa terlebih dahulu sebelum teknisi lapangan ditugaskan. Customer berkomunikasi dengan SERJAFAN melalui fitur bantuan, chat, telepon, atau kontak resmi.",
            "Status selesai hanya boleh digunakan setelah jasa benar-benar diterima customer atau pekerjaan telah diselesaikan sesuai kesepakatan."
          ]
        },
        {
          title: "Biaya dan pembayaran",
          body: [
            "Biaya layanan, biaya platform, promo, dan metode pembayaran mengikuti konfigurasi yang ditetapkan oleh admin SERJAFAN.",
            "Pembayaran manual dilakukan ke rekening atau DANA resmi SERJAFAN yang tampil di aplikasi, kemudian bukti transfer diverifikasi oleh admin."
          ]
        },
        {
          title: "Pelanggaran",
          body: [
            "SERJAFAN dapat membatasi, menonaktifkan, atau menolak akun yang memberikan data palsu, menyalahgunakan transaksi, melakukan penipuan, atau merugikan customer maupun operasional SERJAFAN.",
            "Sengketa operasional akan ditangani melalui support SERJAFAN berdasarkan data pesanan, riwayat chat, tracking, dan bukti pembayaran."
          ]
        }
      ]}
    />
  );
}
