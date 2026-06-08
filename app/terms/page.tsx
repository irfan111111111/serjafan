import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat dan Ketentuan"
      updatedAt="7 Juni 2026"
      intro="Dokumen ini mengatur penggunaan aplikasi SERJAFAN oleh customer, partner, dan admin operasional."
      sections={[
        {
          title: "Akun dan akses",
          body: [
            "Pengguna wajib memberikan data yang benar saat mendaftar. Customer menggunakan aplikasi untuk memesan jasa, partner menggunakan aplikasi untuk menerima pekerjaan, dan admin mengelola operasional serta verifikasi.",
            "Partner hanya boleh menerima pesanan setelah akun disetujui admin dan memenuhi saldo kerja minimum yang ditentukan aplikasi."
          ]
        },
        {
          title: "Pesanan dan penyelesaian jasa",
          body: [
            "Setiap pesanan harus dikonfirmasi oleh partner sebelum masuk ke proses kerja. Customer dan partner wajib menggunakan fitur chat, telepon, dan tracking secara bertanggung jawab.",
            "Status selesai hanya boleh digunakan setelah jasa benar-benar diterima customer atau pekerjaan telah diselesaikan sesuai kesepakatan."
          ]
        },
        {
          title: "Biaya dan komisi",
          body: [
            "Biaya layanan, biaya platform, promo, dan komisi partner mengikuti konfigurasi yang ditetapkan oleh admin SERJAFAN.",
            "Komisi platform saat ini disiapkan sebesar 20% dari pendapatan partner pada pesanan selesai, dengan mekanisme pemotongan melalui saldo partner."
          ]
        },
        {
          title: "Pelanggaran",
          body: [
            "SERJAFAN dapat membatasi, menonaktifkan, atau menolak akun yang memberikan data palsu, menyalahgunakan transaksi, melakukan penipuan, atau merugikan customer maupun partner.",
            "Sengketa operasional akan ditangani melalui support SERJAFAN berdasarkan data pesanan, riwayat chat, tracking, dan bukti pembayaran."
          ]
        }
      ]}
    />
  );
}
