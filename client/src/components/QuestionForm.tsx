import { useState, type FormEvent } from 'react';
import { saveQuestion, uid } from '../lib/store';
import type { Difficulty, Question, QuestionType } from '../types';
import { Field, Modal } from './ui';
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '../lib/format';
import Icon from './Icon';

const TYPES = Object.keys(QUESTION_TYPE_LABEL) as QuestionType[];
const DIFFICULTIES = Object.keys(DIFFICULTY_LABEL) as Difficulty[];

export default function QuestionForm({ initial, onClose }: { initial?: Question; onClose: () => void }) {
  const [form, setForm] = useState<Question>(
    initial ?? {
      id: uid('q'),
      subject: '',
      indicator: '',
      difficulty: 'mudah',
      type: 'multiple_choice',
      prompt: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      correctIndices: [],
      matchingPairs: [
        { left: '', right: '' },
        { left: '', right: '' },
      ],
      orderingItems: ['', '', ''],
      answerKey: '',
      explanation: '',
      points: 10,
    },
  );
  const [error, setError] = useState('');

  const update = (patch: Partial<Question>) => setForm((prev) => ({ ...prev, ...patch }));

  const needsOptions = ['multiple_choice', 'complex_mc', 'true_false'].includes(form.type);

  const changeType = (type: QuestionType) => {
    if (type === 'true_false') update({ type, options: ['Benar', 'Salah'], correctIndex: 0 });
    else if (type === 'multiple_choice' || type === 'complex_mc') update({ type, options: form.options ?? ['', '', '', ''] });
    else update({ type });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.indicator.trim() || !form.prompt.trim()) {
      setError('Mata pelajaran, indikator, dan pertanyaan wajib diisi.');
      return;
    }
    if (needsOptions) {
      const options = (form.options ?? []).map((option) => option.trim()).filter(Boolean);
      if (options.length < 2) {
        setError('Minimal dua pilihan jawaban.');
        return;
      }
      if (form.type === 'complex_mc' && (form.correctIndices ?? []).length === 0) {
        setError('Tandai minimal satu jawaban benar.');
        return;
      }
    }
    if (form.type === 'matching' && (form.matchingPairs ?? []).filter((pair) => pair.left.trim() && pair.right.trim()).length < 2) {
      setError('Isi minimal dua pasangan menjodohkan.');
      return;
    }
    if (form.type === 'ordering' && (form.orderingItems ?? []).filter((item) => item.trim()).length < 2) {
      setError('Isi minimal dua item urutan.');
      return;
    }
    if (['fill_blank', 'short_answer'].includes(form.type) && !form.answerKey?.trim()) {
      setError('Kunci jawaban wajib diisi.');
      return;
    }

    saveQuestion({
      ...form,
      subject: form.subject.trim(),
      indicator: form.indicator.trim(),
      options: needsOptions ? (form.options ?? []).map((option) => option.trim()).filter(Boolean) : undefined,
      matchingPairs: form.type === 'matching' ? (form.matchingPairs ?? []).filter((pair) => pair.left.trim() && pair.right.trim()) : undefined,
      orderingItems: form.type === 'ordering' ? (form.orderingItems ?? []).filter((item) => item.trim()) : undefined,
    });
    onClose();
  };

  return (
    <Modal
      title={initial ? 'Edit Soal' : 'Tambah Soal'}
      onClose={onClose}
      width={720}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="question-form" className="btn primary">
            Simpan Soal
          </button>
        </>
      }
    >
      <form id="question-form" className="form-grid" onSubmit={submit}>
        <Field label="Mata pelajaran">
          <input className="input" value={form.subject} onChange={(event) => update({ subject: event.target.value })} placeholder="Matematika" />
        </Field>
        <Field label="Indikator / materi">
          <input className="input" value={form.indicator} onChange={(event) => update({ indicator: event.target.value })} placeholder="Turunan Fungsi Aljabar" />
        </Field>
        <Field label="Tipe soal">
          <select className="input" value={form.type} onChange={(event) => changeType(event.target.value as QuestionType)}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tingkat kesulitan">
          <select className="input" value={form.difficulty} onChange={(event) => update({ difficulty: event.target.value as Difficulty })}>
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {DIFFICULTY_LABEL[difficulty]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pertanyaan / stimulus" className="span-2">
          <textarea className="input" rows={3} value={form.prompt} onChange={(event) => update({ prompt: event.target.value })} />
        </Field>

        {needsOptions && (
          <div className="span-2">
            <div className="form-section-title">
              Pilihan jawaban {form.type === 'complex_mc' ? '(boleh lebih dari satu benar)' : '(pilih satu benar)'}
            </div>
            <div className="option-list">
              {(form.options ?? []).map((option, index) => (
                <div className="option-row" key={index}>
                  <input
                    type={form.type === 'complex_mc' ? 'checkbox' : 'radio'}
                    name="correct"
                    checked={
                      form.type === 'complex_mc'
                        ? (form.correctIndices ?? []).includes(index)
                        : form.correctIndex === index
                    }
                    onChange={() => {
                      if (form.type === 'complex_mc') {
                        const current = form.correctIndices ?? [];
                        update({
                          correctIndices: current.includes(index)
                            ? current.filter((value) => value !== index)
                            : [...current, index],
                        });
                      } else {
                        update({ correctIndex: index });
                      }
                    }}
                    aria-label={`Tandai pilihan ${index + 1} benar`}
                  />
                  <input
                    className="input"
                    value={option}
                    onChange={(event) => {
                      const options = [...(form.options ?? [])];
                      options[index] = event.target.value;
                      update({ options });
                    }}
                    placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                    readOnly={form.type === 'true_false'}
                  />
                  {(form.options ?? []).length > 2 && form.type !== 'true_false' && (
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label="Hapus pilihan"
                      onClick={() => update({ options: (form.options ?? []).filter((_, i) => i !== index) })}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.type !== 'true_false' && (
              <button
                type="button"
                className="btn ghost small"
                onClick={() => update({ options: [...(form.options ?? []), ''] })}
              >
                <Icon name="plus" size={14} /> Tambah pilihan
              </button>
            )}
          </div>
        )}

        {form.type === 'matching' && (
          <div className="span-2">
            <div className="form-section-title">Pasangan menjodohkan</div>
            {(form.matchingPairs ?? []).map((pair, index) => (
              <div className="pair-row" key={index}>
                <input
                  className="input"
                  value={pair.left}
                  onChange={(event) => {
                    const pairs = [...(form.matchingPairs ?? [])];
                    pairs[index] = { ...pairs[index], left: event.target.value };
                    update({ matchingPairs: pairs });
                  }}
                  placeholder="Kiri (soal)"
                />
                <span className="pair-arrow">↔</span>
                <input
                  className="input"
                  value={pair.right}
                  onChange={(event) => {
                    const pairs = [...(form.matchingPairs ?? [])];
                    pairs[index] = { ...pairs[index], right: event.target.value };
                    update({ matchingPairs: pairs });
                  }}
                  placeholder="Kanan (pasangan)"
                />
              </div>
            ))}
            <button
              type="button"
              className="btn ghost small"
              onClick={() => update({ matchingPairs: [...(form.matchingPairs ?? []), { left: '', right: '' }] })}
            >
              <Icon name="plus" size={14} /> Tambah pasangan
            </button>
          </div>
        )}

        {form.type === 'ordering' && (
          <div className="span-2">
            <div className="form-section-title">Urutan benar (atas ke bawah)</div>
            {(form.orderingItems ?? []).map((item, index) => (
              <div className="option-row" key={index}>
                <span className="order-num">{index + 1}</span>
                <input
                  className="input"
                  value={item}
                  onChange={(event) => {
                    const items = [...(form.orderingItems ?? [])];
                    items[index] = event.target.value;
                    update({ orderingItems: items });
                  }}
                  placeholder={`Langkah ${index + 1}`}
                />
                {(form.orderingItems ?? []).length > 2 && (
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label="Hapus langkah"
                    onClick={() => update({ orderingItems: (form.orderingItems ?? []).filter((_, i) => i !== index) })}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn ghost small"
              onClick={() => update({ orderingItems: [...(form.orderingItems ?? []), ''] })}
            >
              <Icon name="plus" size={14} /> Tambah langkah
            </button>
          </div>
        )}

        {['fill_blank', 'short_answer', 'essay', 'audio_response'].includes(form.type) && (
          <Field
            label={form.type === 'essay' || form.type === 'audio_response' ? 'Kunci / rubrik penilaian' : 'Kunci jawaban'}
            className="span-2"
          >
            <textarea className="input" rows={2} value={form.answerKey ?? ''} onChange={(event) => update({ answerKey: event.target.value })} />
          </Field>
        )}

        <Field label="Pembahasan" className="span-2">
          <textarea className="input" rows={2} value={form.explanation} onChange={(event) => update({ explanation: event.target.value })} />
        </Field>
        <Field label="Poin">
          <input className="input" type="number" min={1} value={form.points} onChange={(event) => update({ points: Number(event.target.value) })} />
        </Field>

        {error && <p className="form-error span-2">{error}</p>}
      </form>
    </Modal>
  );
}
