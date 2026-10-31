import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PreferenceModal from './PreferenceModal';

/** Landing + dashboard entry point. Guests go to login; premium users get the gender-preference popup first. */
export default function StartButtons({ render }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [pick, setPick] = useState(null);

  const go = (mode) => {
    const path = mode === 'text' ? '/text' : '/video';
    if (!user) return nav('/login', { state: { from: path } });
    if (user.premium) return setPick(path);
    nav(path);
  };

  return (
    <>
      {render(go)}
      {pick && <PreferenceModal onClose={() => setPick(null)} onConfirm={(p) => nav(`${pick}?pref=${p}`)} />}
    </>
  );
}
