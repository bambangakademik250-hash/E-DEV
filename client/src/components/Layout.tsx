import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppState } from '../lib/store';
import Icon from './Icon';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'grid' as const, end: true },
  { to: '/peserta', label: 'Peserta', icon: 'users' as const },
  { to: '/ujian', label: 'Ujian', icon: 'book' as const },
  { to: '/monitor', label: 'Monitor', icon: 'monitor' as const },
];

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function Layout() {
  const { serverOnline, pending, syncing, toast } = useAppState();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <div className="app">
      <header className="hdr">
        <div className="brand">
          <span className="logo-sq">E</span>
          <div className="brand-text">
            <span className="brand-name">E-Ujian CBT</span>
            <span className="brand-sub">Platform Ujian Online &amp; Offline</span>
          </div>
        </div>

        <div className="hdr-right">
          {pending > 0 && (
            <span className="chip chip-amber" title="Perubahan menunggu dikirim ke server">
              {pending} antrean
            </span>
          )}
          <span className={`chip ${serverOnline ? 'chip-green' : 'chip-amber'}`}>
            <span className={`dot ${serverOnline ? 'dot-green' : 'dot-amber'}`} />
            {serverOnline ? (syncing ? 'Menyinkronkan…' : 'Terhubung') : 'Mode Offline'}
          </span>
          {installEvent && (
            <button
              type="button"
              className="btn ghost small install-btn"
              onClick={() => {
                void installEvent.prompt();
                setInstallEvent(null);
              }}
            >
              <Icon name="download" size={14} /> Pasang App
            </button>
          )}
          <span className="avatar" style={{ width: 30, height: 30, background: 'rgba(79,124,255,.18)', color: '#4f7cff', fontSize: 11 }}>
            AD
          </span>
        </div>
      </header>

      <div className="app-body">
        <nav className="rail" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}`}
              title={item.label}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="main">
          <Outlet />
        </main>
      </div>

      {toast && (
        <div className={`toast ${toast.kind === 'warn' ? 'toast-warn' : ''}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
