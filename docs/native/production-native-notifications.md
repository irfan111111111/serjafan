# SERJAFAN Native Notification Path

Website/PWA tidak bisa menjamin bunyi dan tampilan notifikasi sekuat WhatsApp pada semua HP. Android dan iOS membatasi browser untuk keamanan dan hemat baterai. Agar SERJAFAN punya notifikasi native yang kuat, jalur produksinya adalah membuat shell Android/iOS yang membungkus `https://serjafan.my.id`.

## Status Yang Sudah Siap

- PWA manifest production-ready di `public/manifest.webmanifest`.
- Service worker web push di `public/sw.js`.
- VAPID web push sudah didukung server.
- Shortcut Customer, Partner, Admin sudah ada di manifest.
- Notifikasi web punya action button, vibration pattern, dan `requireInteraction` untuk order/call.

## Jalur Android Paling Cepat

Gunakan Trusted Web Activity atau Capacitor.

Rekomendasi cepat:

1. Buat package Android: `id.serjafan.app`.
2. Arahkan start URL ke `https://serjafan.my.id`.
3. Aktifkan Firebase Cloud Messaging.
4. Tambahkan native bridge untuk menerima push FCM.
5. Tambahkan asset links di `public/.well-known/assetlinks.json` setelah SHA-256 signing key tersedia.
6. Build AAB dan upload ke Google Play Console.

## Jalur iOS

1. Buat Bundle ID: `id.serjafan.app`.
2. Gunakan Capacitor iOS atau WKWebView shell.
3. Aktifkan APNs di Apple Developer.
4. Tambahkan push entitlement.
5. Kirim token APNs ke backend SERJAFAN.
6. Build lewat Xcode dan submit ke App Store Connect.

## Env Native Yang Nanti Dibutuhkan

```env
NATIVE_ANDROID_PACKAGE=id.serjafan.app
NATIVE_IOS_BUNDLE_ID=id.serjafan.app
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_BUNDLE_ID=id.serjafan.app
```

## Keputusan Produksi

- Untuk uji terbatas: PWA sudah cukup.
- Untuk mitra lapangan skala besar: Android native/TWA wajib.
- Untuk nasional/internasional: Android + iOS native wajib, karena browser web tidak bisa menjamin notifikasi selalu bunyi saat app ditutup.
