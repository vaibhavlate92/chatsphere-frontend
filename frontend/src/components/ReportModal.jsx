import { useState } from 'react';
import http, { errMsg } from '../api/http';

const REASONS = ['Abuse', 'Nudity', 'Spam', 'Harassment', 'Inappropriate Behavior'];

export default function ReportModal({ onClose }) {
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const toggle = (r) => setSel((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));

  const submit = async () => {
    try { const { data } = await http.post('/chat/report', { reasons: sel }); setMsg(data.message); setDone(true); }
    catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <div className="modal-cs" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" role="dialog" aria-modal="true" aria-label="Report user">
        <h4 className="mb-3">Report this user</h4>
        {!done && REASONS.map((r) => (
          <div className="form-check mb-2" key={r}>
            <input className="form-check-input" type="checkbox" id={`r-${r}`} checked={sel.includes(r)} onChange={() => toggle(r)} />
            <label className="form-check-label" htmlFor={`r-${r}`}>{r}</label>
          </div>
        ))}
        {msg && <div className={done ? 'alert alert-success py-2 mt-3' : 'cs-error mt-3'}>{msg}</div>}
        <div className="d-flex gap-2 mt-4">
          <button className="btn-ghost flex-fill" onClick={onClose}>{done ? 'Close' : 'Cancel'}</button>
          {!done && <button className="btn-grad flex-fill" disabled={!sel.length} onClick={submit}>Submit</button>}
        </div>
      </div>
    </div>
  );
}
