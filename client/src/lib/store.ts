import { useSyncExternalStore } from 'react';
import type { AppState, Peserta, PesertaForm, Ujian, UjianForm } from '../types';
import * as db from './db';
import { fetchState, pushOps } from './api';

const initialState: AppState = {
  ready: false,
  serverOnline: navigator.onLine,
  syncing: false,
  pending: 0,
  lastSync: null,
  peserta: [],
  ujian: [],
  toast: null,
};

let state: AppState = initialState;
const listeners = new Set<() => void>();

function set(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getState(): AppState {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function toast(msg: string, kind: 'ok' | 'warn' = 'ok'): void {
  set({ toast: { id: Date.now(), msg, kind } });
  window.setTimeout(() => {
    if (state.toast?.msg === msg) set({ toast: null });
  }, 3200);
}

const sortPeserta = (rows: Peserta[]) => [...rows].sort((a, b) => a.nama.localeCompare(b.nama));
const sortUjian = (rows: Ujian[]) => [...rows].sort((a, b) => a.nama.localeCompare(b.nama));

async function enqueue(op: db.OutboxOp): Promise<void> {
  await db.queueOp(op);
  const ops = await db.readOutbox();
  set({ pending: ops.length });
}

let syncing = false;

/**
 * Kirim antrean perubahan ke server, lalu tarik data terbaru.
 * Gagal koneksi bukan error aplikasi: data lokal tetap dipakai dan
 * perubahan tetap di antrean untuk dikirim saat online kembali.
 */
export async function syncNow(): Promise<void> {
  if (syncing) return;
  syncing = true;
  set({ syncing: true });
  try {
    const ops = await db.readOutbox();
    if (ops.length > 0) {
      await pushOps(ops);
      await db.removeOps(ops.map((op) => op.opId as number));
    }

    const remote = await fetchState();
    // Hanya timpa cache lokal bila tidak ada perubahan yang masih antre,
    // supaya suntingan offline tidak hilang.
    if ((await db.readOutbox()).length === 0) {
      await db.replaceAll('peserta', remote.peserta);
      await db.replaceAll('ujian', remote.ujian);
      set({
        peserta: sortPeserta(remote.peserta),
        ujian: sortUjian(remote.ujian),
        serverOnline: true,
        lastSync: Date.now(),
        pending: 0,
      });
    } else {
      set({ serverOnline: true, lastSync: Date.now() });
    }
  } catch {
    set({ serverOnline: false });
  } finally {
    syncing = false;
    set({ syncing: false });
    // Perubahan yang masuk saat sinkronisasi berjalan dikirim pada putaran
    // berikutnya, tanpa menunggu interval 20 detik.
    if (getState().serverOnline && (await db.readOutbox()).length > 0) {
      window.setTimeout(() => {
        void syncNow();
      }, 400);
    }
  }
}

export async function initStore(): Promise<void> {
  try {
    const [peserta, ujian] = await Promise.all([
      db.getAll<Peserta>('peserta'),
      db.getAll<Ujian>('ujian'),
    ]);
    const ops = await db.readOutbox();
    set({
      ready: true,
      peserta: sortPeserta(peserta),
      ujian: sortUjian(ujian),
      pending: ops.length,
    });
  } catch {
    set({ ready: true });
  }
  void syncNow();
}

export async function savePeserta(input: PesertaForm): Promise<void> {
  const existing = input.id ? state.peserta.find((row) => row.id === input.id) : undefined;
  const id = input.id ?? crypto.randomUUID();
  const record: Peserta = {
    benar: existing?.benar ?? null,
    salah: existing?.salah ?? null,
    submittedAt:
      input.status === 'selesai' ? (existing?.submittedAt ?? new Date().toISOString()) : null,
    ...input,
    id,
    updatedAt: Date.now(),
  };

  await db.put('peserta', record);
  const next = state.peserta.some((row) => row.id === id)
    ? state.peserta.map((row) => (row.id === id ? record : row))
    : [...state.peserta, record];
  set({ peserta: sortPeserta(next) });

  await enqueue({ entity: 'peserta', type: 'upsert', id, data: record, ts: record.updatedAt });
  toast(input.id ? 'Data peserta diperbarui' : 'Peserta baru ditambahkan');
  void syncNow();
}

export async function deletePeserta(id: string): Promise<void> {
  await db.remove('peserta', id);
  set({ peserta: state.peserta.filter((row) => row.id !== id) });
  await enqueue({ entity: 'peserta', type: 'delete', id, ts: Date.now() });
  toast('Peserta dihapus');
  void syncNow();
}

export async function saveUjian(input: UjianForm): Promise<void> {
  const record: Ujian = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    updatedAt: Date.now(),
  };

  await db.put('ujian', record);
  const next = state.ujian.some((row) => row.id === record.id)
    ? state.ujian.map((row) => (row.id === record.id ? record : row))
    : [...state.ujian, record];
  set({ ujian: sortUjian(next) });

  await enqueue({
    entity: 'ujian',
    type: 'upsert',
    id: record.id,
    data: record,
    ts: record.updatedAt,
  });
  toast(input.id ? 'Data ujian diperbarui' : 'Ujian baru ditambahkan');
  void syncNow();
}

export async function deleteUjian(id: string): Promise<void> {
  await db.remove('ujian', id);
  set({ ujian: state.ujian.filter((row) => row.id !== id) });
  await enqueue({ entity: 'ujian', type: 'delete', id, ts: Date.now() });
  toast('Ujian dihapus');
  void syncNow();
}

export function initSync(): void {
  window.addEventListener('online', () => {
    set({ serverOnline: true });
    void syncNow();
  });
  window.addEventListener('offline', () => set({ serverOnline: false }));
  // Sinkron ulang berkala: memulihkan antrean saat koneksi kembali tanpa
  // menunggu event browser (mis. API sempat mati sebentar).
  window.setInterval(() => {
    if (!syncing) void syncNow();
  }, 20000);
  void initStore();
}
