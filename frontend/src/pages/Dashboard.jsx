import { useEffect, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import StartButtons from '../components/StartButtons';

export default function Dashboard() {
  const { user } = useAuth();
  const [online, setOnline] = useState(null);
  useEffect(() => { http.get('/chat/online').then((r) => setOnline(r.data.count)).catch(() => {}); }, []);

  return (
    <div className="container-xl py-5">
      <h2 className="mb-1">Welcome, {user.username} {user.premium && <span className="premium-badge align-middle">⭐ Premium</span>}</h2>
      <p className="text-muted-cs mb-4">{online != null ? `${online} people online right now.` : 'Pick how you want to meet someone.'}</p>
      <StartButtons render={(go) => (
        <div className="row g-4">
          <div className="col-md-6"><button className="action-card glass" onClick={() => go('text')}><div className="ico">💬</div><h4 className="mt-2">Start Text Chat</h4><p className="text-muted-cs mb-0">Chat with a random stranger.</p></button></div>
          <div className="col-md-6"><button className="action-card glass" onClick={() => go('video')}><div className="ico">🎥</div><h4 className="mt-2">Start Video Chat</h4><p className="text-muted-cs mb-0">Face to face, one tap away.</p></button></div>
        </div>
      )} />
    </div>
  );
}
