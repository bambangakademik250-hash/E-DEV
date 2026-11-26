import type { AnswerValue, Exam, Question, Tone } from '../types';

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

const AVATAR_COLORS = ['#1d4ed8', '#0f766e', '#b45309', '#7c3aed', '#0284c7', '#be123c'];

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

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function progressOf(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

export function isAnswerCorrect(question: Question, answer: AnswerValue | undefined): boolean {
  if (answer === null || answer === undefined) return false;

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return typeof answer === 'number' && answer === question.correctIndex;
    case 'complex_mc': {
      const picked = Array.isArray(answer) ? ([...answer] as number[]).sort((a, b) => a - b) : [];
      const correct = [...(question.correctIndices ?? [])].sort((a, b) => a - b);
      return picked.length === correct.length && picked.every((value, index) => value === correct[index]);
    }
    case 'matching': {
      const map = answer && typeof answer === 'object' && !Array.isArray(answer) ? (answer as Record<string, string>) : {};
      const pairs = question.matchingPairs ?? [];
      return pairs.length > 0 && pairs.every((pair) => normalize(map[pair.left] ?? '') === normalize(pair.right));
    }
    case 'ordering': {
      const list = Array.isArray(answer) ? (answer as string[]) : [];
      const correct = question.orderingItems ?? [];
      return list.length === correct.length && list.every((value, index) => value === correct[index]);
    }
    case 'fill_blank':
    case 'short_answer':
      return typeof answer === 'string' && normalize(answer) !== '' && normalize(answer) === normalize(question.answerKey ?? '');
    case 'essay':
    case 'audio_response':
      return typeof answer === 'string' && answer.trim().length >= 20;
    default:
      return false;
  }
}

export function isAnswered(answer: AnswerValue | undefined): boolean {
  if (answer === null || answer === undefined) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'string') return answer.trim() !== '';
  if (typeof answer === 'object') return Object.keys(answer).length > 0;
  return true;
}

export function scoreAttempt(exam: Exam, questions: Question[], answers: Record<string, AnswerValue>): number {
  const list = exam.questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((question): question is Question => Boolean(question));
  const total = list.reduce((sum, question) => sum + question.points, 0);
  if (total <= 0) return 0;
  const earned = list.reduce(
    (sum, question) => sum + (isAnswerCorrect(question, answers[question.id]) ? question.points : 0),
    0,
  );
  return Math.round((earned / total) * 100);
}

export const QUESTION_TYPE_LABEL: Record<Question['type'], string> = {
  multiple_choice: 'Pilihan Ganda',
  complex_mc: 'PG Kompleks (jawaban >1)',
  true_false: 'Benar / Salah',
  matching: 'Menjodohkan',
  ordering: 'Urutan',
  fill_blank: 'Isian Rumpang',
  short_answer: 'Jawaban Singkat',
  essay: 'Uraian / Esai',
  audio_response: 'Rekaman Lisan',
};

export const EXAM_MODE_LABEL: Record<Exam['mode'], string> = {
  regular: 'Reguler',
  cat: 'CAT Adaptif',
  pdf_based: 'Berbasis PDF',
  psychometric: 'Psikometrik',
};

export const DIFFICULTY_LABEL: Record<Question['difficulty'], string> = {
  mudah: 'Mudah',
  sedang: 'Sedang',
  sulit: 'Sulit',
};
