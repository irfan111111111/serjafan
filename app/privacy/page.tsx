import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updatedAt="7 Juni 2026"
      intro="Kebijakan ini menjelaskan data yang diproses SERJAFAN untuk menjalankan layanan customer, partner, admin, pembayaran, dan tracking."
      sections={[
        {
          title: "Data yang dikumpulkan",
          body: [
            "SERJAFAN memproses data akun seperti nama, email, nomor telepon, foto profil, alamat, dokumen pendaftaran partner, riwayat pesanan, pesan, notifikasi, wallet, dan status transaksi.",
            "Untuk kebutuhan operasional, aplikasi dapat memproses lokasi customer dan partner ketika fitur tracking, penjemputan, pengantaran, atau panggilan jasa digunakan."
          ]
        },
        {
          title: "Penggunaan data",
          body: [
            "Data digunakan untuk membuat akun, verifikasi partner, menampilkan jasa, menghubungkan customer dengan partner, memproses pesanan, menangani pembayaran, dan menyelesaikan bantuan pelanggan.",
            "Admin hanya boleh mengakses data sesuai kebutuhan operasional, verifikasi, keamanan, dan penyelesaian sengketa."
          ]
        },
        {
          title: "Penyimpanan dan keamanan",
          body: [
            "Data production disimpan pada database cloud yang dikonfigurasi untuk aplikasi SERJAFAN. Secret payment, token database, dan konfigurasi server tidak boleh dibagikan ke publik.",
            "Foto dan dokumen partner harus digunakan hanya untuk proses verifikasi dan audit operasional."
          ]
        },
        {
          title: "Hak pengguna",
          body: [
            "Pengguna dapat meminta pembaruan data akun, bantuan akses, atau pemeriksaan transaksi melalui support resmi SERJAFAN.",
            "Permintaan penghapusan atau pembatasan data akan diproses sesuai kewajiban operasional, keamanan, dan hukum yang berlaku."
          ]
        }
      ]}
    />
  );
}
