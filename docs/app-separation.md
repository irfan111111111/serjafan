# SERJAFAN App Separation

SERJAFAN production dipisah menjadi tiga aplikasi route:

- Customer: `/customer`
- Partner: `/partner`
- Admin: `/admin`

Setiap aplikasi punya manifest PWA sendiri:

- `/manifest.customer.webmanifest`
- `/manifest.partner.webmanifest`
- `/manifest.admin.webmanifest`

Session browser juga dipisah agar login satu aplikasi tidak menimpa aplikasi lain:

- `serjafan-session-customer`
- `serjafan-session-partner`
- `serjafan-session-admin`

Route boundary:

- Customer hanya menjalankan alur customer.
- Partner hanya menjalankan dashboard partner, akun partner, top up partner, dan tracking order partner.
- Admin hanya menjalankan dashboard admin.
- Partner dan admin diberi `X-Robots-Tag: noindex, nofollow`.

Catatan:

Komponen UI inti masih berada di `components/serjafan-app.tsx` agar fitur bersama seperti chat, notifikasi, tracking, dan wallet tetap konsisten. Pemisahan dilakukan pada route, manifest, session, metadata, dan guard navigasi supaya tidak ada campur akun atau campur alur.
