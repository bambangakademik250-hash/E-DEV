# E-Ujian Nusantara — Ujian SCBT Online &amp; Offline

Aplikasi PWA asesmen berbasis komputer (SCBT) untuk sekolah, madrasah, kampus,
bimbel, dan pesantren. Seluruh isi aplikasi asal diklon: 8 modul, 3 peran
pengguna, 9 tipe soal, 4 mode ujian, sertifikat QR, dan penyimpanan offline-first.

## Modul

| Modul | Isi |
| --- | --- |
| Analitik & Evaluasi | Statistik peserta, ujian berlangsung, rata-rata nilai, distribusi grade, progress per kelas, performa mapel |
| Layar Ujian Peserta | Token masuk, timer, navigasi soal, penyimpanan jawaban otomatis, deteksi pindah tab, hasil ujian |
| Ujian & Bank Soal | CRUD sesi ujian (mode reguler/CAT/PDF/psikometrik, durasi/jadwal, KKM, token) dan CRUD 9 tipe soal |
| Monitor Proktor | Peserta live, progress jawaban, pelanggaran, jeda/lanjutkan, reset login |
| Kelas & Absensi | CRUD rombel dan presensi harian (hadir/izin/sakit/alfa) |
| Obrolan Grup | Pesan grup guru, operator, dan peserta |
| Laporan & Sertifikat | Rekap nilai, ekspor CSV, sertifikat kelulusan dengan kode QR & cetak |
| Pengaturan & Kontrol | Identitas, logo, ribon berjalan, keamanan, lokasi, akun pengguna, backup/restore, log aktivitas |

Peran: **Admin** (semua modul), **User/Guru** (analitik, ujian, monitor, kelas,
obrolan, laporan), **Peserta** (ujian peserta, obrolan, laporan). Akun demo:
`admin / admin123`, `user / user123`, `peserta / peserta123`.

## Stack

- `client/` — React 19 + Vite + TypeScript, `vite-plugin-pwa`, `idb` (IndexedDB).
- `server/` — Express API, satu dokumen workspace disimpan sebagai JSON
  (`/data/workspace.json`).

## Menjalankan secara lokal

```bash
cd server && npm install && npm run dev   # API di :8000
cd client && npm install && npm run dev   # Web di :5173, proxy /api -> :8000
```

Build produksi: `cd client && npm run build`. Type check: `npx tsc --noEmit`
di `client/`.

## Cara kerja offline

1. Seluruh data aplikasi adalah satu dokumen workspace di IndexedDB
   (database `eujian_nusantara`, store `workspace`).
2. Setiap perubahan ditulis ke IndexedDB lebih dulu, lalu dikirim ke
   `PUT /api/workspace` (debounce ~0,7 detik). Konflik diselesaikan
   *last-write-wins* berdasarkan `updatedAt`.
3. Setiap 20 detik dan saat event `online`, klien menarik
   `GET /api/workspace`; versi server dipakai bila `updatedAt`-nya lebih baru.
4. Bila API tidak terjangkau, header menampilkan **Mode Offline** dan aplikasi
   tetap berjalan penuh dari data lokal.
5. Service worker: pada build produksi seluruh app shell di-precache; pada
   mode dev Vite hanya mem-precache `index.html` (aset disajikan dev server).

## Struktur data (workspace)

- `settings`: identitas aplikasi, logo, ribon berjalan, tema, lokasi, keamanan,
  visibilitas modul per peran.
- `users`: akun admin/user/peserta (username, password, peran, kelas).
- `classes` + `attendance`: rombel dan presensi harian.
- `questions`: 9 tipe (PG, PG kompleks, benar/salah, menjodohkan, urutan,
  isian rumpang, jawaban singkat, esai, rekaman lisan).
- `exams`: sesi ujian, token, KKM, mode, pengaturan pengacakan/lockdown.
- `attempts`: pengerjaan peserta (jawaban, nilai, pelanggaran, status).
- `chat`, `logs`: obrolan grup dan jejak aktivitas.
