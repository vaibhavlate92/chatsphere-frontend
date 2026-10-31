import { useState } from 'react';
import http, { errMsg } from '../api/http';
import { useAuth } from '../context/AuthContext';
import PremiumModal from '../components/PremiumModal';

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function Profile() {
  const { user, refresh } = useAuth();
  const [edit, setEdit] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [f, setF] = useState({ username: user.username, country: user.country || '', state: user.state || '' });
  const [err, setErr] = useState('');

  const save = async () => {
    try { await http.put('/user/profile', { ...f, countryCode: undefined }); await refresh(); setEdit(false); setErr(''); }
    catch (e) { setErr(errMsg(e)); }
  };
  const rows = [['Email', user.email], ['Gender', user.gender], ['Country', `${user.countryFlag || ''} ${user.country || '—'}`], ['State', user.state || '—'],
    ['Joined', fmt(user.createdAt)], ['Premium', user.premium ? '⭐ Active' : 'Not active'], ['Subscription expiry', user.premium ? fmt(user.premiumUntil) : '—']];

  return (
    <div className="container py-5" style={{ maxWidth: 680 }}>
      <div className="cs-card p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <span className="avatar" style={{ width: 72, height: 72, fontSize: '1.8rem' }}>{user.username[0].toUpperCase()}</span>
          <div><h3 className="mb-0">{user.username} {user.premium && <span className="premium-badge align-middle">⭐ Premium</span>}</h3><span className="text-muted-cs">{user.countryFlag} {user.country}</span></div>
        </div>
        {edit ? (
          <>
            {err && <div className="cs-error mb-3">{err}</div>}
            <input className="form-control mb-2" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} aria-label="Username" />
            <input className="form-control mb-2" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} aria-label="Country" />
            <input className="form-control mb-3" value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} aria-label="State" />
            <div className="d-flex gap-2"><button className="btn-ghost" onClick={() => setEdit(false)}>Cancel</button><button className="btn-grad" onClick={save}>Save changes</button></div>
          </>
        ) : (
          <>
            <dl className="row mb-4">{rows.map(([k, v]) => (<><dt className="col-5 text-muted-cs fw-normal" key={k}>{k}</dt><dd className="col-7" key={k + 'v'}>{v}</dd></>))}</dl>
            <div className="d-flex gap-2"><button className="btn-ghost" onClick={() => setEdit(true)}>Edit Profile</button><button className="btn-grad" onClick={() => setUpgrade(true)}>{user.premium ? 'Extend Premium' : 'Upgrade Profile'}</button></div>
          </>
        )}
      </div>
      {upgrade && <PremiumModal onClose={() => setUpgrade(false)} />}
    </div>
  );
}
