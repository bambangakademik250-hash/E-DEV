# E-Ujian CBT — Platform Ujian Online &amp; Offline

Aplikasi PWA untuk mengelola ujian berbasis komputer: dashboard, CRUD peserta,
CRUD mata kuliah/ujian, dan monitor status peserta. Aplikasi tetap bisa dibuka
dan dipakai tanpa koneksi — data disimpan di IndexedDB dan perubahan dikirim ke
server saat koneksi kembali.

## Stack

- `client/` — React 19 + Vite + TypeScript, `vite-plugin-pwa` (manifest +
  service worker), `idb` untuk penyimpanan offline.
- `server/` — Express API dengan penyimpanan JSON (`/data/db.json`) dan endpoint
  sinkronisasi idempoten `POST /api/sync`.

## Menjalankan secara lokal

```bash
cd server && npm install && npm run dev   # API di :8000
cd client && npm install && npm run dev   # Web di :5173, proxy /api -> :8000
```

Build produksi: `cd client && npm run build` (menghasilkan `dist/` beserta
service worker).

## Cara kerja offline

1. Setiap perubahan (tambah/edit/hapus) ditulis ke IndexedDB lebih dulu, lalu
   masuk antrean `outbox`.
2. Bila server terjangkau, antrean dikirim ke `POST /api/sync` dan data terbaru
   ditarik dari `GET /api/state`.
3. Bila server tidak terjangkau, aplikasi tetap berjalan dengan data lokal,
   indikator header berubah menjadi **Mode Offline**, dan jumlah antrean
   ditampilkan. Sinkronisasi dicoba ulang setiap 20 detik dan saat event
   `online`.
4. Service worker menyimpan app shell sehingga halaman tetap terbuka setelah
   instalasi PWA.

Indikator "Terhubung" berarti API terjangkau; "Mode Offline" berarti data lokal
sedang dipakai dan perubahan menunggu dikirim.

## Struktur data

- `peserta`: nama, NIM, kelas, mata kuliah, status (`online`/`selesai`/`offline`),
  nilai, peringatan, waktu submit.
- `ujian`: nama mata kuliah, kode, tipe (UTS/UAS), jumlah soal, semester, status,
  ikon.
