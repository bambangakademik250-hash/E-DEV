import type { Workspace } from '../types';

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

export function fetchWorkspace(): Promise<{ workspace: Workspace | null }> {
  return request<{ workspace: Workspace | null }>('/api/workspace');
}

export async function pushWorkspace(workspace: Workspace): Promise<void> {
  await request<{ ok: boolean }>('/api/workspace', {
    method: 'PUT',
    body: JSON.stringify(workspace),
  });
}
