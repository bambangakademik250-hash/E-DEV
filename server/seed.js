export function seedState() {
  return {
    ujian: [
      { id: 'u1', nama: 'Ekologi Hutan', kode: 'MNH301', tipe: 'UTS', soal: 40, semester: 5, status: 'aktif', ikon: '🌿', updatedAt: 0 },
      { id: 'u2', nama: 'Silvika', kode: 'MNH302', tipe: 'UTS', soal: 35, semester: 5, status: 'aktif', ikon: '🌲', updatedAt: 0 },
      { id: 'u3', nama: 'Manajemen Hutan', kode: 'MNH303', tipe: 'UTS', soal: 45, semester: 3, status: 'belum', ikon: '🗂️', updatedAt: 0 },
      { id: 'u4', nama: 'Dendrologi', kode: 'MNH201', tipe: 'UAS', soal: 30, semester: 3, status: 'belum', ikon: '🌳', updatedAt: 0 },
      { id: 'u5', nama: 'Ilmu Tanah Hutan', kode: 'LH201', tipe: 'UAS', soal: 25, semester: 5, status: 'belum', ikon: '🪨', updatedAt: 0 },
      { id: 'u6', nama: 'Hidrologi Hutan', kode: 'LH301', tipe: 'UTS', soal: 20, semester: 7, status: 'belum', ikon: '💧', updatedAt: 0 },
    ],
    peserta: [
      { id: 'p1', nama: 'Ahmad Rizky F.', nim: '2301101001', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'selesai', nilai: 85, benar: 34, salah: 6, peringatan: 0, submittedAt: '2026-05-05T10:30:00.000Z', updatedAt: 0 },
      { id: 'p2', nama: 'Siti Rahmawati', nim: '2301101002', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'selesai', nilai: 92, benar: 37, salah: 3, peringatan: 0, submittedAt: '2026-05-05T10:32:00.000Z', updatedAt: 0 },
      { id: 'p3', nama: 'Budi Wicaksono', nim: '2301101003', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'online', nilai: null, benar: null, salah: null, peringatan: 2, submittedAt: null, updatedAt: 0 },
      { id: 'p4', nama: 'Maya Kusuma', nim: '2301101004', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'online', nilai: null, benar: null, salah: null, peringatan: 0, submittedAt: null, updatedAt: 0 },
      { id: 'p5', nama: 'Dani Pratama', nim: '2301101005', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'online', nilai: null, benar: null, salah: null, peringatan: 1, submittedAt: null, updatedAt: 0 },
      { id: 'p6', nama: 'Rina Safitri', nim: '2301101006', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'selesai', nilai: 78, benar: 31, salah: 9, peringatan: 0, submittedAt: '2026-05-05T10:41:00.000Z', updatedAt: 0 },
      { id: 'p7', nama: 'Hendra Saputra', nim: '2301101007', kelas: 'MNH-B', mataKuliah: 'Silvika', status: 'selesai', nilai: 88, benar: 35, salah: 5, peringatan: 0, submittedAt: '2026-05-05T10:28:00.000Z', updatedAt: 0 },
      { id: 'p8', nama: 'Lestari Dewi', nim: '2301101008', kelas: 'MNH-B', mataKuliah: 'Silvika', status: 'online', nilai: null, benar: null, salah: null, peringatan: 0, submittedAt: null, updatedAt: 0 },
      { id: 'p9', nama: 'Fauzan Akbar', nim: '2301101009', kelas: 'MNH-B', mataKuliah: 'Silvika', status: 'selesai', nilai: 65, benar: 26, salah: 14, peringatan: 0, submittedAt: '2026-05-05T10:45:00.000Z', updatedAt: 0 },
      { id: 'p10', nama: 'Yuliana Sari', nim: '2301101010', kelas: 'MNH-B', mataKuliah: 'Silvika', status: 'online', nilai: null, benar: null, salah: null, peringatan: 0, submittedAt: null, updatedAt: 0 },
      { id: 'p11', nama: 'Irwan Maulana', nim: '2301101011', kelas: 'LH-A', mataKuliah: 'Manajemen Hutan', status: 'selesai', nilai: 72, benar: 29, salah: 11, peringatan: 1, submittedAt: '2026-05-07T10:38:00.000Z', updatedAt: 0 },
      { id: 'p12', nama: 'Dewi Astuti', nim: '2301101012', kelas: 'LH-A', mataKuliah: 'Manajemen Hutan', status: 'offline', nilai: null, benar: null, salah: null, peringatan: 0, submittedAt: null, updatedAt: 0 },
      { id: 'p13', nama: 'Reza Firmansyah', nim: '2301101013', kelas: 'LH-A', mataKuliah: 'Manajemen Hutan', status: 'selesai', nilai: 76, benar: 30, salah: 10, peringatan: 0, submittedAt: '2026-05-07T10:42:00.000Z', updatedAt: 0 },
      { id: 'p14', nama: 'Annisa Putri', nim: '2301101014', kelas: 'MNH-A', mataKuliah: 'Ekologi Hutan', status: 'selesai', nilai: 95, benar: 38, salah: 2, peringatan: 0, submittedAt: '2026-05-05T10:35:00.000Z', updatedAt: 0 },
    ],
  };
}
