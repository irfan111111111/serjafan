import { LegalPage } from "@/components/legal-page";

export default function RefundPage() {
  return (
    <LegalPage
      title="Kebijakan Refund dan Sengketa"
      updatedAt="7 Juni 2026"
      intro="Kebijakan ini menjadi dasar awal penanganan transaksi gagal, pembatalan pesanan, dan sengketa customer-partner."
      sections={[
        {
          title: "Transaksi top up",
          body: [
            "Top up yang berhasil dibayar melalui gateway resmi akan masuk ke wallet pengguna setelah webhook payment diterima dan diverifikasi server.",
            "Jika saldo belum masuk setelah pembayaran valid, pengguna dapat menghubungi support dengan bukti pembayaran dan email akun."
          ]
        },
        {
          title: "Pembatalan pesanan",
          body: [
            "Pesanan yang belum dikonfirmasi partner dapat dibatalkan sesuai kebijakan operasional SERJAFAN.",
            "Pesanan yang sudah berjalan akan diperiksa berdasarkan status pekerjaan, lokasi, riwayat chat, dan bukti penyelesaian."
          ]
        },
        {
          title: "Sengketa jasa",
          body: [
            "Customer dan partner wajib menyampaikan bukti yang benar. Admin dapat menahan penyelesaian pesanan sampai sengketa diperiksa.",
            "Keputusan refund, pengembalian saldo, atau pelepasan pembayaran mengikuti hasil pemeriksaan admin."
          ]
        },
        {
          title: "Penyalahgunaan",
          body: [
            "Refund dapat ditolak jika ditemukan manipulasi bukti, penyalahgunaan promo, transaksi fiktif, atau pelanggaran ketentuan aplikasi.",
            "Akun yang terbukti melakukan penyalahgunaan dapat dibatasi atau dinonaktifkan."
          ]
        }
      ]}
    />
  );
}
