interface IconProps {
  name: 'grid' | 'users' | 'book' | 'monitor' | 'plus' | 'edit' | 'trash' | 'search' | 'close' | 'refresh' | 'cloud' | 'offline' | 'download';
  size?: number;
}

const PATHS: Record<IconProps['name'], string> = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  users:
    'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 4.2a3.5 3.5 0 0 1 0 6.6M21 20v-1.5a4 4 0 0 0-3-3.8',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 5.5v15M8 7h8M8 11h6',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  close: 'M6 6l12 12M18 6L6 18',
  refresh: 'M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7',
  cloud: 'M7 18a4 4 0 0 1-.6-7.9A5.5 5.5 0 0 1 17.2 9 4 4 0 0 1 17 18z',
  offline: 'M3 3l18 18M7 18a4 4 0 0 1-.6-7.9M10.6 6.2A5.5 5.5 0 0 1 17.2 9 4 4 0 0 1 17 18h-2',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
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
