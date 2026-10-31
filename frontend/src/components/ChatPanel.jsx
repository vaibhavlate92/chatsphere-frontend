import { useEffect, useRef, useState } from 'react';
import EmojiPicker from './EmojiPicker';

/** Message list + composer shared by the text chat page and the video chat sidebar. */
export default function ChatPanel({ messages, typing, disabled, onSend, onTyping }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const submit = (e) => { e.preventDefault(); if (text.trim() && !disabled) { onSend(text); setText(''); setEmoji(false); } };

  return (
    <>
      <div className="msg-list" aria-live="polite">
        {!messages.length && <div className="sys-note">{disabled ? 'Waiting for a stranger…' : 'You are connected. Say hi!'}</div>}
        {messages.map((m, i) => <div key={i} className={`bubble ${m.from}`}>{m.text}</div>)}
        {typing && <div className="sys-note">Stranger is typing…</div>}
        <div ref={end} />
      </div>
      <form className="d-flex gap-2 p-2 position-relative" onSubmit={submit}>
        {emoji && <EmojiPicker onPick={(e) => setText((t) => t + e)} />}
        <button type="button" className="btn-ghost px-3" onClick={() => setEmoji((v) => !v)} aria-label="Emoji">😊</button>
        <input className="form-control" value={text} maxLength={1000} disabled={disabled} placeholder="Type a message…"
               onChange={(e) => { setText(e.target.value); onTyping?.(); }} />
        <button className="btn-grad px-3" disabled={disabled || !text.trim()}>Send</button>
      </form>
    </>
  );
}
