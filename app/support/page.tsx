import { LegalPage } from "@/components/legal-page";

export default function SupportPage() {
  return (
    <LegalPage
      title="Pusat Bantuan SERJAFAN"
      updatedAt="7 Juni 2026"
      intro="Halaman ini menjelaskan jalur bantuan awal untuk customer, teknisi jaringan, dan admin operasional SERJAFAN."
      sections={[
        {
          title: "Bantuan customer",
          body: [
            "Customer dapat meminta bantuan untuk login, pendaftaran, pemesanan jasa, tracking, chat, telepon, pembayaran, promo, wallet, dan refund.",
            "Sertakan email akun, nomor pesanan jika ada, bukti pembayaran, dan ringkasan masalah agar admin dapat memeriksa lebih cepat."
          ]
        },
        {
          title: "Bantuan teknisi",
          body: [
            "Teknisi dapat meminta bantuan untuk verifikasi dokumen, status online, saldo kerja minimum, tugas masuk, komisi, penarikan dana, dan laporan customer.",
            "Teknisi wajib menjaga kualitas layanan dan memperbarui data jasa agar operasional SERJAFAN menerima informasi yang benar."
          ]
        },
        {
          title: "Bantuan admin",
          body: [
            "Admin bertanggung jawab memantau customer, teknisi, pesanan, wallet, promo, layanan, maps, dan sengketa.",
            "Perubahan konfigurasi admin harus dilakukan dengan hati-hati karena langsung memengaruhi aplikasi customer dan teknisi."
          ]
        },
        {
          title: "Kontak resmi",
          body: [
            "Nomor support resmi harus diisi melalui pengaturan admin sebelum launch publik.",
            "Jangan meminta password, OTP, token database, secret Xendit, atau API key Google Maps melalui chat customer maupun teknisi."
          ]
        }
      ]}
    />
  );
}
