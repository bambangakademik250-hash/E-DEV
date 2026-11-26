import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { logout, useAppState, useSession } from '../lib/store';
import { modulesForRole } from '../lib/modules';
import Icon from './Icon';
import { Avatar } from './ui';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  user: 'User / Guru',
  peserta: 'Peserta',
};

export default function Layout() {
  const app = useAppState();
  const user = useSession();
  const navigate = useNavigate();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!app.ready) {
    return <div className="boot">Memuat data offline…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { settings } = app.workspace;
  const modules = modulesForRole(user.role, settings.roleVisibility);
  const ribbon = settings.runningText;
  const ribbonBg = settings.customRibbonColor || ribbon.bgColor;
  const ribbonColor = settings.customRibbonTextColor || ribbon.textColor;

  return (
    <div className="app">
      {ribbon.enabled && ribbon.text && (
        <div
          className="ribbon"
          style={{
            background: ribbonBg,
            color: ribbonColor,
            fontSize: ribbon.fontSizePx,
            fontWeight: ribbon.bold ? 700 : 500,
          }}
        >
          <span className="ribbon-track">{ribbon.text}</span>
        </div>
      )}

      <header className="hdr">
        <div className="hdr-left">
          <button
            type="button"
            className="icon-btn only-mobile"
            aria-label="Buka menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="menu" size={20} />
          </button>
          <span className="logo">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="Logo" />
            ) : (
              <Icon name="shield" size={22} />
            )}
          </span>
          <div className="brand-text">
            <span className="brand-name">{settings.appTitle}</span>
            <span className="brand-sub">{settings.institutionName}</span>
          </div>
        </div>

        <div className="hdr-right">
          <span className="chip chip-violet" title="Poin institusi">
            <Icon name="sparkles" size={13} /> {settings.institutionPoints} poin
          </span>
          <span className={`chip ${app.serverOnline ? 'chip-green' : 'chip-amber'}`}>
            <span className={`dot ${app.serverOnline ? 'dot-green' : 'dot-amber'}`} />
            {app.serverOnline ? (app.syncing ? 'Menyinkronkan…' : 'Server Online') : 'Mode Offline'}
          </span>
          {installEvent && (
            <button
              type="button"
              className="btn ghost small only-desktop"
              onClick={() => {
                void installEvent.prompt();
                setInstallEvent(null);
              }}
            >
              <Icon name="download" size={14} /> Pasang App
            </button>
          )}
          <div className="user-wrap">
            <button type="button" className="user-btn" onClick={() => setUserMenu((open) => !open)}>
              <Avatar name={user.name} size={30} />
              <span className="user-meta only-desktop">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{ROLE_LABEL[user.role]}</span>
              </span>
              <Icon name="chevron-down" size={14} />
            </button>
            {userMenu && (
              <div className="user-menu">
                <div className="user-menu-head">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button
                  type="button"
                  className="user-menu-item"
                  onClick={() => {
                    setUserMenu(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                >
                  <Icon name="logout" size={15} /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-body">
        <nav className={`side${menuOpen ? ' open' : ''}`} aria-label="Menu aplikasi">
          <div className="side-label">Menu Aplikasi</div>
          {modules.map((module) => (
            <NavLink
              key={module.id}
              to={module.path}
              end={module.path === '/'}
              className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="side-icon">
                <Icon name={module.icon} size={17} />
              </span>
              <span className="side-text">
                <span className="side-title">{module.label}</span>
                <span className="side-desc">{module.desc}</span>
              </span>
            </NavLink>
          ))}
          <div className="side-foot">
            <span className={`dot ${app.serverOnline ? 'dot-green' : 'dot-amber'}`} />
            Offline-First IndexedDB
          </div>
        </nav>

        <main className="main">
          <Outlet />
        </main>
      </div>

      {app.toast && (
        <div className={`toast ${app.toast.kind === 'warn' ? 'toast-warn' : ''}`} role="status">
          {app.toast.msg}
        </div>
      )}
    </div>
  );
}
