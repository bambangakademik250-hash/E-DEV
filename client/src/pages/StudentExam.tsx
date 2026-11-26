import { useEffect, useMemo, useState } from 'react';
import { recordViolation, saveAnswer, startAttempt, submitAttempt, toast, useAppState, useSession } from '../lib/store';
import type { AnswerValue, Exam, Question } from '../types';
import { Badge, ConfirmDialog, EmptyState, Panel, ProgressBar, StatCard } from '../components/ui';
import Icon from '../components/Icon';
import { QUESTION_TYPE_LABEL, formatClock, gradeOf, gradeTone, isAnswered } from '../lib/format';

function AnswerInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  if (question.type === 'multiple_choice' || question.type === 'true_false') {
    return (
      <div className="answer-options">
        {(question.options ?? []).map((option, index) => (
          <label className={`answer-option${value === index ? ' picked' : ''}`} key={index}>
            <input
              type="radio"
              name={question.id}
              checked={value === index}
              onChange={() => onChange(index)}
            />
            <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'complex_mc') {
    const picked: number[] = Array.isArray(value) ? (value as number[]) : [];
    return (
      <div className="answer-options">
        {(question.options ?? []).map((option, index) => (
          <label className={`answer-option${picked.includes(index) ? ' picked' : ''}`} key={index}>
            <input
              type="checkbox"
              checked={picked.includes(index)}
              onChange={() =>
                onChange(picked.includes(index) ? picked.filter((item) => item !== index) : [...picked, index])
              }
            />
            <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'matching') {
    const map = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, string>) : {};
    const rights = (question.matchingPairs ?? []).map((pair) => pair.right);
    return (
      <div className="matching-list">
        {(question.matchingPairs ?? []).map((pair) => (
          <div className="matching-row" key={pair.left}>
            <span className="strong">{pair.left}</span>
            <select
              className="input"
              value={map[pair.left] ?? ''}
              onChange={(event) => onChange({ ...map, [pair.left]: event.target.value })}
            >
              <option value="">— pilih pasangan —</option>
              {rights.map((right) => (
                <option key={right} value={right}>
                  {right}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === 'ordering') {
    const list: string[] = Array.isArray(value)
      ? (value as string[])
      : [...(question.orderingItems ?? [])].sort(() => Math.random() - 0.5);
    const move = (index: number, direction: -1 | 1) => {
      const next = [...list];
      const target = index + direction;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    };
    return (
      <div className="ordering-list">
        {list.map((item, index) => (
          <div className="ordering-row" key={`${item}-${index}`}>
            <span className="order-num">{index + 1}</span>
            <span>{item}</span>
            <div className="row-actions">
              <button type="button" className="icon-btn" aria-label={`Naikkan ${item}`} onClick={() => move(index, -1)}>
                ↑
              </button>
              <button type="button" className="icon-btn" aria-label={`Turunkan ${item}`} onClick={() => move(index, 1)}>
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === 'essay' || question.type === 'audio_response') {
    return (
      <textarea
        className="input"
        rows={5}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          question.type === 'audio_response'
            ? 'Tulis transkrip jawaban lisan Anda (15–30 detik)…'
            : 'Tulis jawaban uraian Anda…'
        }
      />
    );
  }

  return (
    <input
      className="input"
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Tulis jawaban singkat…"
    />
  );
}

export default function StudentExamPage() {
  const { workspace } = useAppState();
  const user = useSession();
  const [token, setToken] = useState('');
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState<{ score: number; exam: Exam } | null>(null);

  const attempt = workspace.attempts.find((row) => row.id === activeAttemptId) ?? null;
  const exam = attempt ? workspace.exams.find((row) => row.id === attempt.examId) ?? null : null;
  const questions = useMemo(
    () =>
      exam
        ? exam.questionIds
            .map((id) => workspace.questions.find((question) => question.id === id))
            .filter((question): question is Question => Boolean(question))
        : [],
    [exam, workspace.questions],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!attempt || !exam) return 0;
    const started = new Date(attempt.startedAt).getTime();
    const deadline = started + exam.durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((deadline - now) / 1000));
  }, [attempt, exam, now]);

  useEffect(() => {
    if (attempt && exam && remaining === 0 && attempt.status !== 'selesai') {
      const score = submitAttempt(attempt.id);
      setResult({ score, exam });
      setActiveAttemptId(null);
    }
  }, [remaining, attempt, exam]);

  useEffect(() => {
    if (!attempt || attempt.status === 'selesai') return;
    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        recordViolation(attempt.id);
        toast('Terdeteksi berpindah tab — pelanggaran dicatat proktor.', 'warn');
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [attempt]);

  const myExams = useMemo(
    () =>
      workspace.exams.filter(
        (row) =>
          row.status !== 'draft' &&
          (!user?.classId || row.classId === user.classId || row.mode === 'pdf_based' || user.role === 'admin'),
      ),
    [workspace.exams, user],
  );

  const start = (examRow: Exam) => {
    if (!user) return;
    const created = startAttempt(examRow, user);
    setIndex(0);
    setActiveAttemptId(created.id);
  };

  const submitToken = () => {
    const found = workspace.exams.find(
      (row) => row.entryToken.toLowerCase() === token.trim().toLowerCase() && row.status !== 'draft',
    );
    if (!found) {
      toast('Token ujian tidak ditemukan atau sesi belum dibuka.', 'warn');
      return;
    }
    start(found);
    setToken('');
  };

  const doSubmit = () => {
    if (!attempt || !exam) return;
    const score = submitAttempt(attempt.id);
    setConfirmSubmit(false);
    setActiveAttemptId(null);
    setResult({ score, exam });
  };

  if (result) {
    const passed = result.score >= result.exam.kkm;
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Hasil Ujian</h1>
            <p className="page-sub">{result.exam.title}</p>
          </div>
        </div>
        <Panel>
          <div className="result">
            <span className={`result-score t-${gradeTone(result.score)}`}>{result.score}</span>
            <Badge tone={gradeTone(result.score)}>Grade {gradeOf(result.score)}</Badge>
            <p className="muted">
              {passed ? 'Selamat, Anda mencapai KKM' : 'Nilai belum mencapai KKM'} {result.exam.kkm}. Jawaban sudah
              terkirim ke server dan tersimpan offline.
            </p>
            <button type="button" className="btn primary" onClick={() => setResult(null)}>
              Kembali ke daftar ujian
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  if (attempt && exam) {
    const question = questions[index];
    const answeredCount = questions.filter((row) => isAnswered(attempt.answers[row.id])).length;
    return (
      <div className="page exam-page">
        <div className="exam-bar">
          <div>
            <div className="exam-title">{exam.title}</div>
            <div className="muted small">
              {question ? `${index + 1} dari ${questions.length} soal` : 'Tidak ada soal'} · pelanggaran{' '}
              {attempt.violations}x
            </div>
          </div>
          <div className="exam-timer">
            <Icon name="clock" size={16} /> {formatClock(remaining)}
          </div>
          <button type="button" className="btn primary" onClick={() => setConfirmSubmit(true)}>
            Kumpulkan
          </button>
        </div>

        <ProgressBar value={(answeredCount / Math.max(questions.length, 1)) * 100} tone="green" />

        <div className="exam-body">
          <div className="exam-main">
            {question ? (
              <>
                <div className="exam-meta">
                  <Badge tone="blue">{QUESTION_TYPE_LABEL[question.type]}</Badge>
                  <Badge tone="gray">{question.points} poin</Badge>
                  <span className="muted small">{question.subject} · {question.indicator}</span>
                </div>
                <h2 className="exam-question">{question.prompt}</h2>
                <AnswerInput
                  question={question}
                  value={attempt.answers[question.id]}
                  onChange={(value) => saveAnswer(attempt.id, question.id, value)}
                />
                {exam.mode === 'pdf_based' && exam.pdfReferenceContent && (
                  <div className="pdf-note">
                    <div className="form-section-title">{exam.pdfReferenceTitle ?? 'Naskah sumber'}</div>
                    <p className="muted small">{exam.pdfReferenceContent}</p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState title="Sesi ujian belum memiliki soal" />
            )}

            <div className="exam-nav">
              <button type="button" className="btn ghost" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                Sebelumnya
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={index >= questions.length - 1}
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Selanjutnya
              </button>
            </div>
          </div>

          <aside className="exam-side">
            <div className="form-section-title">Navigasi soal</div>
            <div className="exam-grid">
              {questions.map((row, position) => (
                <button
                  key={row.id}
                  type="button"
                  className={`exam-dot${position === index ? ' active' : ''}${isAnswered(attempt.answers[row.id]) ? ' done' : ''}`}
                  onClick={() => setIndex(position)}
                  aria-label={`Soal ${position + 1}`}
                >
                  {position + 1}
                </button>
              ))}
            </div>
            <div className="exam-side-foot muted small">
              {answeredCount}/{questions.length} terjawab · jawaban tersimpan otomatis
            </div>
          </aside>
        </div>

        {confirmSubmit && (
          <ConfirmDialog
            title="Kumpulkan ujian"
            message={`Anda telah menjawab ${answeredCount} dari ${questions.length} soal. Kumpulkan sekarang?`}
            confirmLabel="Kumpulkan"
            onCancel={() => setConfirmSubmit(false)}
            onConfirm={doSubmit}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Layar Ujian Peserta</h1>
          <p className="page-sub">Masukkan token ujian dari proktor untuk memulai sesi CBT</p>
        </div>
      </div>

      <div className="grid-2">
        <Panel title="Masuk dengan Token" subtitle="Token dibagikan proktor saat sesi dibuka">
          <div className="token-row">
            <input
              className="input mono"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Contoh: PAS2026"
              aria-label="Token ujian"
            />
            <button type="button" className="btn primary" onClick={submitToken}>
              Mulai Ujian
            </button>
          </div>
          <p className="muted small">
            Jika koneksi terputus, jawaban dan posisi soal terakhir tersimpan otomatis saat login kembali.
          </p>
        </Panel>

        <Panel title="Sesi Tersedia" subtitle="Ujian untuk kelas Anda">
          <div className="list">
            {myExams.map((row) => (
              <div className="list-row" key={row.id}>
                <div>
                  <div className="strong">{row.title}</div>
                  <div className="muted small">
                    {row.subject} · {row.questionIds.length} soal · {row.durationMinutes} menit
                  </div>
                </div>
                <button type="button" className="btn ghost small" onClick={() => start(row)}>
                  <Icon name="play" size={14} /> Mulai
                </button>
              </div>
            ))}
            {myExams.length === 0 && <EmptyState title="Belum ada ujian" hint="Hubungi proktor untuk membuka sesi." />}
          </div>
        </Panel>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Soal Bank" value={workspace.questions.length} sub="Siap dipakai di sesi ujian" icon={<Icon name="book" size={16} />} />
        <StatCard label="Sesi Ujian" value={workspace.exams.length} sub="Seluruh sesi terdaftar" tone="violet" icon={<Icon name="exam" size={16} />} />
        <StatCard
          label="Pengerjaan Saya"
          value={workspace.attempts.filter((row) => row.studentId === user?.id).length}
          sub="Attempt tercatat"
          tone="green"
          icon={<Icon name="check" size={16} />}
        />
        <StatCard
          label="Nilai Terakhir"
          value={
            (() => {
              const mine = workspace.attempts
                .filter((row) => row.studentId === user?.id && row.status === 'selesai')
                .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
              return mine[0]?.score ?? '—';
            })()
          }
          sub="Dari ujian terakhir yang dikumpulkan"
          tone="amber"
          icon={<Icon name="award" size={16} />}
        />
      </div>
    </div>
  );
}
