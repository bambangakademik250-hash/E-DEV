export interface ModuleDef {
  id: string;
  label: string;
  desc: string;
  path: string;
  icon:
    | 'grid'
    | 'exam'
    | 'book'
    | 'monitor'
    | 'users'
    | 'chat'
    | 'file'
    | 'settings';
}

/** Modul aplikasi sesuai menu SCBT: urutan & label mengikuti aplikasi asal. */
export const MODULES: ModuleDef[] = [
  { id: 'analytics', label: 'Analitik & Evaluasi', desc: 'Statistik skor, KKM, & pemetaan indikator', path: '/', icon: 'grid' },
  { id: 'student_exam', label: 'Layar Ujian Peserta', desc: 'Terminal ujian CBT peserta & token masuk', path: '/ujian-peserta', icon: 'exam' },
  { id: 'exams', label: 'Ujian & Bank Soal', desc: 'Kelola sesi ujian, 9 tipe soal & AI', path: '/ujian', icon: 'book' },
  { id: 'monitoring', label: 'Monitor Proktor', desc: 'Pantau peserta live, jeda, & reset login', path: '/monitor', icon: 'monitor' },
  { id: 'classes', label: 'Kelas & Absensi', desc: 'Daftar rombel & presensi kehadiran siswa', path: '/kelas', icon: 'users' },
  { id: 'chat', label: 'Obrolan Grup', desc: 'Komunikasi real-time guru & peserta', path: '/obrolan', icon: 'chat' },
  { id: 'reports', label: 'Laporan & Sertifikat', desc: 'Ekspor PDF, Word DOCX, Excel, CSV & QR', path: '/laporan', icon: 'file' },
  { id: 'settings', label: 'Pengaturan & Kontrol', desc: 'Logo, tema, backup, log & manajemen', path: '/pengaturan', icon: 'settings' },
];

export function modulesForRole(role: 'admin' | 'user' | 'peserta', visibility: { user: string[]; peserta: string[] }): ModuleDef[] {
  if (role === 'admin') return MODULES;
  const allowed = role === 'user' ? visibility.user : visibility.peserta;
  return MODULES.filter((module) => allowed.includes(module.id));
}
