import { useSyncExternalStore } from 'react';
import type {
  AnswerValue,
  AppState,
  AttendanceStatus,
  Attempt,
  ChatMessage,
  Exam,
  Kelas,
  Question,
  Role,
  Settings,
  User,
  Workspace,
} from '../types';
import * as db from './db';
import { fetchWorkspace, pushWorkspace } from './api';
import { defaultWorkspace } from './seed';
import { scoreAttempt } from './format';

const SESSION_KEY = 'eujian_session_v2';

let state: AppState = {
  ready: false,
  serverOnline: navigator.onLine,
  syncing: false,
  workspace: defaultWorkspace(),
  sessionUserId: null,
  toast: null,
};

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

export function useSession(): User | null {
  const app = useAppState();
  return app.workspace.users.find((user) => user.id === app.sessionUserId) ?? null;
}

export function toast(msg: string, kind: 'ok' | 'warn' = 'ok'): void {
  set({ toast: { id: Date.now(), msg, kind } });
  window.setTimeout(() => {
    if (state.toast?.msg === msg) set({ toast: null });
  }, 3200);
}

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function pushLog(draft: Workspace, actor: string, action: string, detail: string): void {
  draft.logs = [
    { id: uid('log'), at: new Date().toISOString(), actor, action, detail },
    ...draft.logs,
  ].slice(0, 200);
}

/** Terapkan perubahan ke workspace, simpan ke IndexedDB, lalu dorong ke server. */
function commit(mutator: (draft: Workspace) => void): Workspace {
  const draft = structuredClone(state.workspace);
  mutator(draft);
  draft.updatedAt = Date.now();
  set({ workspace: draft });
  void db.writeWorkspace(draft);
  schedulePush();
  return draft;
}

let pushTimer: number | null = null;
let pushing = false;

function schedulePush(): void {
  if (!state.workspace.settings.cloudSyncEnabled) return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushNow();
  }, 700);
}

export async function pushNow(): Promise<void> {
  if (pushing || !state.workspace.settings.cloudSyncEnabled) return;
  pushing = true;
  set({ syncing: true });
  try {
    await pushWorkspace(state.workspace);
    set({ serverOnline: true });
  } catch {
    set({ serverOnline: false });
  } finally {
    pushing = false;
    set({ syncing: false });
  }
}

async function pullRemote(): Promise<void> {
  try {
    const { workspace } = await fetchWorkspace();
    if (workspace && workspace.updatedAt > state.workspace.updatedAt) {
      set({ workspace, serverOnline: true });
      await db.writeWorkspace(workspace);
    } else {
      set({ serverOnline: true });
    }
  } catch {
    set({ serverOnline: false });
  }
}

export async function initApp(): Promise<void> {
  try {
    const local = await db.readWorkspace();
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (local) {
      set({
        workspace: local,
        sessionUserId: savedSession && local.users.some((user) => user.id === savedSession) ? savedSession : null,
      });
    } else {
      const seed = defaultWorkspace();
      set({ workspace: seed });
      await db.writeWorkspace(seed);
    }
  } catch {
    set({ workspace: defaultWorkspace() });
  }
  set({ ready: true });
  await pullRemote();
  void pushNow();

  window.addEventListener('online', () => {
    set({ serverOnline: true });
    void pushNow();
    void pullRemote();
  });
  window.addEventListener('offline', () => set({ serverOnline: false }));
  window.setInterval(() => {
    void pullRemote();
  }, 20000);
}

/* ---------------------------------- auth --------------------------------- */

export function login(username: string, password: string, role: Role): string | null {
  const { workspace } = state;
  const user = workspace.users.find(
    (row) => row.username.toLowerCase() === username.trim().toLowerCase() && row.role === role,
  );
  if (!user) return 'Akun tidak ditemukan untuk peran tersebut.';
  if (user.password !== password) return 'Password salah. Silakan periksa kembali.';
  if (!user.active) return 'Akun ini dinonaktifkan oleh admin.';
  if (workspace.settings.appLocked && !user.allowedWhenLocked) {
    return 'Aplikasi sedang dikunci admin. Hubungi administrator untuk membuka akses.';
  }
  localStorage.setItem(SESSION_KEY, user.id);
  set({ sessionUserId: user.id });
  commit((draft) => pushLog(draft, user.name, 'Login', `Masuk sebagai ${role}`));
  return null;
}

export function registerInstitution(input: {
  name: string;
  email: string;
  username: string;
  password: string;
}): string | null {
  if (state.workspace.users.some((user) => user.username.toLowerCase() === input.username.toLowerCase())) {
    return 'Username sudah dipakai. Pilih username lain.';
  }
  const user: User = {
    id: uid('usr'),
    username: input.username,
    password: input.password,
    name: input.name,
    email: input.email,
    role: 'user',
    active: true,
    allowedWhenLocked: true,
    createdAt: new Date().toISOString(),
  };
  commit((draft) => {
    draft.users.push(user);
    pushLog(draft, input.name, 'Registrasi lembaga', `Akun operator ${input.username} dibuat`);
  });
  return null;
}

export function logout(): void {
  const user = currentUser();
  localStorage.removeItem(SESSION_KEY);
  set({ sessionUserId: null });
  if (user) commit((draft) => pushLog(draft, user.name, 'Logout', 'Keluar dari aplikasi'));
}

export function currentUser(): User | null {
  return state.workspace.users.find((user) => user.id === state.sessionUserId) ?? null;
}

/* --------------------------------- settings ------------------------------ */

export function saveSettings(patch: Partial<Settings>): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    draft.settings = { ...draft.settings, ...patch };
    pushLog(draft, actor, 'Pengaturan diperbarui', Object.keys(patch).join(', '));
  });
}

export function saveUser(input: User): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const index = draft.users.findIndex((user) => user.id === input.id);
    if (index >= 0) draft.users[index] = input;
    else draft.users.push(input);
    pushLog(draft, actor, index >= 0 ? 'Akun diperbarui' : 'Akun dibuat', `${input.name} (${input.role})`);
  });
}

export function deleteUser(id: string): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const user = draft.users.find((row) => row.id === id);
    draft.users = draft.users.filter((row) => row.id !== id);
    if (user) pushLog(draft, actor, 'Akun dihapus', user.name);
  });
}

/* ---------------------------------- kelas -------------------------------- */

export function saveClass(input: Kelas): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const index = draft.classes.findIndex((row) => row.id === input.id);
    if (index >= 0) draft.classes[index] = input;
    else draft.classes.push(input);
    pushLog(draft, actor, index >= 0 ? 'Kelas diperbarui' : 'Kelas ditambahkan', input.name);
  });
}

export function deleteClass(id: string): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const row = draft.classes.find((item) => item.id === id);
    draft.classes = draft.classes.filter((item) => item.id !== id);
    if (row) pushLog(draft, actor, 'Kelas dihapus', row.name);
  });
}

export function setAttendance(
  classId: string,
  studentId: string,
  studentName: string,
  status: AttendanceStatus,
  note = '',
): void {
  const actor = currentUser()?.name ?? 'Sistem';
  const date = new Date().toISOString().slice(0, 10);
  commit((draft) => {
    const existing = draft.attendance.find(
      (row) => row.classId === classId && row.date === date && row.studentId === studentId,
    );
    if (existing) {
      existing.status = status;
      existing.note = note;
      existing.updatedAt = new Date().toISOString();
      existing.recordedBy = actor;
    } else {
      draft.attendance.push({
        id: uid('att'),
        classId,
        date,
        studentId,
        studentName,
        status,
        note,
        recordedBy: actor,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

/* --------------------------------- soal ---------------------------------- */

export function saveQuestion(input: Question): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const index = draft.questions.findIndex((row) => row.id === input.id);
    if (index >= 0) draft.questions[index] = input;
    else draft.questions.push(input);
    pushLog(draft, actor, index >= 0 ? 'Soal diperbarui' : 'Soal ditambahkan', `${input.subject} · ${input.indicator}`);
  });
}

export function deleteQuestion(id: string): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const row = draft.questions.find((item) => item.id === id);
    draft.questions = draft.questions.filter((item) => item.id !== id);
    draft.exams = draft.exams.map((exam) => ({
      ...exam,
      questionIds: exam.questionIds.filter((questionId) => questionId !== id),
    }));
    if (row) pushLog(draft, actor, 'Soal dihapus', row.indicator);
  });
}

/* --------------------------------- ujian --------------------------------- */

export function saveExam(input: Exam): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const index = draft.exams.findIndex((row) => row.id === input.id);
    if (index >= 0) draft.exams[index] = input;
    else draft.exams.push(input);
    pushLog(draft, actor, index >= 0 ? 'Ujian diperbarui' : 'Ujian dibuat', input.title);
  });
}

export function deleteExam(id: string): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const row = draft.exams.find((item) => item.id === id);
    draft.exams = draft.exams.filter((item) => item.id !== id);
    draft.attempts = draft.attempts.filter((attempt) => attempt.examId !== id);
    if (row) pushLog(draft, actor, 'Ujian dihapus', row.title);
  });
}

/* -------------------------------- attempt -------------------------------- */

export function startAttempt(exam: Exam, user: User): Attempt {
  const existing = state.workspace.attempts.find(
    (attempt) => attempt.examId === exam.id && attempt.studentId === user.id && attempt.status !== 'selesai',
  );
  if (existing) return existing;

  const attempt: Attempt = {
    id: uid('attm'),
    examId: exam.id,
    studentId: user.id,
    studentName: user.name,
    classId: user.classId ?? exam.classId,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    status: 'berlangsung',
    answers: {},
    score: null,
    violations: 0,
  };
  commit((draft) => {
    draft.attempts.push(attempt);
    pushLog(draft, user.name, 'Ujian dimulai', exam.title);
  });
  return attempt;
}

export function saveAnswer(attemptId: string, questionId: string, value: AnswerValue): void {
  commit((draft) => {
    const attempt = draft.attempts.find((row) => row.id === attemptId);
    if (!attempt) return;
    attempt.answers = { ...attempt.answers, [questionId]: value };
  });
}

export function submitAttempt(attemptId: string): number {
  const { workspace } = state;
  let score = 0;
  commit((draft) => {
    const attempt = draft.attempts.find((row) => row.id === attemptId);
    if (!attempt) return;
    const exam = draft.exams.find((row) => row.id === attempt.examId);
    if (exam) score = scoreAttempt(exam, draft.questions, attempt.answers);
    attempt.score = score;
    attempt.status = 'selesai';
    attempt.submittedAt = new Date().toISOString();
    pushLog(draft, attempt.studentName, 'Ujian dikumpulkan', `${exam?.title ?? attempt.examId} · nilai ${score}`);
  });
  void workspace;
  return score;
}

export function setAttemptStatus(attemptId: string, status: Attempt['status']): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const attempt = draft.attempts.find((row) => row.id === attemptId);
    if (!attempt) return;
    attempt.status = status;
    pushLog(draft, actor, status === 'dijeda' ? 'Ujian dijeda' : 'Ujian dilanjutkan', attempt.studentName);
  });
}

export function resetAttempt(attemptId: string): void {
  const actor = currentUser()?.name ?? 'Sistem';
  commit((draft) => {
    const attempt = draft.attempts.find((row) => row.id === attemptId);
    draft.attempts = draft.attempts.filter((row) => row.id !== attemptId);
    if (attempt) pushLog(draft, actor, 'Login peserta direset', attempt.studentName);
  });
}

export function recordViolation(attemptId: string): void {
  commit((draft) => {
    const attempt = draft.attempts.find((row) => row.id === attemptId);
    if (attempt) attempt.violations += 1;
  });
}

/* --------------------------------- chat ---------------------------------- */

export function sendChat(text: string): void {
  const user = currentUser();
  if (!user || !text.trim()) return;
  const message: ChatMessage = {
    id: uid('chat'),
    userId: user.id,
    name: user.name,
    role: user.role,
    text: text.trim(),
    at: new Date().toISOString(),
  };
  commit((draft) => {
    draft.chat.push(message);
  });
}

/* -------------------------------- backup --------------------------------- */

export function restoreWorkspace(next: Workspace): void {
  commit((draft) => {
    Object.assign(draft, next, { updatedAt: Date.now() });
  });
}
