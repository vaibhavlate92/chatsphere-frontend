import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PremiumModal from './PremiumModal';
import logo from '../assets/chatsphere.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <>
      <header className="cs-nav">
        <div className="container-xl d-flex align-items-center justify-content-between py-2">
          <Link to={user ? '/dashboard' : '/'} className="brand">
            <span className="logo-mark"><img src={logo} alt="ChatSphere Logo" /></span>Chat Sphere
          </Link>
          {!user ? (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-grad">Register</Link>
            </div>
          ) : (
            <div className="position-relative" ref={ref}>
              <button className="user-chip" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
                <span className="avatar">{user.username[0].toUpperCase()}</span>
                <span>{user.username}</span>
                {user.premium && <span className="premium-badge">⭐ Premium</span>}
                <span aria-label={user.country}>{user.countryFlag}</span>
              </button>
              {open && (
                <div className="dd-menu glass" role="menu">
                  <Link to="/profile" onClick={() => setOpen(false)}>My Profile</Link>
                  <Link to="/payments" onClick={() => setOpen(false)}>Payment History</Link>
                  <button onClick={() => { setOpen(false); setUpgrade(true); }}>Upgrade Profile</button>
                  <button onClick={async () => { await logout(); nav('/'); }}>Logout</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      {upgrade && <PremiumModal onClose={() => setUpgrade(false)} />}
    </>
  );
}
