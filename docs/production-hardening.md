# SERJAFAN Production Hardening

## Yang Sudah Dipasang di Kode

- Security headers dan basic API rate limit melalui `middleware.ts`.
- Audit log database untuk top up, approval admin, perubahan setting, order accepted, order status, komisi, chat, backup, dan upload.
- Endpoint upload production-ready melalui Cloudinary: `POST /api/uploads`.
- Endpoint audit keuangan admin: `GET /api/admin/audit`.
- Endpoint export backup JSON admin: `GET /api/admin/backup`.
- Anti-spam dasar untuk chat dan batas ukuran upload.
- Production readiness check untuk Turso, auth, domain, Google Maps, Xendit, Cloudinary, dan web push.
- Automated business-rule tests untuk top up, komisi 20%, partner offline, dan pemisahan chat per order/partner.

## Secret Production Wajib di Vercel

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
SERJAFAN_REQUIRE_AUTH=1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

## Yang Tetap Butuh Aktivasi Eksternal

- Cloudinary/S3 harus dibuat dan secret dimasukkan ke Vercel sebelum file production benar-benar tersimpan di cloud.
- Monitoring error serius sebaiknya memakai Sentry/Logtail/Axiom karena Vercel log bawaan tidak cukup untuk audit panjang.
- Backup database otomatis harus diaktifkan di Turso atau dijadwalkan dari server/CI terpisah. Endpoint backup manual sudah ada, tetapi belum menggantikan backup terjadwal.
- Notifikasi web di HP tergantung izin browser, service worker, dan dukungan iOS/Android. Untuk bunyi/getar sekuat aplikasi seperti WhatsApp, SERJAFAN perlu native Android/iOS atau wrapper PWA dengan push yang benar.
- Fraud protection pembayaran real sebaiknya memakai webhook payment gateway resmi, verifikasi bukti manual oleh admin, limit nominal, dan audit log yang sudah dibuat.

## Validasi Sebelum Uji Mitra Real

1. `npm test`
2. `npm run build`
3. Cek `/api/production/status`
4. Isi secret Cloudinary dan VAPID di Vercel.
5. Buat backup database dari `/api/admin/backup` sebelum dan sesudah uji coba.
6. Uji manual: daftar customer, daftar partner, approve partner, top up manual, approve top up, partner online, customer order, partner accept, chat, telepon, selesai order, komisi terpotong, rating.
