import type { Tone } from '../types';

export function gradeOf(nilai: number | null): string {
  if (nilai === null) return '-';
  if (nilai >= 85) return 'A';
  if (nilai >= 75) return 'B+';
  if (nilai >= 65) return 'B';
  if (nilai >= 55) return 'C+';
  if (nilai >= 45) return 'C';
  return 'D';
}

export function gradeTone(nilai: number | null): Tone {
  if (nilai === null) return 'gray';
  if (nilai >= 85) return 'green';
  if (nilai >= 65) return 'blue';
  if (nilai >= 45) return 'amber';
  return 'red';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ['#4f7cff', '#1fba84', '#f0a623', '#9b7ff4', '#22b4d6', '#f05353'];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function progressOf(selesai: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((selesai / total) * 100);
}
