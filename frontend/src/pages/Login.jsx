import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/http';

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '', remember: true });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const to = loc.state?.from || '/dashboard';
  if (user) return <Navigate to={to} replace />;

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(f.email, f.password, f.remember); nav(to, { replace: true }); }
    catch (x) { setErr(errMsg(x)); }
    setBusy(false);
  };

  return (
    <div className="auth-right" style={{ minHeight: 'calc(100dvh - 66px)' }}>
      <form className="auth-form cs-card p-4" onSubmit={submit}>
        <h3 className="mb-4">Welcome back</h3>
        {err && <div className="cs-error mb-3">{err}</div>}
        <label className="form-label" htmlFor="email">Email</label>
        <input id="email" type="email" className="form-control mb-3" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <label className="form-label" htmlFor="pw">Password</label>
        <input id="pw" type="password" className="form-control mb-3" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <div className="d-flex justify-content-between mb-4">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="rem" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} />
            <label className="form-check-label" htmlFor="rem">Remember me</label>
          </div>
          <Link to="/forgot">Forgot password?</Link>
        </div>
        <button className="btn-grad w-100" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        <p className="text-muted-cs text-center mt-3 mb-0">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}

export function Forgot() {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
      <h3>Reset your password</h3>
      <p className="text-muted-cs">Password reset by email is not set up yet. It needs an email provider (SMTP) and a reset-token endpoint on the backend.</p>
      <Link to="/login" className="btn-ghost">Back to login</Link>
    </div>
  );
}
