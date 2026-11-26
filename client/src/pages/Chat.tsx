import { useEffect, useRef, useState } from 'react';
import { sendChat, useAppState, useSession } from '../lib/store';
import { EmptyState, Panel } from '../components/ui';
import Icon from '../components/Icon';
import { formatTime } from '../lib/format';

export default function ChatPage() {
  const { workspace } = useAppState();
  const user = useSession();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [workspace.chat.length]);

  const submit = () => {
    if (!text.trim()) return;
    sendChat(text);
    setText('');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Obrolan Grup</h1>
          <p className="page-sub">Komunikasi guru, operator, dan peserta — pesan tersimpan offline</p>
        </div>
        <span className="chip chip-blue">
          <Icon name="users" size={13} /> {workspace.chat.length} pesan
        </span>
      </div>

      <Panel className="chat-panel">
        <div className="chat-list">
          {workspace.chat.map((message) => {
            const mine = message.userId === user?.id;
            return (
              <div className={`chat-row${mine ? ' mine' : ''}`} key={message.id}>
                <div className="chat-bubble">
                  <div className="chat-meta">
                    <strong>{message.name}</strong>
                    <span className="muted small">
                      {message.role === 'admin' ? 'Admin' : message.role === 'user' ? 'Guru / Operator' : 'Peserta'} ·{' '}
                      {formatTime(message.at)}
                    </span>
                  </div>
                  <p>{message.text}</p>
                </div>
              </div>
            );
          })}
          {workspace.chat.length === 0 && <EmptyState title="Belum ada pesan" hint="Kirim pesan pertama ke grup." />}
          <div ref={endRef} />
        </div>

        <div className="chat-input">
          <input
            className="input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            placeholder="Tulis pesan untuk grup…"
            aria-label="Tulis pesan"
          />
          <button type="button" className="btn primary" onClick={submit}>
            <Icon name="send" size={16} /> Kirim
          </button>
        </div>
      </Panel>
    </div>
  );
}
