import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useChatSession } from '../hooks/useChatSession';
import ChatPanel from '../components/ChatPanel';
import ReportModal from '../components/ReportModal';

export default function TextChat() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const pref = ['MALE', 'FEMALE', 'BOTH'].includes(sp.get('pref')) ? sp.get('pref') : null;
  const s = useChatSession({ mode: 'TEXT', preferred: pref });
  const [report, setReport] = useState(false);
  useEffect(() => { document.title = 'Text chat – ChatSphere'; }, []);

  const p = s.match?.partner;
  return (
    <div className="tc-wrap">
      <div className="tc-box glass overflow-hidden">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: 'var(--cs-line)' }}>
          {s.status === 'connected' && p ? (
            <div>
              <strong>{p.username}</strong> {p.premium && <span className="premium-badge">⭐</span>}
              <div className="small text-muted-cs"><span style={{ color: 'var(--cs-ok)' }}>🟢 Connected</span> · {p.countryFlag} {p.country}{p.state ? `, ${p.state}` : ''}</div>
            </div>
          ) : (
            <div><strong>{s.status === 'searching' || s.status === 'connecting' ? 'Looking for someone…' : 'Not connected'}</strong>
              <div className="small text-muted-cs">{s.status === 'searching' ? 'No matching users currently online. Please wait…' : s.status === 'ended' && !s.error ? 'Stranger left. Searching again…' : ''}</div></div>
          )}
          <div className="d-flex gap-2">
            {s.status === 'connected' && <button className="btn-ghost" onClick={() => setReport(true)} aria-label="Report user">⚠ Report</button>}
            <button className="btn-grad" onClick={s.next}>Next Stranger</button>
            <button className="btn-ghost" onClick={async () => { await s.leave(); nav('/dashboard'); }}>Disconnect</button>
          </div>
        </div>
        {s.error && <div className="cs-error m-3">{s.error}</div>}
        <ChatPanel messages={s.messages} typing={s.partnerTyping} disabled={s.status !== 'connected'} onSend={s.sendChat} onTyping={s.sendTyping} />
      </div>
      {report && <ReportModal onClose={() => setReport(false)} />}
    </div>
  );
}
