import { useState } from 'react';
import http, { errMsg } from '../api/http';
import { useAuth } from '../context/AuthContext';

const PERKS = ['Gender Filter', 'Premium Badge', 'Priority Matching', 'Faster Connection', 'Premium Features'];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve; s.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(s);
  });
}

export default function PremiumModal({ onClose }) {
  const { user, refresh } = useAuth();
  const [plan, setPlan] = useState('MONTHLY');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const pay = async () => {
    if (!user) return;
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await loadRazorpay();
      const { data: order } = await http.post('/premium/create-order', { plan });   // price is set by the server
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: 'ChatSphere Premium', description: plan === 'MONTHLY' ? 'Monthly plan' : 'Yearly plan',
        prefill: { name: user.username, email: user.email },
        theme: { color: '#8B5CF6' },
        // The handler result is NOT trusted: the backend re-verifies the signature before activating anything.
        handler: async (resp) => {
          try {
            await http.post('/premium/verify-payment', resp);
            await refresh();
            setMsg({ type: 'ok', text: 'Payment verified. Premium is now active.' });
          } catch (e) { setMsg({ type: 'err', text: errMsg(e, 'Payment could not be verified.') }); }
          setBusy(false);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', () => { setMsg({ type: 'err', text: 'Payment failed. You have not been charged for Premium.' }); setBusy(false); });
      rzp.open();
    } catch (e) { setMsg({ type: 'err', text: errMsg(e) }); setBusy(false); }
  };

  return (
    <div className="modal-cs" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" role="dialog" aria-modal="true" aria-label="ChatSphere Premium">
        <div className="d-flex justify-content-between align-items-start">
          <h4 className="mb-3">ChatSphere Premium</h4>
          <button className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
        </div>
        <ul className="list-unstyled mb-4">{PERKS.map((p) => <li key={p} className="mb-1">✅ {p}</li>)}</ul>
        <div className="d-flex gap-2 mb-3">
          <button className={`plan ${plan === 'MONTHLY' ? 'sel' : ''}`} onClick={() => setPlan('MONTHLY')}><strong>₹99</strong><div className="text-muted-cs small">per month</div></button>
          <button className={`plan ${plan === 'YEARLY' ? 'sel' : ''}`} onClick={() => setPlan('YEARLY')}><strong>₹499</strong><div className="text-muted-cs small">per year</div></button>
        </div>
        {msg.text && <div className={msg.type === 'ok' ? 'alert alert-success py-2' : 'cs-error mb-3'}>{msg.text}</div>}
        <button className="btn-grad w-100" disabled={busy} onClick={pay}>{busy ? 'Processing…' : 'Upgrade Now'}</button>
      </div>
    </div>
  );
}
