import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import http, { errMsg } from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', email: '', password: '', confirmPassword: '', gender: '', country: '', countryCode: '', state: '', ageConfirmed: false });
  const [flag, setFlag] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // Auto-detect country/state from the visitor's IP (server-side lookup)
  useEffect(() => {
    http.get('/geo/detect').then(({ data }) => {
      if (data.country) { setF((s) => ({ ...s, country: data.country, countryCode: data.countryCode || '', state: data.state || '' })); setFlag(data.flag || ''); }
    }).catch(() => {});
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.ageConfirmed) return setErr('You must be 18 years or older to use ChatSphere.');
    if (!f.gender) return setErr('Please select your gender.');
    if (f.password !== f.confirmPassword) return setErr('Passwords do not match.');
    setBusy(true);
    try { await register(f); nav('/dashboard', { replace: true }); }
    catch (x) { setErr(errMsg(x)); }
    setBusy(false);
  };

  return (
    <div className="row g-0 auth-split">
      <div className="col-lg-5 auth-left">
        <div className="brand mb-4"><span className="logo-mark">💬</span>ChatSphere</div>
        <h2 className="mb-3">Welcome to ChatSphere</h2>
        <p className="text-muted-cs" style={{ maxWidth: 380 }}>Create your account and start talking to someone new in seconds. Premium members can choose who they meet.</p>
      </div>
      <div className="col-lg-7 auth-right">
        <form className="auth-form" onSubmit={submit} noValidate>
          <h3 className="mb-4">Create your account</h3>
          {err && <div className="cs-error mb-3" role="alert">{err}</div>}
          <input className="form-control mb-3" placeholder="Username" autoComplete="username" value={f.username} onChange={set('username')} />
          <input type="email" className="form-control mb-3" placeholder="Email" autoComplete="email" value={f.email} onChange={set('email')} />
          <div className="row g-3 mb-3">
            <div className="col-sm-6"><input type="password" className="form-control" placeholder="Password" autoComplete="new-password" value={f.password} onChange={set('password')} /></div>
            <div className="col-sm-6"><input type="password" className="form-control" placeholder="Confirm password" autoComplete="new-password" value={f.confirmPassword} onChange={set('confirmPassword')} /></div>
          </div>
          <div className="mb-3 d-flex gap-4">
            {['MALE', 'FEMALE'].map((g) => (
              <div className="form-check" key={g}>
                <input className="form-check-input" type="radio" name="gender" id={g} checked={f.gender === g} onChange={() => setF({ ...f, gender: g })} />
                <label className="form-check-label" htmlFor={g}>{g === 'MALE' ? 'Male' : 'Female'}</label>
              </div>
            ))}
          </div>
          <div className="row g-3 mb-3">
            <div className="col-sm-6"><div className="input-group"><span className="input-group-text" aria-hidden="true" style={{ background: '#121212', borderColor: 'var(--cs-line)' }}>{flag || '🌐'}</span><input className="form-control" placeholder="Country (auto-detected)" value={f.country} onChange={set('country')} /></div></div>
            <div className="col-sm-6"><input className="form-control" placeholder="State (auto-detected)" value={f.state} onChange={set('state')} /></div>
          </div>
          <div className="form-check mb-4">
            <input className="form-check-input" type="checkbox" id="age" checked={f.ageConfirmed} onChange={set('ageConfirmed')} />
            <label className="form-check-label small" htmlFor="age">I confirm that I am 18 years or older and agree to ChatSphere Terms &amp; Conditions.</label>
          </div>
          <button className="btn-grad w-100" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
          <p className="text-muted-cs text-center mt-3 mb-0">Already registered? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </div>
  );
}
