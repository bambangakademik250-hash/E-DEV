interface IconProps {
  name:
    | 'grid'
    | 'users'
    | 'book'
    | 'monitor'
    | 'chat'
    | 'file'
    | 'settings'
    | 'exam'
    | 'plus'
    | 'edit'
    | 'trash'
    | 'search'
    | 'close'
    | 'refresh'
    | 'cloud'
    | 'offline'
    | 'download'
    | 'upload'
    | 'play'
    | 'pause'
    | 'check'
    | 'clock'
    | 'award'
    | 'qr'
    | 'sparkles'
    | 'shield'
    | 'arrow-right'
    | 'eye'
    | 'user'
    | 'lock'
    | 'menu'
    | 'logout'
    | 'send'
    | 'printer'
    | 'map-pin'
    | 'chevron-down';
  size?: number;
}

const PATHS: Record<IconProps['name'], string> = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  users:
    'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 4.2a3.5 3.5 0 0 1 0 6.6M21 20v-1.5a4 4 0 0 0-3-3.8',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 5.5v15M8 7h8M8 11h6',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  chat: 'M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 1 1 21 12z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  exam: 'M9 3h6v3H9zM7 4.5H5.5A1.5 1.5 0 0 0 4 6v13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V6a1.5 1.5 0 0 0-1.5-1.5H17M8 11h8M8 15h5',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  close: 'M6 6l12 12M18 6L6 18',
  refresh: 'M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7',
  cloud: 'M7 18a4 4 0 0 1-.6-7.9A5.5 5.5 0 0 1 17.2 9 4 4 0 0 1 17 18z',
  offline: 'M3 3l18 18M7 18a4 4 0 0 1-.6-7.9M10.6 6.2A5.5 5.5 0 0 1 17.2 9 4 4 0 0 1 17 18h-2',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  play: 'M8 5l11 7-11 7z',
  pause: 'M9 5v14M15 5v14',
  check: 'M4 12.5l5 5L20 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  award: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 14L7 22l5-3 5 3-1.5-8',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  sparkles: 'M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z',
  shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6zM9 12l2 2 4-4',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  lock: 'M6 11h12v10H6zM9 11V7a3 3 0 0 1 6 0v4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10',
  send: 'M21 3L3 10.5l7 3 3 7z',
  printer: 'M7 8V3h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z',
  'map-pin': 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  'chevron-down': 'M6 9l6 6 6-6',
};

export default function Icon({ name, size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
