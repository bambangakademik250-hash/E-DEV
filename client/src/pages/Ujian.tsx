import { useState, type FormEvent } from 'react';
import { deleteUjian, saveUjian, useAppState } from '../lib/store';
import type { StatusUjian, TipeUjian, Ujian, UjianForm } from '../types';
import { Badge, ConfirmDialog, EmptyState, Modal } from '../components/ui';
import Icon from '../components/Icon';

const ICONS = ['🌿', '🌲', '🗂️', '🌳', '🪨', '💧', '📘', '🧪'];

function UjianFormModal({ initial, onClose }: { initial?: Ujian; onClose: () => void }) {
  const [form, setForm] = useState({
    nama: initial?.nama ?? '',
    kode: initial?.kode ?? '',
    tipe: (initial?.tipe ?? 'UTS') as TipeUjian,
    soal: String(initial?.soal ?? 30),
    semester: String(initial?.semester ?? 1),
    status: (initial?.status ?? 'belum') as StatusUjian,
    ikon: initial?.ikon ?? '📘',
  });
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nama.trim() || !form.kode.trim()) {
      setError('Nama mata kuliah dan kode wajib diisi.');
      return;
    }
    const soal = Number(form.soal);
    const semester = Number(form.semester);
    if (!Number.isFinite(soal) || soal < 1) {
      setError('Jumlah soal minimal 1.');
      return;
    }
    if (!Number.isFinite(semester) || semester < 1 || semester > 14) {
      setError('Semester harus antara 1 dan 14.');
      return;
    }

    const payload: UjianForm = {
      id: initial?.id,
      nama: form.nama.trim(),
      kode: form.kode.trim().toUpperCase(),
      tipe: form.tipe,
      soal,
      semester,
      status: form.status,
      ikon: form.ikon,
    };
    void saveUjian(payload);
    onClose();
  };

  return (
    <Modal
      title={initial ? 'Edit Mata Kuliah / Ujian' : 'Tambah Mata Kuliah / Ujian'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="ujian-form" className="btn primary">
            {initial ? 'Simpan Perubahan' : 'Simpan Ujian'}
          </button>
        </>
      }
    >
      <form id="ujian-form" className="form-grid" onSubmit={submit}>
        <label className="field span-2">
          <span>Nama mata kuliah</span>
          <input
            className="input"
            name="nama"
            value={form.nama}
            onChange={(event) => setForm((prev) => ({ ...prev, nama: event.target.value }))}
            placeholder="Ekologi Hutan"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Kode</span>
          <input
            className="input"
            name="kode"
            value={form.kode}
            onChange={(event) => setForm((prev) => ({ ...prev, kode: event.target.value }))}
            placeholder="MNH301"
          />
        </label>
        <label className="field">
          <span>Tipe ujian</span>
          <select
            className="input"
            name="tipe"
            value={form.tipe}
            onChange={(event) => setForm((prev) => ({ ...prev, tipe: event.target.value as TipeUjian }))}
          >
            <option value="UTS">UTS</option>
            <option value="UAS">UAS</option>
          </select>
        </label>
        <label className="field">
          <span>Jumlah soal</span>
          <input
            className="input"
            name="soal"
            type="number"
            min={1}
            value={form.soal}
            onChange={(event) => setForm((prev) => ({ ...prev, soal: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Semester</span>
          <input
            className="input"
            name="semester"
            type="number"
            min={1}
            max={14}
            value={form.semester}
            onChange={(event) => setForm((prev) => ({ ...prev, semester: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            className="input"
            name="status"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as StatusUjian }))}
          >
            <option value="belum">Belum berlangsung</option>
            <option value="aktif">Aktif</option>
          </select>
        </label>
        <div className="field">
          <span>Ikon</span>
          <div className="icon-picker">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`icon-choice${form.ikon === icon ? ' on' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, ikon: icon }))}
                aria-label={`Pilih ikon ${icon}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="form-error span-2">{error}</p>}
      </form>
    </Modal>
  );
}

export default function UjianPage() {
  const { ujian } = useAppState();
  const [editing, setEditing] = useState<Ujian | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Ujian | null>(null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mata Kuliah &amp; Ujian</h1>
          <p className="page-sub">Kelola paket ujian UTS/UAS yang tersedia untuk peserta</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} /> Tambah Ujian
        </button>
      </div>

      {ujian.length === 0 ? (
        <div className="card">
          <EmptyState title="Belum ada mata kuliah" hint="Tambahkan ujian pertama lewat tombol di atas." />
        </div>
      ) : (
        <div className="mk-grid">
          {ujian.map((row) => (
            <article key={row.id} className="mk-card">
              <div className="mk-top">
                <span className="mk-icon">{row.ikon}</span>
                <Badge tone={row.status === 'aktif' ? 'green' : 'gray'}>
                  {row.status === 'aktif' ? 'Aktif' : 'Belum'}
                </Badge>
              </div>
              <h3 className="mk-name">{row.nama}</h3>
              <p className="muted small">
                {row.kode} · Semester {row.semester}
              </p>
              <div className="mk-meta">
                <Badge tone={row.tipe === 'UTS' ? 'blue' : 'violet'}>{row.tipe}</Badge>
                <span className="muted small">{row.soal} soal</span>
              </div>
              <div className="mk-actions">
                <button
                  type="button"
                  className="btn ghost small"
                  aria-label={`Edit ${row.nama}`}
                  onClick={() => setEditing(row)}
                >
                  <Icon name="edit" size={14} /> Edit
                </button>
                <button
                  type="button"
                  className="btn ghost small danger-text"
                  aria-label={`Hapus ${row.nama}`}
                  onClick={() => setDeleting(row)}
                >
                  <Icon name="trash" size={14} /> Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <UjianFormModal initial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus ujian"
          message={`Hapus ${deleting.nama} (${deleting.kode})? Data peserta tidak ikut terhapus.`}
          confirmLabel="Hapus Ujian"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            void deleteUjian(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
