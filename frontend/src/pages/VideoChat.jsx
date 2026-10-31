import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatSession } from '../hooks/useChatSession';
import { useWebRTC } from '../hooks/useWebRTC';
import ChatPanel from '../components/ChatPanel';
import ReportModal from '../components/ReportModal';

const REACTIONS = [['👍', 'Like'], ['❤️', 'Love'], ['🔥', 'Fire'], ['😂', 'Laugh'], ['😮', 'Wow'], ['👏', 'Clap']];
const pad = (n) => String(n).padStart(2, '0');
const clock = (sec) => `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;

export default function VideoChat() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const pref = ['MALE', 'FEMALE', 'BOTH'].includes(sp.get('pref')) ? sp.get('pref') : null;

  const [localStream, setLocalStream] = useState(null);
  const [mediaErr, setMediaErr] = useState('');
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [panel, setPanel] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [report, setReport] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const remoteEl = useRef(null);
  const localEl = useRef(null);
  const screenTrack = useRef(null);
  const signalRef = useRef(() => {});

  const session = useChatSession({ mode: 'VIDEO', preferred: pref, onSignal: (m) => signalRef.current(m) });
  const rtc = useWebRTC({ match: localStream ? session.match : null, localStream, sendSignal: session.sendSignal });
  signalRef.current = rtc.handleSignal;

  // camera + mic with echo cancellation / noise suppression, HD with adaptive fallback
  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 }, facingMode: 'user' },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    }).then((s) => { stream = s; setLocalStream(s); })
      .catch(() => setMediaErr('Camera and microphone access is needed for video chat. Allow access in your browser and reload.'));
    return () => { stream?.getTracks().forEach((t) => t.stop()); screenTrack.current?.stop(); };
  }, []);

  useEffect(() => { if (localEl.current) localEl.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (remoteEl.current) remoteEl.current.srcObject = rtc.remoteStream; }, [rtc.remoteStream]);
  useEffect(() => { if (panel) session.clearUnread(); }, [panel, session.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // call timer restarts with every new stranger
  useEffect(() => {
    setSeconds(0);
    if (!session.match) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [session.match?.roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (kind) => {
    const on = kind === 'audio' ? !mic : !cam;
    localStream?.getTracks().filter((t) => t.kind === kind).forEach((t) => { t.enabled = on; });
    kind === 'audio' ? setMic(on) : setCam(on);
  };

  const stopShare = async () => {
    screenTrack.current?.stop(); screenTrack.current = null;
    const camTrack = localStream?.getVideoTracks()[0];
    if (camTrack) await rtc.replaceVideoTrack(camTrack);
    if (localEl.current) localEl.current.srcObject = localStream;
    setSharing(false);
  };

  const startShare = async () => {
    try {
      const d = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = d.getVideoTracks()[0];
      screenTrack.current = track;
      track.onended = stopShare;
      await rtc.replaceVideoTrack(track);
      if (localEl.current) localEl.current.srcObject = d;
      setSharing(true);
    } catch { /* user cancelled the picker */ }
  };

  const status = (() => {
    if (!session.match) return null;
    if (rtc.connState === 'connected') return ['🟢', 'Connected', 'var(--cs-ok)'];
    if (['disconnected', 'connecting', 'new'].includes(rtc.connState)) return ['🟡', 'Reconnecting', '#F59E0B'];
    return ['🔴', 'Disconnected', 'var(--cs-bad)'];
  })();
  const p = session.match?.partner;
  const waiting = !session.match;

  if (mediaErr) return <div className="vh-100 d-grid place-items-center text-center p-4"><div><div className="cs-error mb-3">{mediaErr}</div><button className="btn-ghost" onClick={() => nav('/dashboard')}>Back to dashboard</button></div></div>;

  return (
    <div className="vc-root">
      <video ref={remoteEl} className="vc-remote" autoPlay playsInline />
      <div className="vc-overlay" />

      {waiting && (
        <div className="vc-wait">
          <div>
            <div className="spinner-ring" />
            <h4>{session.status === 'ended' && session.error ? 'Could not find a match' : session.status === 'ended' ? 'Stranger left' : 'Looking for someone…'}</h4>
            <p className="text-muted-cs mb-0">{session.error || (session.status === 'ended' ? 'Searching again…' : 'No matching users currently online. Please wait…')}</p>
          </div>
        </div>
      )}

      <div className="vc-top-left">
        <button className="vc-msg-btn glass" onClick={() => setPanel((v) => !v)} aria-label="Open messages" aria-expanded={panel}>
          💬{session.unread > 0 && !panel && <span className="vc-dot" />}
        </button>
        {p && (
          <div className="vc-info glass">
            <strong>{p.username}</strong> {p.premium && <span className="premium-badge">⭐</span>}
            <div className="small" style={{ color: status?.[2] }}>{status?.[0]} {status?.[1]}</div>
            <div className="small text-muted-cs">{p.countryFlag} {p.country}{p.state ? ` · ${p.state}` : ''}</div>
          </div>
        )}
      </div>
      <div className="vc-top-right glass" aria-label="Call timer">{clock(seconds)}</div>

      <AnimatePresence>
        {panel && (
          <motion.aside className="vc-sidebar glass" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: .25 }} aria-label="Messages">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: 'var(--cs-line)' }}>
              <strong>Messages</strong><button className="btn-close btn-close-white" onClick={() => setPanel(false)} aria-label="Close messages" />
            </div>
            <ChatPanel messages={session.messages} typing={session.partnerTyping} disabled={!session.match} onSend={session.sendChat} onTyping={session.sendTyping} />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="vc-local">
        <video ref={localEl} autoPlay playsInline muted className={sharing ? 'sharing' : ''} />
        <span className="you">YOU</span>
      </div>

      <AnimatePresence>
        {session.reactions.map((r) => (
          <motion.div key={r.id} className="float-react" style={{ left: `${r.x}%` }} initial={{ opacity: 0, y: 0, scale: .6 }} animate={{ opacity: [0, 1, 1, 0], y: -320, scale: 1.2 }} transition={{ duration: 2.4 }}>{r.emoji}</motion.div>
        ))}
      </AnimatePresence>

      {reactOpen && (
        <div className="vc-react-pop glass">
          {REACTIONS.map(([e, label]) => (
            <button key={e} title={label} aria-label={label} onClick={() => { session.sendReaction(e); setReactOpen(false); }} disabled={waiting}>{e}</button>
          ))}
        </div>
      )}

      <div className="vc-bar glass">
        <button className={`ctl ${mic ? '' : 'off'}`} onClick={() => toggle('audio')} aria-label={mic ? 'Mute microphone' : 'Unmute microphone'} title="Microphone">{mic ? '🎤' : '🔇'}</button>
        <button className={`ctl ${cam ? '' : 'off'}`} onClick={() => toggle('video')} aria-label={cam ? 'Turn camera off' : 'Turn camera on'} title="Camera">{cam ? '📷' : '🚫'}</button>
        {!sharing
          ? <button className="ctl" onClick={startShare} disabled={waiting} aria-label="Share screen" title="Share screen">🖥</button>
          : <button className="ctl off" onClick={stopShare} aria-label="Stop sharing" title="Stop sharing">🛑</button>}
        <button className="ctl" onClick={() => setReactOpen((v) => !v)} aria-label="Reactions" title="Reactions">😍</button>
        <button className="ctl" onClick={() => setReport(true)} disabled={waiting} aria-label="Report user" title="Report user">⚠</button>
        <button className="ctl next" onClick={() => { if (sharing) stopShare(); session.next(); }}>⏭ Next</button>
        <button className="ctl off" onClick={async () => { await session.leave(); nav('/dashboard'); }} aria-label="Leave" title="Leave">✕</button>
      </div>

      {report && <ReportModal onClose={() => setReport(false)} />}
    </div>
  );
}
