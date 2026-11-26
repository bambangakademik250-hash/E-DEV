import type { Peserta, Ujian } from '../types';
import type { OutboxOp } from './db';

const TIMEOUT_MS = 6000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchState(): Promise<{ peserta: Peserta[]; ujian: Ujian[] }> {
  return request<{ peserta: Peserta[]; ujian: Ujian[] }>('/api/state');
}

export async function pushOps(ops: OutboxOp[]): Promise<void> {
  await request<{ ok: boolean }>('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ ops }),
  });
}
