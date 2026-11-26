import { useMemo, useState, type FormEvent } from 'react';
import { deleteClass, saveClass, setAttendance, uid, useAppState } from '../lib/store';
import type { AttendanceStatus, Kelas } from '../types';
import { Badge, ConfirmDialog, EmptyState, Field, Modal, Panel, StatCard } from '../components/ui';
import Icon from '../components/Icon';

const STATUS: { id: AttendanceStatus; label: string; tone: 'green' | 'blue' | 'amber' | 'red' }[] = [
  { id: 'hadir', label: 'Hadir', tone: 'green' },
  { id: 'izin', label: 'Izin', tone: 'blue' },
  { id: 'sakit', label: 'Sakit', tone: 'amber' },
  { id: 'alfa', label: 'Alfa', tone: 'red' },
];

function ClassForm({ initial, onClose }: { initial?: Kelas; onClose: () => void }) {
  const [form, setForm] = useState<Kelas>(
    initial ?? { id: uid('cls'), name: '', level: 'SMA Kelas 12', homeroomTeacher: '', studentCount: 0 },
  );
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Nama kelas wajib diisi.');
      return;
    }
    saveClass({ ...form, name: form.name.trim(), homeroomTeacher: form.homeroomTeacher.trim() || '—' });
    onClose();
  };

  return (
    <Modal
      title={initial ? 'Edit Kelas' : 'Tambah Kelas'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="class-form" className="btn primary">
            Simpan Kelas
          </button>
        </>
      }
    >
      <form id="class-form" className="form-grid" onSubmit={submit}>
        <Field label="Nama kelas">
          <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="XII IPA 1" />
        </Field>
        <Field label="Jenjang">
          <input className="input" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} placeholder="SMA Kelas 12" />
        </Field>
        <Field label="Wali kelas" className="span-2">
          <input
            className="input"
            value={form.homeroomTeacher}
            onChange={(event) => setForm({ ...form, homeroomTeacher: event.target.value })}
            placeholder="Siti Rahmawati, S.Si"
          />
        </Field>
        <Field label="Jumlah siswa">
          <input
            className="input"
            type="number"
            min={0}
            value={form.studentCount}
            onChange={(event) => setForm({ ...form, studentCount: Number(event.target.value) })}
          />
        </Field>
        {error && <p className="form-error span-2">{error}</p>}
      </form>
    </Modal>
  );
}

export default function KelasPage() {
  const { workspace } = useAppState();
  const [selected, setSelected] = useState(workspace.classes[0]?.id ?? '');
  const [editing, setEditing] = useState<Kelas | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Kelas | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const activeClass = workspace.classes.find((kelas) => kelas.id === selected) ?? workspace.classes[0];

  const students = useMemo(
    () => workspace.users.filter((user) => user.role === 'peserta' && user.classId === activeClass?.id),
    [workspace.users, activeClass],
  );

  const todayAttendance = useMemo(
    () => workspace.attendance.filter((row) => row.classId === activeClass?.id && row.date === today),
    [workspace.attendance, activeClass, today],
  );

  const statusOf = (studentId: string) => todayAttendance.find((row) => row.studentId === studentId)?.status;

  const summary = STATUS.map((status) => ({
    ...status,
    count: todayAttendance.filter((row) => row.status === status.id).length,
  }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Kelas &amp; Absensi</h1>
          <p className="page-sub">Daftar rombel, wali kelas, dan presensi kehadiran siswa harian</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} /> Tambah Kelas
        </button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Kelas" value={workspace.classes.length} sub="Rombongan belajar aktif" icon={<Icon name="grid" size={16} />} />
        {summary.map((item) => (
          <StatCard
            key={item.id}
            label={item.label}
            value={item.count}
            sub={`Presensi ${activeClass?.name ?? '—'} hari ini`}
            tone={item.tone}
            icon={<Icon name={item.id === 'hadir' ? 'check' : item.id === 'alfa' ? 'close' : 'clock'} size={16} />}
          />
        ))}
      </div>

      <div className="grid-2">
        <Panel title="Daftar Kelas" subtitle="Pilih kelas untuk mencatat absensi">
          <div className="class-list">
            {workspace.classes.map((kelas) => (
              <button
                key={kelas.id}
                type="button"
                className={`class-card${kelas.id === activeClass?.id ? ' active' : ''}`}
                onClick={() => setSelected(kelas.id)}
              >
                <div>
                  <div className="strong">{kelas.name}</div>
                  <div className="muted small">
                    {kelas.level} · {kelas.homeroomTeacher}
                  </div>
                </div>
                <div className="class-actions">
                  <span className="chip chip-blue">{kelas.studentCount} siswa</span>
                  <span
                    className="icon-btn"
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit ${kelas.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditing(kelas);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation();
                        setEditing(kelas);
                      }
                    }}
                  >
                    <Icon name="edit" size={15} />
                  </span>
                  <span
                    className="icon-btn danger"
                    role="button"
                    tabIndex={0}
                    aria-label={`Hapus ${kelas.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleting(kelas);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation();
                        setDeleting(kelas);
                      }
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </span>
                </div>
              </button>
            ))}
            {workspace.classes.length === 0 && <EmptyState title="Belum ada kelas" hint="Tambahkan kelas lewat tombol di atas." />}
          </div>
        </Panel>

        <Panel
          title={`Absensi ${activeClass?.name ?? '—'}`}
          subtitle={`Presensi tanggal ${today}`}
          actions={<span className="chip chip-green">{todayAttendance.length} tercatat</span>}
        >
          <div className="att-list">
            {students.map((student) => {
              const current = statusOf(student.id);
              return (
                <div className="att-row" key={student.id}>
                  <div className="att-name">
                    <strong>{student.name}</strong>
                    <span className="muted small">{student.email}</span>
                  </div>
                  <div className="seg small-seg">
                    {STATUS.map((status) => (
                      <button
                        key={status.id}
                        type="button"
                        className={current === status.id ? 'active' : ''}
                        aria-label={`${status.label} ${student.name}`}
                        onClick={() => setAttendance(activeClass?.id ?? '', student.id, student.name, status.id)}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {students.length === 0 && (
              <EmptyState title="Belum ada siswa" hint="Tambahkan akun peserta dengan kelas ini di menu Pengaturan." />
            )}
          </div>
          {todayAttendance.length > 0 && (
            <div className="att-log">
              {todayAttendance.map((row) => (
                <div className="att-log-row" key={row.id}>
                  <span>{row.studentName}</span>
                  <Badge tone={STATUS.find((status) => status.id === row.status)?.tone ?? 'gray'}>
                    {STATUS.find((status) => status.id === row.status)?.label}
                  </Badge>
                  <span className="muted small">{row.recordedBy}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {editing && <ClassForm initial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Hapus kelas"
          message={`Hapus kelas ${deleting.name}? Akun peserta tetap ada, tetapi kehilangan penanda kelas.`}
          confirmLabel="Hapus Kelas"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteClass(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
