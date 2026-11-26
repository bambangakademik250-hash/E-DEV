import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, registerInstitution, useAppState } from '../lib/store';
import type { Role } from '../types';
import Icon from '../components/Icon';

const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'user', label: 'User / Guru' },
  { id: 'peserta', label: 'Peserta / Instansi' },
];

const PARTNERS = [
  { code: 'EDU', name: 'Eduinesia' },
  { code: 'SMA3', name: 'SMA Negeri 3 Palu' },
  { code: 'MIN1', name: 'MIN 1 Demak' },
  { code: 'MAN2', name: 'MAN 2 Blitar' },
  { code: 'LPK', name: 'LPK Mulia Mandiri Abadi' },
  { code: 'SMP3', name: 'SMP Negeri 3 Popayato' },
  { code: 'GEO', name: 'Geometri 2026' },
  { code: 'MIAI', name: 'MI Al Islamiyah' },
  { code: 'KAST', name: 'KAST Kreativa Global' },
  { code: 'UT', name: 'Universitas Terbuka CBT' },
  { code: 'SMK1', name: 'SMK Negeri 1 Nusantara' },
];

export default function LoginPage() {
  const app = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });

  const { settings } = app.workspace;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const message = login(username, password, role);
    if (message) {
      setError(message);
      return;
    }
    navigate(role === 'peserta' ? '/ujian-peserta' : '/', { replace: true });
  };

  const submitRegister = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.username.trim() || form.password.length < 6) {
      setError('Nama, username, dan password minimal 6 karakter wajib diisi.');
      return;
    }
    const message = registerInstitution(form);
    if (message) {
      setError(message);
      return;
    }
    setTab('login');
    setRole('user');
    setUsername(form.username);
    setPassword('');
    setForm({ name: '', email: '', username: '', password: '' });
  };

  return (
    <div className="login-page">
      <div className="ribbon" style={{ background: settings.runningText.bgColor, color: settings.runningText.textColor }}>
        <span className="ribbon-track">{settings.runningText.text}</span>
      </div>

      <header className="login-hdr">
        <div className="hdr-left">
          <span className="logo">
            <Icon name="shield" size={22} />
          </span>
          <div className="brand-text">
            <span className="brand-name">{settings.appTitle}</span>
            <span className="brand-sub">{settings.institutionName}</span>
          </div>
        </div>
        <span className={`chip ${app.serverOnline ? 'chip-green' : 'chip-amber'}`}>
          <span className={`dot ${app.serverOnline ? 'dot-green' : 'dot-amber'}`} />
          {app.serverOnline ? 'Server Online' : 'Mode Offline'}
        </span>
      </header>

      <main className="login-main">
        <div className="login-left">
          <div className="login-eyebrow">
            <Icon name="monitor" size={16} /> Sistem Ujian Berbasis Komputer &amp; Smartphone (SCBT)
          </div>
          <h1>Selamat Datang di Aplikasi Ujian SCBT Online</h1>
          <p className="login-desc">
            Platform asesmen terintegrasi untuk SD, SMP, SMA, SMK, Perguruan Tinggi, Madrasah, Bimbel, dan
            Pesantren. Mendukung Ulangan Harian, PTS, PAS, UAS Mahasiswa, Tryout UNBK secara online maupun
            offline.
          </p>

          <div className="login-rules">
            <div className="login-rules-title">Tata Tertib &amp; Panduan Masuk Peserta:</div>
            <div className="rule">
              <Icon name="check" size={15} />
              <span>Masukkan Username dan Password sesuai akun yang terdaftar (Admin, User/Guru/Dosen, atau Peserta).</span>
            </div>
            <div className="rule">
              <Icon name="check" size={15} />
              <span>Jangan keluar fullscreen, geser layar, atau pindah tab saat ujian karena alarm keamanan akan berbunyi.</span>
            </div>
            <div className="rule">
              <Icon name="check" size={15} />
              <span>Jika mati lampu atau baterai habis, jawaban &amp; posisi soal terakhir tersimpan otomatis saat login lagi.</span>
            </div>
          </div>

          <div className="login-stats">
            <div>
              <span>Lembaga</span>
              <strong>3.9K+</strong>
            </div>
            <div>
              <span>Sesi Ujian</span>
              <strong>1.3M+</strong>
            </div>
            <div>
              <span>Peserta</span>
              <strong>5.4M+</strong>
            </div>
          </div>

          <p className="partners-label">Pengguna &amp; Lembaga Terdaftar (Berputar Berkelanjutan)</p>
          <div className="partners">
            <div className="partners-track">
              {[...PARTNERS, ...PARTNERS].map((partner, index) => (
                <div className="partner" key={`${partner.code}-${index}`}>
                  <span className="partner-badge">{partner.code}</span>
                  <span className="partner-name">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-head">
            <h2>{tab === 'login' ? 'USER LOGIN · SCBT ONLINE' : 'DAFTAR LEMBAGA / AKUN'}</h2>
            <p>
              {tab === 'login'
                ? 'Silakan masukkan kredensial akun Anda untuk memulai.'
                : 'Buat akun operator/lembaga baru untuk mengelola ujian.'}
            </p>
          </div>

          <div className="login-tabs">
            <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
              Login Peserta / Admin
            </button>
            <button type="button" className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
              Daftar Lembaga / Akun
            </button>
          </div>

          {tab === 'login' ? (
            <form className="login-form" onSubmit={submit}>
              <div className="login-form-label">Pilih Jenis Akun (Isi Username &amp; Password Secara Manual):</div>
              <div className="role-switch">
                {ROLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={role === item.id ? 'active' : ''}
                    onClick={() => setRole(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="login-field">
                <span>Username</span>
                <div className="login-input">
                  <Icon name="user" size={16} />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Ketik username Anda..."
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-input">
                  <Icon name="lock" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ketik password Anda..."
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Tampilkan password"
                    onClick={() => setShowPassword((show) => !show)}
                  >
                    <Icon name="eye" size={15} />
                  </button>
                </div>
              </label>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="btn primary login-submit">
                LOGIN SCBT ONLINE <Icon name="arrow-right" size={16} />
              </button>

              <div className="login-hint">
                Autentikasi manual Admin · User · Peserta/Instansi · <span className="mono">Offline-First IndexedDB</span>
              </div>
              <div className="login-hint">
                Akun demo — admin: <span className="mono">admin / admin123</span> · guru:{' '}
                <span className="mono">user / user123</span> · peserta: <span className="mono">peserta / peserta123</span>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={submitRegister}>
              <label className="login-field">
                <span>Nama Lembaga / Pengguna</span>
                <div className="login-input">
                  <Icon name="users" size={16} />
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Contoh: SMA Negeri 1 Nusantara"
                    required
                  />
                </div>
              </label>
              <label className="login-field">
                <span>Email</span>
                <div className="login-input">
                  <Icon name="send" size={16} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="admin@sekolah.sch.id"
                  />
                </div>
              </label>
              <label className="login-field">
                <span>Username</span>
                <div className="login-input">
                  <Icon name="user" size={16} />
                  <input
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    placeholder="username operator"
                    required
                  />
                </div>
              </label>
              <label className="login-field">
                <span>Password</span>
                <div className="login-input">
                  <Icon name="lock" size={16} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
              </label>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="btn primary login-submit">
                DAFTAR SEKARANG <Icon name="arrow-right" size={16} />
              </button>
              <div className="login-hint">Akun baru dibuat dengan peran User / Guru / Operator.</div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
