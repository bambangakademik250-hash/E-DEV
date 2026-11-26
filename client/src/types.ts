export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'violet' | 'gray';

export type Role = 'admin' | 'user' | 'peserta';

export type QuestionType =
  | 'multiple_choice'
  | 'complex_mc'
  | 'true_false'
  | 'matching'
  | 'ordering'
  | 'fill_blank'
  | 'short_answer'
  | 'essay'
  | 'audio_response';

export type Difficulty = 'mudah' | 'sedang' | 'sulit';

export type ExamMode = 'regular' | 'cat' | 'pdf_based' | 'psychometric';

export type ExamStatus = 'draft' | 'terjadwal' | 'berlangsung' | 'selesai';

export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alfa';

export type AttemptStatus = 'berlangsung' | 'selesai' | 'dijeda';

export type AnswerValue = number | number[] | string[] | string | Record<string, string> | null;

export interface RunningText {
  enabled: boolean;
  text: string;
  textColor: string;
  bgColor: string;
  bold: boolean;
  fontSizePx: number;
  fontStyle: 'display' | 'body';
}

export interface LocationInfo {
  sectionTitle: string;
  placeName: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
}

export interface Settings {
  appTitle: string;
  institutionName: string;
  logoDataUrl: string;
  themeMode: 'light' | 'dark';
  appearanceMode: 'default' | 'custom';
  customBgColor: string;
  customDashboardColor: string;
  customRibbonColor: string;
  customRibbonTextColor: string;
  runningText: RunningText;
  location: LocationInfo;
  appLocked: boolean;
  restrictToAllowedUsers: boolean;
  cloudSyncEnabled: boolean;
  institutionPoints: number;
  roleVisibility: { user: string[]; peserta: string[] };
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: Role;
  classId?: string;
  active: boolean;
  allowedWhenLocked: boolean;
  createdAt: string;
}

export interface Kelas {
  id: string;
  name: string;
  level: string;
  homeroomTeacher: string;
  studentCount: number;
}

export interface Attendance {
  id: string;
  classId: string;
  date: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
  updatedAt: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  subject: string;
  indicator: string;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  correctIndices?: number[];
  matchingPairs?: MatchingPair[];
  orderingItems?: string[];
  answerKey?: string;
  explanation: string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  classId: string;
  mode: ExamMode;
  timingType: 'duration' | 'schedule';
  durationMinutes: number;
  endTimeIso?: string;
  kkm: number;
  entryToken: string;
  scheduledAt: string;
  status: ExamStatus;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lockdownMode: boolean;
  pauseWhenOffline: boolean;
  questionIds: string[];
  pdfReferenceTitle?: string;
  pdfReferenceContent?: string;
}

export interface Attempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  classId: string;
  startedAt: string;
  submittedAt: string | null;
  status: AttemptStatus;
  answers: Record<string, AnswerValue>;
  score: number | null;
  violations: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  role: Role;
  text: string;
  at: string;
}

export interface LogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Workspace {
  version: number;
  updatedAt: number;
  settings: Settings;
  users: User[];
  classes: Kelas[];
  attendance: Attendance[];
  questions: Question[];
  exams: Exam[];
  attempts: Attempt[];
  chat: ChatMessage[];
  logs: LogEntry[];
}

export interface AppState {
  ready: boolean;
  serverOnline: boolean;
  syncing: boolean;
  workspace: Workspace;
  sessionUserId: string | null;
  toast: { id: number; msg: string; kind: 'ok' | 'warn' } | null;
}
