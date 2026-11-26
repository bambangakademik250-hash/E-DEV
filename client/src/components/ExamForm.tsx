import { useState, type FormEvent } from 'react';
import { saveExam, uid, useAppState } from '../lib/store';
import type { Exam, ExamMode, ExamStatus } from '../types';
import { Field, Modal } from './ui';
import { EXAM_MODE_LABEL } from '../lib/format';

const MODES: ExamMode[] = ['regular', 'cat', 'pdf_based', 'psychometric'];
const STATUSES: { id: ExamStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'terjadwal', label: 'Terjadwal' },
  { id: 'berlangsung', label: 'Berlangsung' },
  { id: 'selesai', label: 'Selesai' },
];

export default function ExamForm({ initial, onClose }: { initial?: Exam; onClose: () => void }) {
  const { workspace } = useAppState();
  const [form, setForm] = useState<Exam>(
    initial ?? {
      id: uid('exm'),
      title: '',
      subject: '',
      classId: workspace.classes[0]?.id ?? '',
      mode: 'regular',
      timingType: 'duration',
      durationMinutes: 60,
      kkm: 75,
      entryToken: '',
      scheduledAt: `${new Date().toISOString().slice(0, 10)}T08:00`,
      status: 'draft',
      randomizeQuestions: true,
      randomizeOptions: true,
      lockdownMode: true,
      pauseWhenOffline: true,
      questionIds: [],
    },
  );
  const [error, setError] = useState('');

  const update = (patch: Partial<Exam>) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleQuestion = (id: string) => {
    update({
      questionIds: form.questionIds.includes(id)
        ? form.questionIds.filter((questionId) => questionId !== id)
        : [...form.questionIds, id],
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) {
      setError('Judul ujian dan mata pelajaran wajib diisi.');
      return;
    }
    if (!form.entryToken.trim()) {
      setError('Token masuk wajib diisi.');
      return;
    }
    if (form.questionIds.length === 0) {
      setError('Pilih minimal satu soal dari bank soal.');
      return;
    }
    saveExam({ ...form, title: form.title.trim(), subject: form.subject.trim(), entryToken: form.entryToken.trim().toUpperCase() });
    onClose();
  };

  return (
    <Modal
      title={initial ? 'Edit Sesi Ujian' : 'Buat Sesi Ujian'}
      onClose={onClose}
      width={720}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="exam-form" className="btn primary">
            Simpan Ujian
          </button>
        </>
      }
    >
      <form id="exam-form" className="form-grid" onSubmit={submit}>
        <Field label="Judul ujian" className="span-2">
          <input className="input" value={form.title} onChange={(event) => update({ title: event.target.value })} placeholder="PAS Terpadu XII IPA" />
        </Field>
        <Field label="Mata pelajaran">
          <input className="input" value={form.subject} onChange={(event) => update({ subject: event.target.value })} placeholder="Sains & Matematika" />
        </Field>
        <Field label="Kelas">
          <select className="input" value={form.classId} onChange={(event) => update({ classId: event.target.value })}>
            {workspace.classes.map((kelas) => (
              <option key={kelas.id} value={kelas.id}>
                {kelas.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mode ujian">
          <select className="input" value={form.mode} onChange={(event) => update({ mode: event.target.value as ExamMode })}>
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {EXAM_MODE_LABEL[mode]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={(event) => update({ status: event.target.value as ExamStatus })}>
            {STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipe waktu">
          <select
            className="input"
            value={form.timingType}
            onChange={(event) => update({ timingType: event.target.value as Exam['timingType'] })}
          >
            <option value="duration">Durasi (menit)</option>
            <option value="schedule">Batas jam jadwal</option>
          </select>
        </Field>
        <Field label={form.timingType === 'duration' ? 'Durasi (menit)' : 'Durasi maksimal (menit)'}>
          <input
            className="input"
            type="number"
            min={5}
            value={form.durationMinutes}
            onChange={(event) => update({ durationMinutes: Number(event.target.value) })}
          />
        </Field>
        <Field label="Jadwal mulai">
          <input className="input" type="datetime-local" value={form.scheduledAt} onChange={(event) => update({ scheduledAt: event.target.value })} />
        </Field>
        <Field label="KKM">
          <input className="input" type="number" min={0} max={100} value={form.kkm} onChange={(event) => update({ kkm: Number(event.target.value) })} />
        </Field>
        <Field label="Token masuk">
          <input className="input mono" value={form.entryToken} onChange={(event) => update({ entryToken: event.target.value })} placeholder="PAS2026" />
        </Field>

        {form.mode === 'pdf_based' && (
          <>
            <Field label="Judul naskah PDF" className="span-2">
              <input
                className="input"
                value={form.pdfReferenceTitle ?? ''}
                onChange={(event) => update({ pdfReferenceTitle: event.target.value })}
                placeholder="Naskah_Sumber_Literasi_2026.pdf"
              />
            </Field>
            <Field label="Isi naskah sumber" className="span-2" hint="Teks naskah yang ditampilkan di layar ujian peserta.">
              <textarea
                className="input"
                rows={4}
                value={form.pdfReferenceContent ?? ''}
                onChange={(event) => update({ pdfReferenceContent: event.target.value })}
              />
            </Field>
          </>
        )}

        <div className="span-2">
          <div className="form-section-title">Pengaturan pelaksanaan</div>
          <div className="check-grid">
            {[
              { key: 'randomizeQuestions' as const, label: 'Acak urutan soal' },
              { key: 'randomizeOptions' as const, label: 'Acak pilihan jawaban' },
              { key: 'lockdownMode' as const, label: 'Lockdown / fullscreen' },
              { key: 'pauseWhenOffline' as const, label: 'Jeda saat offline' },
            ].map((item) => (
              <label className="check" key={item.key}>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(event) => update({ [item.key]: event.target.checked } as Partial<Exam>)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="span-2">
          <div className="form-section-title">
            Pilih soal ({form.questionIds.length} dipilih)
          </div>
          <div className="pick-list">
            {workspace.questions.map((question) => (
              <label className="pick-row" key={question.id}>
                <input
                  type="checkbox"
                  checked={form.questionIds.includes(question.id)}
                  onChange={() => toggleQuestion(question.id)}
                />
                <span>
                  <strong>{question.subject}</strong> · {question.indicator}
                  <span className="muted small"> — {question.points} poin</span>
                </span>
              </label>
            ))}
            {workspace.questions.length === 0 && <p className="muted small">Bank soal masih kosong.</p>}
          </div>
        </div>

        {error && <p className="form-error span-2">{error}</p>}
      </form>
    </Modal>
  );
}
