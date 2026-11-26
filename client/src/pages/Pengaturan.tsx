import { useRef, useState, type FormEvent } from 'react';
import { deleteUser, restoreWorkspace, saveSettings, saveUser, toast, uid, useAppState, useSession } from '../lib/store';
import type { Role, User, Workspace } from '../types';
import { Badge, ConfirmDialog, EmptyState, Field, Modal, Panel, Tabs } from '../components/ui';
import Icon from '../components/Icon';
import { formatDateTime } from '../lib/format';

const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', user: 'User / Guru', peserta: 'Peserta' };

function UserForm({ initial, onClose }: { initial?: User; onClose: () => void }) {
  const { workspace } = useAppState();
  const [form, setForm] = useState<User>(
    initial ?? {
      id: uid('usr'),
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'peserta',
      classId: workspace.classes[0]?.id,
      active: true,
      allowedWhenLocked: false,
      createdAt: new Date().toISOString(),
    },
  );
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.password) {
      setError('Nama, username, dan password wajib diisi.');
      return;
    }
    saveUser({ ...form, name: form.name.trim(), username: form.username.trim() });
    onClose();
  };

  return (
    <Modal
      title={initial ? 'Edit Akun' : 'Tambah Akun'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="user-form" className="btn primary">
            Simpan Akun
          </button>
        </>
      }
    >
      <form id="user-form" className="form-grid" onSubmit={submit}>
        <Field label="Nama lengkap" className="span-2">
          <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Username">
          <input className="input" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </Field>
        <Field label="Password">
          <input className="input" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <Field label="Email">
          <input className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Peran">
          <select className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
        </Field>
        {form.role === 'peserta' && (
          <Field label="Kelas">
            <select className="input" value={form.classId ?? ''} onChange={(event) => setForm({ ...form, classId: event.target.value })}>
              {workspace.classes.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="span-2 check-grid">
          <label className="check">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            <span>Akun aktif</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.allowedWhenLocked}
              onChange={(event) => setForm({ ...form, allowedWhenLocked: event.target.checked })}
            />
            <span>Boleh masuk saat aplikasi dikunci</span>
          </label>
        </div>
        {error && <p className="form-error span-2">{error}</p>}
      </form>
    </Modal>
  );
}

export default function PengaturanPage() {
  const { workspace } = useAppState();
  const user = useSession();
  const { settings } = workspace;
  const [tab, setTab] = useState('umum');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const importInput = useRef<HTMLInputElement | null>(null);

  const canManage = user?.role === 'admin';

  const uploadLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveSettings({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const backup = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-scbt-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Backup berhasil diunduh');
  };

  const importBackup = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Workspace;
        if (!parsed.users || !parsed.exams) throw new Error('format');
        restoreWorkspace(parsed);
        toast('Backup berhasil dipulihkan');
      } catch {
        toast('File backup tidak valid', 'warn');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pengaturan &amp; Kontrol</h1>
          <p className="page-sub">Logo, tema, ribon berjalan, akun pengguna, backup, dan log aktivitas</p>
        </div>
        {!canManage && <span className="chip chip-amber">Mode lihat — hanya admin dapat mengubah</span>}
      </div>

      <Tabs
        tabs={[
          { id: 'umum', label: 'Identitas & Tampilan' },
          { id: 'pengguna', label: 'Akun Pengguna', count: workspace.users.length },
          { id: 'backup', label: 'Backup & Sinkron' },
          { id: 'log', label: 'Log Aktivitas', count: workspace.logs.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'umum' && (
        <div className="grid-2">
          <Panel title="Identitas Aplikasi" subtitle="Nama aplikasi dan lembaga pada header">
            <div className="form-grid">
              <Field label="Nama aplikasi">
                <input
                  className="input"
                  value={settings.appTitle}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ appTitle: event.target.value })}
                />
              </Field>
              <Field label="Nama lembaga">
                <input
                  className="input"
                  value={settings.institutionName}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ institutionName: event.target.value })}
                />
              </Field>
              <div className="span-2 logo-row">
                <span className="logo-preview">
                  {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="Logo aplikasi" /> : <Icon name="shield" size={22} />}
                </span>
                <div>
                  <button type="button" className="btn ghost small" onClick={() => logoInput.current?.click()} disabled={!canManage}>
                    <Icon name="upload" size={14} /> Ganti logo
                  </button>
                  <p className="muted small">PNG/JPG, disarankan 512×512. Tersimpan offline.</p>
                </div>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => uploadLogo(event.target.files?.[0])}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Ribon Teks Berjalan" subtitle="Teks pengumuman pada bagian atas aplikasi">
            <div className="form-grid">
              <Field label="Teks berjalan" className="span-2">
                <input
                  className="input"
                  value={settings.runningText.text}
                  disabled={!canManage}
                  onChange={(event) =>
                    saveSettings({ runningText: { ...settings.runningText, text: event.target.value } })
                  }
                />
              </Field>
              <Field label="Warna latar">
                <input
                  className="input"
                  type="color"
                  value={settings.runningText.bgColor}
                  disabled={!canManage}
                  onChange={(event) =>
                    saveSettings({ runningText: { ...settings.runningText, bgColor: event.target.value } })
                  }
                />
              </Field>
              <Field label="Warna teks">
                <input
                  className="input"
                  type="color"
                  value={settings.runningText.textColor}
                  disabled={!canManage}
                  onChange={(event) =>
                    saveSettings({ runningText: { ...settings.runningText, textColor: event.target.value } })
                  }
                />
              </Field>
              <Field label="Ukuran font (px)">
                <input
                  className="input"
                  type="number"
                  min={10}
                  max={24}
                  value={settings.runningText.fontSizePx}
                  disabled={!canManage}
                  onChange={(event) =>
                    saveSettings({ runningText: { ...settings.runningText, fontSizePx: Number(event.target.value) } })
                  }
                />
              </Field>
              <div className="check-grid">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.runningText.enabled}
                    disabled={!canManage}
                    onChange={(event) =>
                      saveSettings({ runningText: { ...settings.runningText, enabled: event.target.checked } })
                    }
                  />
                  <span>Tampilkan ribon</span>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.runningText.bold}
                    disabled={!canManage}
                    onChange={(event) =>
                      saveSettings({ runningText: { ...settings.runningText, bold: event.target.checked } })
                    }
                  />
                  <span>Teks tebal</span>
                </label>
              </div>
            </div>
          </Panel>

          <Panel title="Keamanan Aplikasi" subtitle="Kunci akses dan pembatasan pengguna">
            <div className="check-grid">
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.appLocked}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ appLocked: event.target.checked })}
                />
                <span>Kunci aplikasi (hanya akun diizinkan yang bisa masuk)</span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.restrictToAllowedUsers}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ restrictToAllowedUsers: event.target.checked })}
                />
                <span>Batasi akses ke pengguna terdaftar</span>
              </label>
            </div>
          </Panel>

          <Panel title="Lokasi & Kontak Resmi" subtitle={settings.location.sectionTitle}>
            <div className="form-grid">
              <Field label="Nama tempat" className="span-2">
                <input
                  className="input"
                  value={settings.location.placeName}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ location: { ...settings.location, placeName: event.target.value } })}
                />
              </Field>
              <Field label="Alamat" className="span-2">
                <input
                  className="input"
                  value={settings.location.address}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ location: { ...settings.location, address: event.target.value } })}
                />
              </Field>
              <Field label="Telepon / WA">
                <input
                  className="input"
                  value={settings.location.phone}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ location: { ...settings.location, phone: event.target.value } })}
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  value={settings.location.email}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ location: { ...settings.location, email: event.target.value } })}
                />
              </Field>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'pengguna' && (
        <Panel
          title="Akun Pengguna"
          subtitle="Admin, guru/operator, dan peserta"
          actions={
            canManage && (
              <button type="button" className="btn primary small" onClick={() => setEditing('new')}>
                <Icon name="plus" size={14} /> Tambah Akun
              </button>
            )
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Username</th>
                  <th>Peran</th>
                  <th>Kelas</th>
                  <th>Status</th>
                  <th className="actions-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {workspace.users.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="strong">{row.name}</div>
                      <div className="muted small">{row.email}</div>
                    </td>
                    <td className="mono">{row.username}</td>
                    <td>{ROLE_LABEL[row.role]}</td>
                    <td>{workspace.classes.find((kelas) => kelas.id === row.classId)?.name ?? '—'}</td>
                    <td>
                      <Badge tone={row.active ? 'green' : 'gray'}>{row.active ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                    <td>
                      {canManage && (
                        <div className="row-actions">
                          <button type="button" className="icon-btn" aria-label={`Edit ${row.name}`} onClick={() => setEditing(row)}>
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            aria-label={`Hapus ${row.name}`}
                            onClick={() => setDeleting(row)}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {workspace.users.length === 0 && <EmptyState title="Belum ada akun" />}
          </div>
        </Panel>
      )}

      {tab === 'backup' && (
        <div className="grid-2">
          <Panel title="Sinkronisasi Cloud" subtitle="Data offline disinkronkan ke server saat terhubung">
            <div className="check-grid">
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.cloudSyncEnabled}
                  disabled={!canManage}
                  onChange={(event) => saveSettings({ cloudSyncEnabled: event.target.checked })}
                />
                <span>Aktifkan sinkronisasi otomatis ke server</span>
              </label>
            </div>
            <p className="muted small">
              Status: {settings.cloudSyncEnabled ? 'Sinkronisasi aktif — perubahan dikirim otomatis.' : 'Sinkronisasi nonaktif — data hanya tersimpan di perangkat ini.'}
            </p>
          </Panel>

          <Panel title="Backup & Restore" subtitle="Cadangkan seluruh data ujian dalam satu berkas JSON">
            <div className="head-actions">
              <button type="button" className="btn ghost" onClick={backup}>
                <Icon name="download" size={15} /> Unduh Backup
              </button>
              <button type="button" className="btn ghost" onClick={() => importInput.current?.click()} disabled={!canManage}>
                <Icon name="upload" size={15} /> Pulihkan Backup
              </button>
              <input
                ref={importInput}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => importBackup(event.target.files?.[0])}
              />
            </div>
            <p className="muted small">
              Backup mencakup {workspace.questions.length} soal, {workspace.exams.length} sesi ujian, dan{' '}
              {workspace.attempts.length} riwayat pengerjaan.
            </p>
          </Panel>
        </div>
      )}

      {tab === 'log' && (
        <Panel title="Log Aktivitas" subtitle="Rekam jejak login, ujian, dan perubahan data">
          <div className="list">
            {workspace.logs.map((entry) => (
              <div className="list-row" key={entry.id}>
                <div>
                  <div className="strong">{entry.action}</div>
                  <div className="muted small">
                    {entry.actor} · {entry.detail}
                  </div>
                </div>
                <span className="muted small">{formatDateTime(entry.at)}</span>
              </div>
            ))}
            {workspace.logs.length === 0 && <EmptyState title="Belum ada aktivitas" />}
          </div>
        </Panel>
      )}

      {editing && <UserForm initial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Hapus akun"
          message={`Hapus akun ${deleting.name}? Riwayat ujian yang sudah ada tetap tersimpan.`}
          confirmLabel="Hapus Akun"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteUser(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
