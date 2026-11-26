import { useMemo, useState } from 'react';
import { deleteExam, deleteQuestion, useAppState } from '../lib/store';
import type { Exam, Question } from '../types';
import { Badge, ConfirmDialog, EmptyState, Panel, Tabs } from '../components/ui';
import Icon from '../components/Icon';
import ExamForm from '../components/ExamForm';
import QuestionForm from '../components/QuestionForm';
import { DIFFICULTY_LABEL, EXAM_MODE_LABEL, QUESTION_TYPE_LABEL, formatDateTime } from '../lib/format';

const STATUS_TONE = {
  draft: 'gray',
  terjadwal: 'blue',
  berlangsung: 'green',
  selesai: 'violet',
} as const;

const STATUS_LABEL = {
  draft: 'Draft',
  terjadwal: 'Terjadwal',
  berlangsung: 'Berlangsung',
  selesai: 'Selesai',
} as const;

export default function UjianPage() {
  const { workspace } = useAppState();
  const [tab, setTab] = useState('exams');
  const [search, setSearch] = useState('');
  const [editingExam, setEditingExam] = useState<Exam | 'new' | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | 'new' | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  const term = search.trim().toLowerCase();

  const exams = useMemo(
    () =>
      workspace.exams.filter(
        (exam) =>
          !term ||
          exam.title.toLowerCase().includes(term) ||
          exam.subject.toLowerCase().includes(term) ||
          exam.entryToken.toLowerCase().includes(term),
      ),
    [workspace.exams, term],
  );

  const questions = useMemo(
    () =>
      workspace.questions.filter(
        (question) =>
          !term ||
          question.subject.toLowerCase().includes(term) ||
          question.indicator.toLowerCase().includes(term) ||
          question.prompt.toLowerCase().includes(term),
      ),
    [workspace.questions, term],
  );

  const classOf = (id: string) => workspace.classes.find((kelas) => kelas.id === id)?.name ?? '—';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ujian &amp; Bank Soal</h1>
          <p className="page-sub">Kelola sesi ujian, 9 tipe soal, token masuk, dan pengaturan pelaksanaan</p>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => (tab === 'exams' ? setEditingExam('new') : setEditingQuestion('new'))}
        >
          <Icon name="plus" size={16} /> {tab === 'exams' ? 'Buat Ujian' : 'Tambah Soal'}
        </button>
      </div>

      <Tabs
        tabs={[
          { id: 'exams', label: 'Sesi Ujian', count: workspace.exams.length },
          { id: 'bank', label: 'Bank Soal', count: workspace.questions.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === 'exams' ? 'Cari judul, mapel, atau token…' : 'Cari mapel, indikator, atau pertanyaan…'}
            aria-label="Cari"
          />
        </div>
        <span className="muted small">
          {tab === 'exams' ? `${exams.length} sesi ujian` : `${questions.length} soal`}
        </span>
      </div>

      {tab === 'exams' ? (
        <Panel>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Judul Ujian</th>
                  <th>Kelas</th>
                  <th>Mode</th>
                  <th className="num">Soal</th>
                  <th>Token</th>
                  <th>Jadwal</th>
                  <th>Status</th>
                  <th className="actions-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <div className="strong">{exam.title}</div>
                      <div className="muted small">{exam.subject} · KKM {exam.kkm} · {exam.durationMinutes} menit</div>
                    </td>
                    <td>{classOf(exam.classId)}</td>
                    <td>{EXAM_MODE_LABEL[exam.mode]}</td>
                    <td className="num">{exam.questionIds.length}</td>
                    <td className="mono">{exam.entryToken}</td>
                    <td className="small">{formatDateTime(exam.scheduledAt)}</td>
                    <td>
                      <Badge tone={STATUS_TONE[exam.status]}>{STATUS_LABEL[exam.status]}</Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-btn" aria-label={`Edit ${exam.title}`} onClick={() => setEditingExam(exam)}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label={`Hapus ${exam.title}`}
                          onClick={() => setDeletingExam(exam)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exams.length === 0 && <EmptyState title="Belum ada sesi ujian" hint="Buat sesi ujian pertama lewat tombol di atas." />}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mata Pelajaran</th>
                  <th>Indikator</th>
                  <th>Tipe Soal</th>
                  <th>Kesulitan</th>
                  <th className="num">Poin</th>
                  <th className="actions-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td className="strong">{question.subject}</td>
                    <td>
                      <div>{question.indicator}</div>
                      <div className="muted small clamp-1">{question.prompt}</div>
                    </td>
                    <td>{QUESTION_TYPE_LABEL[question.type]}</td>
                    <td>
                      <Badge tone={question.difficulty === 'mudah' ? 'green' : question.difficulty === 'sedang' ? 'amber' : 'red'}>
                        {DIFFICULTY_LABEL[question.difficulty]}
                      </Badge>
                    </td>
                    <td className="num">{question.points}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-btn" aria-label={`Edit soal ${question.indicator}`} onClick={() => setEditingQuestion(question)}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label={`Hapus soal ${question.indicator}`}
                          onClick={() => setDeletingQuestion(question)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {questions.length === 0 && <EmptyState title="Bank soal kosong" hint="Tambahkan soal pertama lewat tombol di atas." />}
          </div>
        </Panel>
      )}

      {editingExam && (
        <ExamForm initial={editingExam === 'new' ? undefined : editingExam} onClose={() => setEditingExam(null)} />
      )}
      {editingQuestion && (
        <QuestionForm
          initial={editingQuestion === 'new' ? undefined : editingQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {deletingExam && (
        <ConfirmDialog
          title="Hapus sesi ujian"
          message={`Hapus "${deletingExam.title}" beserta seluruh attempt peserta?`}
          confirmLabel="Hapus Ujian"
          onCancel={() => setDeletingExam(null)}
          onConfirm={() => {
            deleteExam(deletingExam.id);
            setDeletingExam(null);
          }}
        />
      )}
      {deletingQuestion && (
        <ConfirmDialog
          title="Hapus soal"
          message={`Hapus soal "${deletingQuestion.indicator}"? Soal juga dilepas dari sesi ujian terkait.`}
          confirmLabel="Hapus Soal"
          onCancel={() => setDeletingQuestion(null)}
          onConfirm={() => {
            deleteQuestion(deletingQuestion.id);
            setDeletingQuestion(null);
          }}
        />
      )}
    </div>
  );
}
