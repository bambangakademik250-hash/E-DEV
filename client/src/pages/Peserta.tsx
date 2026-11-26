import { useMemo, useState, type FormEvent } from 'react';
import { deletePeserta, savePeserta, useAppState } from '../lib/store';
import type { Peserta, PesertaForm, StatusPeserta } from '../types';
import { gradeOf, gradeTone } from '../lib/format';
import { Avatar, Badge, ConfirmDialog, EmptyState, Modal } from '../components/ui';
import Icon from '../components/Icon';

const STATUS_LABEL: Record<StatusPeserta, string> = {
  online: 'Sedang ujian',
  selesai: 'Selesai',
  offline: 'Belum hadir',
};

const STATUS_TONE: Record<StatusPeserta, 'green' | 'blue' | 'gray'> = {
  online: 'green',
  selesai: 'blue',
  offline: 'gray',
};

interface FormState {
  nama: string;
  nim: string;
  kelas: string;
  mataKuliah: string;
  status: StatusPeserta;
  nilai: string;
  peringatan: string;
}

function toForm(initial?: Peserta, defaultMk = ''): FormState {
  return {
    nama: initial?.nama ?? '',
    nim: initial?.nim ?? '',
    kelas: initial?.kelas ?? '',
    mataKuliah: initial?.mataKuliah ?? defaultMk,
    status: initial?.status ?? 'offline',
    nilai: initial?.nilai !== null && initial?.nilai !== undefined ? String(initial.nilai) : '',
    peringatan: String(initial?.peringatan ?? 0),
  };
}

function PesertaFormModal({
  initial,
  mataKuliahOptions,
  onClose,
}: {
  initial?: Peserta;
  mataKuliahOptions: string[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(initial, mataKuliahOptions[0] ?? ''));
  const [error, setError] = useState('');

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nama.trim() || !form.nim.trim()) {
      setError('Nama dan NIM wajib diisi.');
      return;
    }
    const nilai = form.nilai === '' ? null : Number(form.nilai);
    if (nilai !== null && (Number.isNaN(nilai) || nilai < 0 || nilai > 100)) {
      setError('Nilai harus berupa angka 0–100.');
      return;
    }

    const payload: PesertaForm = {
      id: initial?.id,
      nama: form.nama.trim(),
      nim: form.nim.trim(),
      kelas: form.kelas.trim() || 'Tanpa kelas',
      mataKuliah: form.mataKuliah.trim() || mataKuliahOptions[0] || 'Umum',
      status: form.status,
      nilai,
      peringatan: Math.max(0, Number(form.peringatan) || 0),
    };
    void savePeserta(payload);
    onClose();
  };

  const mkOptions = [...new Set([...mataKuliahOptions, form.mataKuliah].filter(Boolean))];

  return (
    <Modal
      title={initial ? 'Edit Peserta' : 'Tambah Peserta'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="peserta-form" className="btn primary">
            {initial ? 'Simpan Perubahan' : 'Simpan Peserta'}
          </button>
        </>
      }
    >
      <form id="peserta-form" className="form-grid" onSubmit={submit}>
        <label className="field span-2">
          <span>Nama lengkap</span>
          <input
            className="input"
            name="nama"
            value={form.nama}
            onChange={(event) => update({ nama: event.target.value })}
            placeholder="Nama peserta"
            autoFocus
          />
        </label>
        <label className="field">
          <span>NIM</span>
          <input
            className="input"
            name="nim"
            value={form.nim}
            onChange={(event) => update({ nim: event.target.value })}
            placeholder="2301101001"
          />
        </label>
        <label className="field">
          <span>Kelas</span>
          <input
            className="input"
            name="kelas"
            value={form.kelas}
            onChange={(event) => update({ kelas: event.target.value })}
            placeholder="MNH-A"
          />
        </label>
        <label className="field">
          <span>Mata kuliah</span>
          <select
            className="input"
            name="mataKuliah"
            value={form.mataKuliah}
            onChange={(event) => update({ mataKuliah: event.target.value })}
          >
            {mkOptions.length === 0 && <option value="">Umum</option>}
            {mkOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select
            className="input"
            name="status"
            value={form.status}
            onChange={(event) => update({ status: event.target.value as StatusPeserta })}
          >
            <option value="offline">Belum hadir</option>
            <option value="online">Sedang ujian</option>
            <option value="selesai">Selesai</option>
          </select>
        </label>
        <label className="field">
          <span>Nilai (0–100)</span>
          <input
            className="input"
            name="nilai"
            type="number"
            min={0}
            max={100}
            value={form.nilai}
            onChange={(event) => update({ nilai: event.target.value })}
            placeholder="Kosongkan jika belum ada"
          />
        </label>
        <label className="field">
          <span>Peringatan</span>
          <input
            className="input"
            name="peringatan"
            type="number"
            min={0}
            value={form.peringatan}
            onChange={(event) => update({ peringatan: event.target.value })}
          />
        </label>
        {error && <p className="form-error span-2">{error}</p>}
      </form>
    </Modal>
  );
}

export default function PesertaPage() {
  const { peserta, ujian } = useAppState();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'semua' | StatusPeserta>('semua');
  const [editing, setEditing] = useState<Peserta | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Peserta | null>(null);

  const mataKuliahOptions = useMemo(() => ujian.map((row) => row.nama), [ujian]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return peserta.filter((row) => {
      const matchTerm =
        !term ||
        row.nama.toLowerCase().includes(term) ||
        row.nim.toLowerCase().includes(term) ||
        row.kelas.toLowerCase().includes(term);
      const matchStatus = status === 'semua' || row.status === status;
      return matchTerm && matchStatus;
    });
  }, [peserta, search, status]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Peserta</h1>
          <p className="page-sub">Kelola data peserta ujian — tersimpan lokal dan tersinkron saat online</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} /> Tambah Peserta
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, NIM, atau kelas…"
            aria-label="Cari peserta"
          />
        </div>
        <select
          className="input select-compact"
          value={status}
          onChange={(event) => setStatus(event.target.value as 'semua' | StatusPeserta)}
          aria-label="Filter status"
        >
          <option value="semua">Semua status</option>
          <option value="online">Sedang ujian</option>
          <option value="selesai">Selesai</option>
          <option value="offline">Belum hadir</option>
        </select>
        <span className="muted small">{rows.length} peserta</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>NIM</th>
              <th>Kelas</th>
              <th>Mata Kuliah</th>
              <th>Status</th>
              <th className="num">Nilai</th>
              <th className="num">Grade</th>
              <th className="actions-col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="cell-person">
                    <Avatar name={row.nama} size={28} />
                    <span className="strong">{row.nama}</span>
                  </div>
                </td>
                <td className="mono">{row.nim}</td>
                <td>{row.kelas}</td>
                <td>{row.mataKuliah}</td>
                <td>
                  <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                </td>
                <td className="num">{row.nilai ?? '—'}</td>
                <td className="num">
                  <Badge tone={gradeTone(row.nilai)}>{gradeOf(row.nilai)}</Badge>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit peserta"
                      aria-label={`Edit ${row.nama}`}
                      onClick={() => setEditing(row)}
                    >
                      <Icon name="edit" size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Hapus peserta"
                      aria-label={`Hapus ${row.nama}`}
                      onClick={() => setDeleting(row)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState
            title="Tidak ada peserta"
            hint={search || status !== 'semua' ? 'Coba ubah kata kunci atau filter status.' : 'Tambahkan peserta pertama lewat tombol di atas.'}
          />
        )}
      </div>

      {editing && (
        <PesertaFormModal
          initial={editing === 'new' ? undefined : editing}
          mataKuliahOptions={mataKuliahOptions}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus peserta"
          message={`Hapus data ${deleting.nama} (${deleting.nim})? Tindakan ini juga diterapkan di server saat online.`}
          confirmLabel="Hapus Peserta"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            void deletePeserta(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
