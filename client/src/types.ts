export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'violet' | 'gray';
export type StatusPeserta = 'online' | 'selesai' | 'offline';
export type StatusUjian = 'aktif' | 'belum';
export type TipeUjian = 'UTS' | 'UAS';
export type EntityName = 'peserta' | 'ujian';

export interface Peserta {
  id: string;
  nama: string;
  nim: string;
  kelas: string;
  mataKuliah: string;
  status: StatusPeserta;
  nilai: number | null;
  benar: number | null;
  salah: number | null;
  peringatan: number;
  submittedAt: string | null;
  updatedAt: number;
}

export interface PesertaForm {
  id?: string;
  nama: string;
  nim: string;
  kelas: string;
  mataKuliah: string;
  status: StatusPeserta;
  nilai: number | null;
  peringatan: number;
}

export interface Ujian {
  id: string;
  nama: string;
  kode: string;
  tipe: TipeUjian;
  soal: number;
  semester: number;
  status: StatusUjian;
  ikon: string;
  updatedAt: number;
}

export interface UjianForm {
  id?: string;
  nama: string;
  kode: string;
  tipe: TipeUjian;
  soal: number;
  semester: number;
  status: StatusUjian;
  ikon: string;
}

export interface AppState {
  ready: boolean;
  serverOnline: boolean;
  syncing: boolean;
  pending: number;
  lastSync: number | null;
  peserta: Peserta[];
  ujian: Ujian[];
  toast: { id: number; msg: string; kind: 'ok' | 'warn' } | null;
}
